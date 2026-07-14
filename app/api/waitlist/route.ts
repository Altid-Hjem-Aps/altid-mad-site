import { NextRequest, NextResponse, after } from 'next/server'
import { sendWaitlistConfirmation, sendReferralWelcome, scheduleReleaseEmail, sendReferralProgress, sendConsentConfirmation } from '@/lib/send-email'
import { sendWaitlistConfirmationSms } from '@/lib/send-sms'
import { trackServer, identifyServer } from '@/lib/amplitude.server'
import { recordReferral, mirrorSignup, getReferrerProgress, getSignupByEmail, getUnsubToken, isUnsubscribed, checkRateLimit, checkRateLimitStrict, getQueuePosition } from '@/lib/db'
import {
  CONSENT_VERSION,
  CONFIRM_SENT_HEADING,
  confirmSentBody,
  DUPLICATE_ERROR,
  LOOKUP_FAILED_ERROR,
  CONFIRM_SENDS_PER_HOUR,
} from '@/lib/copy'
import { signConfirmToken, assertConsentTokenConfigured } from '@/lib/consent-token'
import { syncContactTags, addAudienceContact } from '@/lib/resend'
import { normalizeSignupSource } from '@/lib/signup-source'
import { assertSurveyTokenConfigured, signSurveyToken, verifySurveyToken } from '@/lib/survey-token'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.altidhjem.dk'
// Pinned, not req.nextUrl.origin: the confirmation link carries a consent token,
// and its host should not be derived from a request header.
const SITE_ORIGIN = 'https://altidmad.dk'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\d{8}$/

const WINDOW_SECONDS = 60 * 60 // 1 hour
const MAX_ATTEMPTS = 3

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ugyldig anmodning' }, { status: 400 })
  }

  if (body.step === 1) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (await checkRateLimit(`signup:${ip}`, MAX_ATTEMPTS, WINDOW_SECONDS))
      return NextResponse.json({ success: false, error: 'For mange forsøg. Prøv igen om en time.' }, { status: 429 })

    const { email, name, phone, referredBy, consent } = body
    const signupSource = normalizeSignupSource(body.source)
    // Normalise the documented marketing consent before it is stored: coerce the
    // two choices to real booleans. A malformed or absent consent object records
    // as "no consent" rather than trusting the body. The wording version is
    // stamped server-side (not read from the body): the server knows which text
    // it served, so the consent audit trail can never be poisoned by a tampered
    // client sending an arbitrary version string.
    const consentInput =
      consent && typeof consent === 'object'
        ? {
            version: CONSENT_VERSION,
            mad: consent.mad === true,
            group: consent.group === true,
          }
        : undefined

    if (!email || !EMAIL_RE.test(email))
      return NextResponse.json({ success: false, error: 'Ugyldig e-mail' }, { status: 400 })
    // Mobile is optional for the user (data minimisation — an email is enough to
    // give notice at launch). Validate the format only when one is supplied.
    const rawPhone = phone ? String(phone).replace(/\s/g, '') : ''
    if (rawPhone && !PHONE_RE.test(rawPhone))
      return NextResponse.json({ success: false, error: 'Ugyldigt mobilnummer' }, { status: 400 })
    // TEMPORARY BRIDGE — REMOVE once the backend makes Mobile optional (follow-up PR).
    // The upstream API marks Mobile as [Required] (verified: 400 when missing) but does
    // NOT validate the format (verified: it accepts 00000000). So when the user leaves
    // mobile blank we send an obviously-fake sentinel that reads as "no number given":
    // it is not a real Danish MSISDN (can never receive an SMS), is not anyone's real
    // number, and is trivially identifiable for cleanup (WHERE mobile = '00000000').
    // Sent ONLY upstream: never SMSed (the confirmation SMS below is gated on the user's
    // own number, cleanPhone) and never mirrored to Supabase. Scrub these rows when the
    // backend change lands.
    const FALLBACK_MOBILE = '00000000'
    const upstreamMobile = rawPhone || FALLBACK_MOBILE
    if (!name || String(name).trim().length < 2)
      return NextResponse.json({ success: false, error: 'Navn mangler' }, { status: 400 })

    // Fail fast on missing survey-token secret BEFORE registering the user
    // upstream — otherwise signSurveyToken throws after side effects and the
    // user is enrolled but sees a 500, then 409 on retry.
    assertSurveyTokenConfigured()
    // Same reason: the 409 path below mints a confirmation token, and a missing
    // secret there would throw after the upstream registration side effect.
    assertConsentTokenConfigured()

    const res = await fetch(`${API_URL}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(name).trim(),
        mobile: upstreamMobile,
        email: String(email).toLowerCase().trim(),
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.status === 409) {
      // Tell Hjem signups they are already covered instead of a bare "already
      // signed up" — the two sites share one waitlist. Include their referral
      // link (public_id doubles as the public referral code) so a duplicate
      // signup can still invite friends and move up the queue.
      //
      // The anonymous form may NOT write consent: it cannot prove it owns the
      // email, so letting any re-signup merge consent would let a stranger flip
      // another person's marketing consent by knowing their address (PR #36).
      //
      // But refusing SILENTLY is what lost 36 people's consent on 14 Jul: they
      // ticked the boxes, were told "du er allerede skrevet op", and left
      // believing they had consented. So instead of discarding the ticks, we
      // hold them pending and mail a confirmation link to the address ON FILE.
      // Clicking that link is the proof of ownership the form could never give.
      const existing = await getSignupByEmail(String(email))
      const asked = consentInput?.mad === true || consentInput?.group === true

      // Nothing was ticked: no consent to capture, so the plain duplicate card is
      // still the honest answer.
      if (!asked) {
        return NextResponse.json(
          {
            success: false,
            error: DUPLICATE_ERROR,
            ...(existing ? { inviteUrl: `${SITE_ORIGIN}/?ref=${encodeURIComponent(existing.publicId)}` } : {}),
          },
          { status: 409 },
        )
      }

      // The lookup failed (Supabase slow — getSignupByEmail races a 2s timeout).
      // We must NOT fall back to "du er allerede skrevet op": that is the exact
      // sentence that told 36 people they were covered while their consent was
      // dropped. Say it failed, and let them retry.
      if (!existing) {
        return NextResponse.json({ success: false, error: LOOKUP_FAILED_ERROR }, { status: 503 })
      }

      // Only what they ticked AND do not already hold.
      const pending = {
        mad: consentInput?.mad === true && !existing.consentMad,
        group: consentInput?.group === true && !existing.consentGroup,
      }
      const hasPending = pending.mad || pending.group

      // We send ONLY when there is something to confirm, the person has not left
      // the list, and we have a token to build their unsubscribe link with.
      const shouldSend = hasPending && !existing.unsubscribed && Boolean(existing.unsubToken)

      if (shouldSend) {
        // Two limiters, both FAIL CLOSED. checkRateLimit returns false on any
        // error and false means "not limited", so using it here would let a
        // Supabase hiccup permit every send.
        //   per-address: stops one inbox being sprayed.
        //   global:      stops the endpoint being used to mail the whole list.
        // Without the global one, an attacker with rotating IPs sends one bare
        // mail per hour to EVERY non-consenting address on the shared list, from
        // our own verified domain.
        let allowed = false
        try {
          const perAddress = await checkRateLimitStrict(`consent-confirm:${String(email).toLowerCase().trim()}`, 1, 60 * 60)
          const global = await checkRateLimitStrict('consent-confirm:global', CONFIRM_SENDS_PER_HOUR, 60 * 60)
          allowed = !perAddress && !global
        } catch (e) {
          console.error('consent-confirm rate limit unavailable — refusing to send', e)
          allowed = false
        }

        if (allowed) {
          const token = signConfirmToken(existing.publicId, pending, Date.now() / 1000)
          await sendConsentConfirmation({
            name: existing.firstName || String(name).trim(),
            email: String(email).toLowerCase().trim(),
            confirmUrl: `${SITE_ORIGIN}/api/bekraeft?t=${encodeURIComponent(token)}`,
            unsubscribeUrl: `https://altidhjem.dk/api/unsubscribe?token=${encodeURIComponent(existing.unsubToken as string)}`,
            pending,
          })
          trackServer('Consent Confirmation Sent', { signup_id: existing.publicId }, existing.publicId)
        }
      }

      // ONE response for every ticked-consent duplicate, whatever we actually did.
      //
      // This is deliberate and it costs us a nicer screen. Distinguishing "we sent
      // you a link" from "you already have this consent" turns the endpoint into a
      // silent oracle: a stranger types your address, ticks one box, and reads your
      // marketing profile off the response — and you are never told, because no
      // mail is sent in the branch that leaks. Same body, same status, no
      // public_id, whether or not a mail went out.
      return NextResponse.json(
        { success: false, confirmSent: true, heading: CONFIRM_SENT_HEADING, error: confirmSentBody(String(email).toLowerCase().trim()) },
        { status: 409 },
      )
    }
    if (!res.ok)
      return NextResponse.json({ success: false, error: data.message ?? 'Noget gik galt' }, { status: res.status })

    const cleanName = String(name).trim()
    const cleanEmail = String(email).toLowerCase().trim()
    const cleanPhone = rawPhone
    const firstName = cleanName.split(' ')[0]
    const userId = data.id as string
    const refBy = referredBy ? String(referredBy).trim() : ''

    // Respond immediately; run all emails / DB sync AFTER the response so the
    // user isn't waiting on Resend + Supabase round-trips before "you're in".
    after(async () => {
      // Awaited (not fire-and-forget): inside after() an un-awaited promise can be
      // killed when the serverless instance freezes. .catch() keeps one failure
      // from aborting the rest.
      if (cleanPhone) await sendWaitlistConfirmationSms(cleanName, cleanPhone).catch(console.error)
      await scheduleReleaseEmail(cleanName, cleanEmail).catch(console.error)

      // Mirror the signup into Supabase and get this person's unsubscribe token.
      let token: string | null = null
      try {
        token = await mirrorSignup(userId, { email: cleanEmail, firstName, source: signupSource, consent: consentInput })
      } catch (e) {
        console.error('mirrorSignup failed', e)
      }

      const unsubscribeUrl = token ? `https://altidhjem.dk/api/unsubscribe?token=${token}` : ''
      // Mad signups get Mad links everywhere: the welcome email's share-page
      // button is derived from this (/?ref= -> /inviter?ref=), and the site
      // has its own /inviter page. Both domains capture ?ref into the shared
      // referral flow, so friends can land on either site and still count.
      const inviteUrl = `https://altidmad.dk/?ref=${encodeURIComponent(userId)}`

      // Welcome email WITH the personal invite link. It needs a working
      // unsubscribe link, so if we couldn't get a token (Supabase hiccup), fall
      // back to the plain confirmation rather than send a broken Afmeld.
      if (unsubscribeUrl) {
        await sendReferralWelcome(cleanName, cleanEmail, { inviteUrl, unsubscribeUrl }).catch(console.error)
      } else {
        await sendWaitlistConfirmation(cleanName, cleanEmail).catch(console.error)
      }

      // Add the new signup to the Resend Audience (keeps the list in sync),
      // including a snapshot of their queue position. Position lookup is made
      // fail-safe so a DB hiccup here can't abort the referral capture below.
      const myPosition = await getQueuePosition(userId).catch((e) => {
        // queue_position is the headline tag this flow writes — log on failure
        // so a broken RPC shows up in logs instead of silently zeroing it.
        console.error('queue_position lookup failed', userId, e)
        return null
      })
      await addAudienceContact({ email: cleanEmail, firstName, publicId: userId, queuePosition: myPosition, signupSource })

      // If they arrived via someone's referral link (?ref=CODE): record it, tag
      // the new signup with who referred them, then email the referrer their
      // updated progress — unless the referrer opted out.
      if (refBy) {
        try {
          await recordReferral({ referrerCode: refBy, referredEmail: cleanEmail, referredId: userId })
          const prog = await getReferrerProgress(refBy)
          // Show who referred this person in their Resend contact (readable email).
          await syncContactTags(cleanEmail, { referred_by: prog?.email || refBy })
          // Email the referrer + refresh their tags, unless they opted out.
          if (prog?.email && !(await isUnsubscribed(refBy))) {
            const refToken = await getUnsubToken(refBy)
            await syncContactTags(prog.email, {
              referral_count: prog.count,
              progress_pct: prog.progressPct,
              queue_position: prog.position ?? 0,
            })
            if (refToken) {
              await sendReferralProgress(prog.firstName, prog.email, {
                referralCount: prog.count,
                position: prog.position ?? 0,
                progressPct: prog.progressPct,
                inviteUrl: `https://altidhjem.dk/?ref=${encodeURIComponent(refBy)}`,
                unsubscribeUrl: `https://altidhjem.dk/api/unsubscribe?token=${refToken}`,
              })
            }
          }
        } catch (e) {
          console.error('referral progress failed', e)
        }
      }

      identifyServer(userId, { waitlist_signup: true, signup_source: signupSource })
      trackServer('Waitlist Signup Confirmed', { signup_id: userId, signup_source: signupSource }, userId)
    })

    // surveyToken proves ownership in step 2 (the public_id itself is not secret —
    // it doubles as the public referral code).
    return NextResponse.json({ success: true, id: data.id, surveyToken: signSurveyToken(userId) })
  }

  if (body.step === 2) {
    const { id, surveyToken, age, household, why, electricity } = body

    if (!id)
      return NextResponse.json({ success: false, error: 'Mangler id' }, { status: 400 })
    if (!verifySurveyToken(String(id), String(surveyToken ?? '')))
      return NextResponse.json({ success: false, error: 'Ugyldig session' }, { status: 403 })

    const survey: Record<string, unknown> = {}
    if (age) survey.age = Number(age)
    if (household) {
      const n = household === '5+' ? 5 : Number(household)
      if (!isNaN(n)) survey.householdSize = n
    }
    if (why) survey.motivation = String(why).slice(0, 500)
    if (electricity) survey.electricityProvider = String(electricity).slice(0, 100)

    const res = await fetch(`${API_URL}/api/waitlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    })

    if (!res.ok)
      return NextResponse.json({ success: false, error: 'Noget gik galt' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
