import { getResend, FROM_EMAIL } from './resend'

// Mad-branded sender for the welcome email only. Everything else (progress
// emails to referrers, release blasts) stays on the shared Altid Hjem sender,
// since those recipients are in the regular Altid Hjem flow.
const MAD_FROM_EMAIL = 'Altid Mad <hej@altidhjem.dk>'

// 2026-05-27 at 10:00 CEST = 08:00 UTC
const RELEASE_SEND_TIME = new Date('2026-05-27T08:00:00Z')

function firstName(name: string) {
  return name.split(' ')[0]
}

// The /inviter share page (copy link, native share, social buttons), keyed by
// the same ref code as the invite link. Derived from inviteUrl so it always
// stays in sync; one place to change if the path ever moves.
function inviterPageUrl(inviteUrl: string) {
  return inviteUrl.replace('/?ref=', '/inviter?ref=')
}

function getNurtureScheduledAt(signupDate: Date): string | null {
  const signupDay = new Date(signupDate)
  signupDay.setUTCHours(0, 0, 0, 0)

  const releaseDay = new Date('2026-05-27T00:00:00Z')
  const daysUntilRelease = Math.round(
    (releaseDay.getTime() - signupDay.getTime()) / 86_400_000,
  )

  if (daysUntilRelease <= 0) return null

  const offset = Math.ceil(daysUntilRelease / 2)
  const nurtureDate = new Date(signupDay)
  nurtureDate.setUTCDate(nurtureDate.getUTCDate() + offset)
  nurtureDate.setUTCHours(8, 0, 0, 0) // 10:00 CEST

  if (nurtureDate >= RELEASE_SEND_TIME) return null

  return nurtureDate.toISOString()
}

// One-click-unsubscribe headers (RFC 8058) so mail apps show a native
// "Unsubscribe" button that POSTs to our endpoint.
function listUnsubHeaders(unsubscribeUrl: string) {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/**
 * CURRENT signup email — the original confirmation (no referral link in it).
 * The invite link is shown on the success screen for now. Pass `unsubscribeUrl`
 * to attach a working one-click-unsubscribe header.
 *
 * PHASE 2: to start emailing people their invite link, swap the call in
 * app/api/waitlist/route.ts from sendWaitlistConfirmation → sendReferralWelcome.
 */
export async function sendWaitlistConfirmation(
  name: string,
  email: string,
  opts?: { unsubscribeUrl?: string },
) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    ...(opts?.unsubscribeUrl ? { headers: listUnsubHeaders(opts.unsubscribeUrl) } : {}),
    template: {
      id: 'waitlist-confirmation',
      variables: { first_name: firstName(name) },
    },
  })
}

/**
 * Welcome email — includes their personal invite link so the referral loop
 * starts from the email too. Mad-branded template; the rest of the referral
 * flow (progress emails, /inviter page) stays on the shared Altid Hjem setup.
 */
export async function sendReferralWelcome(
  name: string,
  email: string,
  vars: { inviteUrl: string; unsubscribeUrl: string },
) {
  return getResend().emails.send({
    from: MAD_FROM_EMAIL,
    to: email,
    headers: listUnsubHeaders(vars.unsubscribeUrl),
    template: {
      id: 'mad-referral-welcome',
      variables: {
        first_name: firstName(name),
        invite_url: vars.inviteUrl,
        invite_url_encoded: encodeURIComponent(vars.inviteUrl),
        invite_page_url: inviterPageUrl(vars.inviteUrl),
        unsubscribe_url: vars.unsubscribeUrl,
      },
    },
  })
}

export async function sendReferralProgress(
  name: string,
  email: string,
  vars: { referralCount: number; position: number; progressPct: number; inviteUrl: string; unsubscribeUrl: string },
) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    headers: listUnsubHeaders(vars.unsubscribeUrl),
    template: {
      id: 'referral-progress',
      variables: {
        first_name: firstName(name),
        referral_count: vars.referralCount,
        // Danish singular/plural noun for the invited-friends count, so the
        // template reads "1 ven" instead of the wrong "1 venner".
        friends_label: vars.referralCount === 1 ? 'ven' : 'venner',
        position: vars.position,
        progress_pct: vars.progressPct,
        invite_url: vars.inviteUrl,
        invite_url_encoded: encodeURIComponent(vars.inviteUrl),
        invite_page_url: inviterPageUrl(vars.inviteUrl),
        unsubscribe_url: vars.unsubscribeUrl,
      },
    },
  })
}

export async function scheduleReleaseEmail(name: string, email: string) {
  if (new Date() >= RELEASE_SEND_TIME) return null

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    scheduledAt: RELEASE_SEND_TIME.toISOString(),
    template: {
      id: 'waitlist-batch-rollout',
      variables: { first_name: firstName(name) },
    },
  })
}

// Nurture email — wired in once template is designed.
export async function scheduleNurtureEmail(
  name: string,
  email: string,
  signupDate: Date,
): Promise<null> {
  const scheduledAt = getNurtureScheduledAt(signupDate)
  if (!scheduledAt) return null
  // TODO: uncomment once waitlist-nurture template is synced to Resend
  // return getResend().emails.send({
  //   from: FROM_EMAIL,
  //   to: email,
  //   scheduledAt,
  //   template: { id: 'waitlist-nurture', variables: { first_name: firstName(name) } },
  // })
  return null
}
