import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyConfirmToken, grantedConsent, tokenId, CONFIRM_COOKIE } from '@/lib/consent-token'
import { mergeConsent, getSignupByPublicId, recordConsentEvent, isTokenAlreadyUsed } from '@/lib/db'
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
} from '@/lib/copy'

export const dynamic = 'force-dynamic'

/**
 * Writes the consent. Only reachable from the button on this page — never from
 * a GET, so a mail scanner opening the emailed link cannot consent on the
 * person's behalf.
 *
 * The consent set comes from the SIGNED TOKEN, never from the form. If it came
 * from a form field, anyone holding the link could confirm more than they
 * ticked (escalating a Mad-only tick into Mad + group), and the stored record
 * would be a signed claim about a set nothing vouches for.
 */
async function confirmAction(formData: FormData) {
  'use server'

  const jar = await cookies()
  const raw = jar.get(CONFIRM_COOKIE)?.value
  const claim = verifyConfirmToken(raw, Date.now() / 1000)
  if (!claim) {
    jar.delete(CONFIRM_COOKIE)
    redirect('/bekraeft?state=expired')
  }

  const granted = grantedConsent(claim, formData.getAll('consent').map(String))
  // Unticked everything: nothing to record. Not an error, just nothing to do.
  if (!granted.mad && !granted.group) {
    jar.delete(CONFIRM_COOKIE)
    redirect('/bekraeft?state=expired')
  }

  const row = await getSignupByPublicId(claim.publicId)
  // Fail closed. A deleted row, or one that has left the list, must not get a
  // marketing consent written onto it — a token minted six days ago says nothing
  // about the row's state today.
  if (!row || row.unsubscribed) {
    jar.delete(CONFIRM_COOKIE)
    redirect('/bekraeft?state=expired')
  }

  // The RESULTING state, not the delta: someone who already holds one flag and
  // confirms the other must end up recorded as holding both, or the audit table
  // answers "did you hold this consent" wrong for exactly the people it matters
  // most for.
  const after = { mad: row.consentMad || granted.mad, group: row.consentGroup || granted.group }

  // Evidence FIRST, flags second. recordConsentEvent throws on a duplicate
  // token_id, so a replayed link (forwarded mail, scanner log, shared browser,
  // back button) is refused BEFORE it can re-grant consent the person has since
  // revoked in the preference centre. Writing the flag first and the evidence
  // second would leave a consent with nothing behind it whenever the evidence
  // failed — which is the one thing this table exists to prevent.
  try {
    await recordConsentEvent({
      publicId: claim.publicId,
      method: 'double-opt-in-email',
      version: CONSENT_VERSION,
      mad: after.mad,
      group: after.group,
      tokenId: tokenId(raw as string),
    })
  } catch (e) {
    jar.delete(CONFIRM_COOKIE)
    if (isTokenAlreadyUsed(e)) redirect('/bekraeft?state=expired')
    throw e
  }

  await mergeConsent(row.email, { version: CONSENT_VERSION, mad: granted.mad, group: granted.group })

  jar.delete(CONFIRM_COOKIE)
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

export default async function BekraeftPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>
}) {
  const { state } = await searchParams

  if (state === 'done') {
    return (
      <Shell>
        <h1 className="text-2xl font-medium mb-4">{CONFIRM_DONE_HEADING}</h1>
        <p className="text-base leading-relaxed" style={{ color: BRAND.textMutedWarm }}>
          {CONFIRM_DONE_BODY}
        </p>
      </Shell>
    )
  }

  const jar = await cookies()
  const claim = state === 'expired' ? null : verifyConfirmToken(jar.get(CONFIRM_COOKIE)?.value, Date.now() / 1000)

  if (!claim) {
    return (
      <Shell>
        <h1 className="text-2xl font-medium mb-4">{CONFIRM_EXPIRED_HEADING}</h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: BRAND.textMutedWarm }}>
          {CONFIRM_EXPIRED_BODY}
        </p>
        <a
          href="/"
          className="inline-block rounded-[20px] px-6 py-3 text-base font-medium"
          style={{ background: BRAND.signal, color: BRAND.forestDeep }}
        >
          Gå til altidmad.dk
        </a>
      </Shell>
    )
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
      <ConsentConfirmForm allowed={allowed} action={confirmAction} />
    </Shell>
  )
}
