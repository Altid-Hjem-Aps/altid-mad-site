import { NextRequest, NextResponse, after } from 'next/server'
import { sendWaitlistConfirmation, sendReferralWelcome, scheduleReleaseEmail, sendReferralProgress } from '@/lib/send-email'
import { sendWaitlistConfirmationSms } from '@/lib/send-sms'
import { trackServer, identifyServer } from '@/lib/amplitude.server'
import { recordReferral, mirrorSignup, mergeConsent, getReferrerProgress, getSignupByEmail, getUnsubToken, isUnsubscribed, checkRateLimit, getQueuePosition } from '@/lib/db'
import { duplicateSignupMessage } from '@/lib/copy'
import { syncContactTags, addAudienceContact } from '@/lib/resend'
import { normalizeSignupSource } from '@/lib/signup-source'
import { assertSurveyTokenConfigured, signSurveyToken, verifySurveyToken } from '@/lib/survey-token'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.altidhjem.dk'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\d{8}$/

const WINDOW_SECONDS = 60 * 60 // 1 hour
const MAX_ATTEMPTS = 3

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.step === 1) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (await checkRateLimit(`signup:${ip}`, MAX_ATTEMPTS, WINDOW_SECONDS))
      return NextResponse.json({ success: false, error: 'For mange forsøg. Prøv igen om en time.' }, { status: 429 })

    const { email, name, phone, referredBy, consent } = body
    const signupSource = normalizeSignupSource(body.source)
    // Normalise the documented marketing consent before it is stored: coerce the
    // two choices to real booleans and cap the wording version. A malformed or
    // absent consent object records as "no consent" rather than trusting the body.
    const consentInput =
      consent && typeof consent === 'object'
        ? {
            version: typeof consent.version === 'string' ? consent.version.slice(0, 32) : undefined,
            mad: consent.mad === true,
            group: consent.group === true,
          }
        : undefined

    if (!email || !EMAIL_RE.test(email))
      return NextResponse.json({ success: false, error: 'Ugyldig e-mail' }, { status: 400 })
    if (!phone || !PHONE_RE.test(String(phone).replace(/\s/g, '')))
      return NextResponse.json({ success: false, error: 'Ugyldigt mobilnummer' }, { status: 400 })
    if (!name || String(name).trim().length < 2)
      return NextResponse.json({ success: false, error: 'Navn mangler' }, { status: 400 })

    // Fail fast on missing survey-token secret BEFORE registering the user
    // upstream — otherwise signSurveyToken throws after side effects and the
    // user is enrolled but sees a 500, then 409 on retry.
    assertSurveyTokenConfigured()

    const res = await fetch(`${API_URL}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(name).trim(),
        mobile: String(phone).replace(/\s/g, ''),
        email: String(email).toLowerCase().trim(),
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.status === 409) {
      // Tell Hjem signups they are already covered instead of a bare "already
      // signed up" — the two sites share one waitlist. Include their referral
      // link (public_id doubles as the public referral code) so a duplicate
      // signup can still invite friends and move up the queue.
      const existing = await getSignupByEmail(String(email))
      // A re-signup can carry NEW consent (e.g. a Mad signup later ticks the
      // Hjem "all brands" box). mirrorSignup does not run on a 409, so merge the
      // new consent into the existing row (keyed on email) instead of dropping
      // it. Fail-safe: a hiccup here must never break the 409 response.
      await mergeConsent(String(email), consentInput).catch((e) => console.error('mergeConsent failed', e))
      return NextResponse.json(
        {
          success: false,
          error: duplicateSignupMessage(existing?.source ?? null),
          ...(existing ? { inviteUrl: `https://altidmad.dk/?ref=${encodeURIComponent(existing.publicId)}` } : {}),
        },
        { status: 409 },
      )
    }
    if (!res.ok)
      return NextResponse.json({ success: false, error: data.message ?? 'Noget gik galt' }, { status: res.status })

    const cleanName = String(name).trim()
    const cleanEmail = String(email).toLowerCase().trim()
    const cleanPhone = String(phone).replace(/\s/g, '')
    const firstName = cleanName.split(' ')[0]
    const userId = data.id as string
    const refBy = referredBy ? String(referredBy).trim() : ''

    // Respond immediately; run all emails / DB sync AFTER the response so the
    // user isn't waiting on Resend + Supabase round-trips before "you're in".
    after(async () => {
      // Awaited (not fire-and-forget): inside after() an un-awaited promise can be
      // killed when the serverless instance freezes. .catch() keeps one failure
      // from aborting the rest.
      await sendWaitlistConfirmationSms(cleanName, cleanPhone).catch(console.error)
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
