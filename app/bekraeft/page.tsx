import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import {
  verifyConfirmToken,
  grantedConsent,
  tokenId,
  CONFIRM_COOKIE,
  CONFIRM_COOKIE_PATH,
} from '@/lib/consent-token'
import { redeemConsentToken, isConfirmTokenRedeemed } from '@/lib/db'
import { trackServer, flushAmplitude } from '@/lib/amplitude.server'
import ConsentConfirmForm from '@/components/ConsentConfirmForm'
import { BRAND } from '@/lib/brand'
import {
  SIGNUP_CONSENT_MAD,
  SIGNUP_CONSENT_GROUP,
  CONSENT_VERSION,
  CONFIRM_PAGE_HEADING,
  CONFIRM_PAGE_INTRO,
  CONFIRM_DONE_HEADING,
  CONFIRM_DONE_BODY,
  CONFIRM_EXPIRED_HEADING,
  CONFIRM_EXPIRED_BODY,
  CONFIRM_ALREADY_HEADING,
  CONFIRM_ALREADY_BODY,
  CONFIRM_PICK_ONE,
  CONFIRM_HOME_CTA,
} from '@/lib/copy'

export const dynamic = 'force-dynamic'

// The cookie is scoped to /bekraeft (see /api/bekraeft). A bare
// jar.delete(name) emits Path=/, which browsers will NOT match against a
// Path=/bekraeft cookie — the delete silently no-ops and the stale cookie
// loops the user back into a dead form. Always delete with the explicit path.
//
// ONE delete only: Next's response-cookie jar is keyed by NAME, so a second
// delete for the same name (e.g. a legacy Path=/ variant) would REPLACE this
// one instead of accompanying it — that clobbering is exactly what broke the
// token cookie in the /api/bekraeft route on 4 Aug. Legacy Path=/ cookies from
// before the path-scoping deploy are expired by the GET route (raw header
// append), which every emailed link passes through; they die within 30 minutes
// regardless.
function deleteConfirmCookie(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.delete({ name: CONFIRM_COOKIE, path: CONFIRM_COOKIE_PATH })
}

/**
 * Writes the consent. Only reachable from the button on this page — never from
 * a GET, so a mail scanner opening the emailed link cannot consent on the
 * person's behalf.
 *
 * The consent set comes from the SIGNED TOKEN, never from the form. If it came
 * from a form field, anyone holding the link could confirm more than they
 * ticked (escalating a Mad-only tick into Mad + group), and the stored record
 * would be a signed claim about a set nothing vouches for.
 *
 * The write itself is ONE atomic RPC (redeem_consent_token): evidence row and
 * signup flags commit together, the row lock serializes against a concurrent
 * withdrawal, and the unique token_id index makes redemption single-use. The
 * cookie survives a successful redemption on purpose: a replay (double-click,
 * back button, second tab, re-clicked email link) then reaches the RPC and
 * gets the honest 'already_used' answer instead of the expired-link screen.
 */
async function confirmAction(formData: FormData) {
  'use server'

  // Amplitude's node SDK only ENQUEUES events; every branch below ends in a
  // redirect (which throws), and Vercel freezes the function right after the
  // response — an un-flushed queue is silently dropped. after() keeps the
  // instance alive until the flush has actually left the box.
  after(async () => {
    await flushAmplitude().promise
  })

  const jar = await cookies()
  const raw = jar.get(CONFIRM_COOKIE)?.value
  const claim = verifyConfirmToken(raw, Date.now() / 1000)
  if (!claim) {
    deleteConfirmCookie(jar)
    trackServer('Consent Confirm Link Dead', { reason: raw ? 'bad-signature-or-expired' : 'no-cookie' })
    redirect('/bekraeft?state=expired')
  }

  const granted = grantedConsent(claim, formData.getAll('consent').map(String))
  // Unticked everything: a declined form, not a dead link. Keep the cookie and
  // send them back to the form with the inline error.
  if (!granted.mad && !granted.group) {
    trackServer('Consent Confirm Nothing Ticked', { signup_id: claim.publicId }, claim.publicId)
    redirect('/bekraeft?state=pick')
  }

  let outcome
  try {
    outcome = await redeemConsentToken({
      publicId: claim.publicId,
      tokenId: tokenId(raw as string),
      mad: granted.mad,
      group: granted.group,
      version: CONSENT_VERSION,
    })
  } catch (e) {
    // Loud and greppable: a redemption that failed in transit must surface as
    // an error page, never as a state screen that could misreport the write.
    console.error(`consent redemption failed for ${claim.publicId}`, e)
    throw e
  }

  if (outcome === 'already_used') {
    trackServer('Consent Confirm Replayed', { signup_id: claim.publicId }, claim.publicId)
    redirect('/bekraeft?state=already')
  }
  if (outcome === 'ineligible') {
    // Row gone or unsubscribed since the mail was sent. The expired screen is a
    // deliberate safety lie here: an honest answer would leak list-membership.
    // No signup_id on this event: the person may have left the list, and tying
    // their identifier to consent activity in analytics is processing we don't
    // need — the server log above support greps carries the id instead.
    deleteConfirmCookie(jar)
    console.error(`consent redemption ineligible for ${claim.publicId} (row gone or unsubscribed)`)
    trackServer('Consent Confirm Ineligible', {})
    redirect('/bekraeft?state=expired')
  }

  trackServer('Consent Confirmed', { signup_id: claim.publicId, mad: granted.mad, group: granted.group }, claim.publicId)
  redirect('/bekraeft?state=done')
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: BRAND.cream }}>
      <div
        className="w-full max-w-[560px] rounded-[20px] px-8 py-10"
        style={{ background: BRAND.white, color: BRAND.forestDeep }}
      >
        {children}
      </div>
    </main>
  )
}

// Every terminal state shares this shape, and every one of them gets the home
// CTA — the success screen used to be the flow's only dead end.
function TerminalScreen({ heading, body }: { heading: string; body: string }) {
  return (
    <Shell>
      <h1 className="text-2xl font-medium mb-4">{heading}</h1>
      <p className="text-base leading-relaxed mb-8" style={{ color: BRAND.textMutedWarm }}>
        {body}
      </p>
      <a
        href="/"
        className="inline-block rounded-[20px] px-6 py-3 text-base font-medium"
        style={{ background: BRAND.signal, color: BRAND.forestDeep }}
      >
        {CONFIRM_HOME_CTA}
      </a>
    </Shell>
  )
}

export default async function BekraeftPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>
}) {
  const { state } = await searchParams

  if (state === 'done') {
    return <TerminalScreen heading={CONFIRM_DONE_HEADING} body={CONFIRM_DONE_BODY} />
  }
  if (state === 'already') {
    return <TerminalScreen heading={CONFIRM_ALREADY_HEADING} body={CONFIRM_ALREADY_BODY} />
  }

  const jar = await cookies()
  const raw = jar.get(CONFIRM_COOKIE)?.value
  const claim = state === 'expired' ? null : verifyConfirmToken(raw, Date.now() / 1000)

  if (!claim) {
    return <TerminalScreen heading={CONFIRM_EXPIRED_HEADING} body={CONFIRM_EXPIRED_BODY} />
  }

  // UX only, fail open: someone re-clicking the email link after confirming
  // should see the honest answer, not a form whose only possible outcome is
  // "already used". Enforcement lives in the RPC, so an error here logs and
  // falls through to the form rather than blocking first-time confirmers.
  let redeemed = false
  try {
    redeemed = await isConfirmTokenRedeemed(tokenId(raw as string))
  } catch (e) {
    console.error('bekraeft: redeemed-check failed, falling open to the form', e)
  }
  if (redeemed) {
    return <TerminalScreen heading={CONFIRM_ALREADY_HEADING} body={CONFIRM_ALREADY_BODY} />
  }

  // Only the consents the token vouches for are offered. Each is tickable
  // separately, so confirming two is two deliberate acts, not one blanket click.
  const allowed = [
    ...(claim.consent.mad ? [{ key: 'mad' as const, text: SIGNUP_CONSENT_MAD }] : []),
    ...(claim.consent.group ? [{ key: 'group' as const, text: SIGNUP_CONSENT_GROUP }] : []),
  ]

  return (
    <Shell>
      <h1 className="text-2xl font-medium mb-6">{CONFIRM_PAGE_HEADING}</h1>
      <p className="text-base" style={{ color: BRAND.textMutedWarm }}>
        {CONFIRM_PAGE_INTRO}
      </p>
      <ConsentConfirmForm
        allowed={allowed}
        action={confirmAction}
        error={state === 'pick' ? CONFIRM_PICK_ONE : undefined}
      />
    </Shell>
  )
}
