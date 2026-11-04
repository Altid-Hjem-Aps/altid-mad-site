import { NextRequest, NextResponse, after } from 'next/server'
import { trackAnonymousServer } from '@/lib/amplitude.server'
import { assertConsentTokenConfigured, newsletterPublicId, signConfirmToken } from '@/lib/consent-token'
import { CONFIRM_SENDS_PER_HOUR, LOOKUP_FAILED_ERROR, NEWSLETTER_CONSENT_VERSION } from '@/lib/copy'
import {
  checkRateLimit,
  checkRateLimitStrict,
  createNewsletterSignup,
  getSignupByEmailStrict,
  type SignupLookup,
} from '@/lib/db'
import { sendConsentConfirmation } from '@/lib/send-email'

// The newsletter signup on altidmad.dk (ALT-895). It writes to the signup table
// this site shares with altidhjem.dk, as signup_source = 'newsletter', and sends
// nothing to a new address: no mail, no SMS, no audience, no upstream API.
//
// The form is anonymous and cannot prove it owns the address. So a stored row is
// never changed from here: someone already on the table who lacks the consent
// gets the double opt-in mail instead, and every outcome answers the same
// { success: true }, so the form cannot reveal who is on the table.
//
// A repeat of an address needs no limiter of its own, and must not have one that
// runs before the write: it would swallow the retry the form asks for after a
// 503, answering "Tak" with nothing stored. A repeat finds the row in the lookup
// and does nothing, and the confirmation mail has its own limiters below.

// Pinned, not req.nextUrl.origin: the confirmation link carries a consent token,
// and its host should not be derived from a request header.
const SITE_ORIGIN = 'https://altidmad.dk'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
const SCOPE = 'mad'
const SIGNUPS_PER_IP_PER_HOUR = 5
// For the whole site, as confirm mails have: rotating IPs must not be able to fill
// the table with other people's addresses without a ceiling. It counts every
// accepted submit and runs before the lookup: a ceiling on new addresses only would
// answer 503 for unknown and 200 for known ones once used up, telling a stranger
// who is on file.
const SUBMITS_PER_HOUR = 500
const HOUR = 60 * 60

function refuse(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status })
}

async function sendConfirmation(existing: SignupLookup, email: string) {
  if (!existing.unsubToken) {
    console.error(`newsletter confirm refused for ${existing.publicId}: no unsubscribe token`)
    return
  }
  // Both limiters fail closed: a thrown check means no mail. Per-address first,
  // so a repeat of one address never uses up the site-wide allowance.
  if (await checkRateLimitStrict(`consent-confirm:${email}`, 1, HOUR)) {
    console.error(`newsletter confirm refused for ${existing.publicId}: per-address limit`)
    return
  }
  if (await checkRateLimitStrict('consent-confirm:global', CONFIRM_SENDS_PER_HOUR, HOUR)) {
    console.error(`newsletter confirm refused for ${existing.publicId}: global limit`)
    return
  }
  const pending = { mad: true, group: false }
  const token = signConfirmToken(existing.publicId, pending, Date.now() / 1000)
  const { error } = await sendConsentConfirmation({
    name: existing.firstName ?? '',
    email,
    confirmUrl: `${SITE_ORIGIN}/api/bekraeft?t=${encodeURIComponent(token)}`,
    unsubscribeUrl: `https://altidhjem.dk/api/unsubscribe?token=${encodeURIComponent(existing.unsubToken)}`,
    pending,
  })
  if (error) throw new Error(`Resend refused the mail: ${error.message}`)
}

export async function handleNewsletter(req: NextRequest, body: Record<string, unknown>) {
  // JSON only: another site's page cannot send this content type without a CORS
  // preflight, which this route does not grant, so it cannot post a visitor's
  // browser into this form. req.json() alone would accept text/plain.
  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return refuse(415, 'Ugyldig anmodning')

  if (typeof body.email !== 'string') return refuse(400, 'Ugyldig e-mail')
  const email = body.email.trim().toLowerCase()
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) return refuse(400, 'Ugyldig e-mail')
  if (body.scope !== SCOPE) return refuse(400, 'Ugyldig anmodning')
  // No tick, nothing stored. The form blocks this first.
  if (body.consent !== true) return refuse(400, 'Samtykke mangler')

  assertConsentTokenConfigured()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (await checkRateLimit(`newsletter:${ip}`, SIGNUPS_PER_IP_PER_HOUR, HOUR)) {
    return refuse(429, 'For mange forsøg. Prøv igen om en time.')
  }

  try {
    if (await checkRateLimitStrict('newsletter-submits:global', SUBMITS_PER_HOUR, HOUR)) {
      throw new Error('over the hourly ceiling on submits')
    }
    const existing = await getSignupByEmailStrict(email)
    if (!existing) {
      await createNewsletterSignup({
        publicId: newsletterPublicId(email),
        email,
        version: NEWSLETTER_CONSENT_VERSION,
        mad: true,
        group: false,
      })
    } else if (!existing.consentMad && !existing.unsubscribed) {
      // In after(), so the response takes the same time whether a mail goes out
      // or not, and a mail failure can never become a 500.
      after(() =>
        sendConfirmation(existing, email).catch((e) =>
          console.error(`newsletter confirm failed for ${existing.publicId}`, e),
        ),
      )
    }
  } catch (e) {
    console.error('newsletter signup failed', e)
    return refuse(503, LOOKUP_FAILED_ERROR)
  }

  after(() =>
    trackAnonymousServer('Newsletter Signup', { scope: SCOPE }).catch((e) =>
      console.error('newsletter event not recorded', e instanceof Error ? e.message : e),
    ),
  )
  return NextResponse.json({ success: true })
}
