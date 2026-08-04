'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  CONFIRM_PAGE_BUTTON,
  CONFIRM_PAGE_BUTTON_PENDING,
  CONFIRM_PENDING_ANNOUNCE,
} from '@/lib/copy'
import { BRAND } from '@/lib/brand'

/**
 * The confirmation act. The boxes start UNCHECKED on purpose: a pre-ticked box is
 * not valid consent (CJEU Planet49), so the person makes an active choice here,
 * exactly as they did on the signup form.
 *
 * `allowed` comes from the signed token — it is what they ticked on the site. Only
 * those boxes are rendered, so this page can never confirm a consent the person
 * did not ask for. Unticking one is a legitimate downgrade; the server intersects
 * the submission with the token (grantedConsent), so a tampered form can only ever
 * NARROW the set, never widen it.
 *
 * Progressive enhancement, and it matters: the inputs are UNCONTROLLED and carry
 * their own name/value, so the form works with JavaScript off or hydration failed.
 * The button ships ENABLED in the server-rendered HTML and is only disabled once JS
 * confirms nothing is ticked — or while a submission is in flight. The pending
 * state is what stops a double-click from queuing a second server action (the bug
 * that showed a successful consent as a dead link). While pending, the label
 * swaps to a progress message at full opacity: the dimmed look is reserved for
 * "nothing ticked", and reusing it for "working" would make the page look frozen
 * at the moment the user is most anxious.
 */
type AllowedConsent = { key: 'mad' | 'group'; text: string }

export default function ConsentConfirmForm({
  allowed,
  action,
  error,
}: {
  allowed: AllowedConsent[]
  action: (formData: FormData) => void
  error?: string
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const anyChecked = allowed.some((c) => checked[c.key])
  // "Blocked" (nothing ticked, dimmed button) is a different state than
  // "pending" (submission in flight, full-opacity progress label) — FormBody
  // combines them, this component only knows about the first.
  const blocked = hydrated && !anyChecked

  return (
    <form action={action} className="mt-6">
      {error && (
        <p
          role="alert"
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: BRAND.sand, color: BRAND.forestDeep }}
        >
          {error}
        </p>
      )}
      <FormBody
        allowed={allowed}
        blocked={blocked}
        onToggle={(key, value) => setChecked((s) => ({ ...s, [key]: value }))}
      />
    </form>
  )
}

// useFormStatus only reads the enclosing <form>'s status from INSIDE it, so the
// pending-aware pieces live in this child rather than on the form element.
function FormBody({
  allowed,
  blocked,
  onToggle,
}: {
  allowed: AllowedConsent[]
  blocked: boolean
  onToggle: (key: string, value: boolean) => void
}) {
  const { pending } = useFormStatus()
  const disabled = pending || blocked

  return (
    <>
      {/* Disabling the fieldset while pending freezes the checkboxes, so what
          the user sees can never diverge from the FormData already in flight. */}
      <fieldset disabled={pending} aria-busy={pending} className="border-0 p-0 m-0 min-w-0">
        {allowed.map((c) => (
          <label
            key={c.key}
            className="flex gap-3 items-start mb-3 px-4 py-3 rounded-lg cursor-pointer"
            style={{ background: BRAND.sand }}
          >
            <input
              type="checkbox"
              name="consent"
              value={c.key}
              onChange={(e) => onToggle(c.key, e.target.checked)}
              className="mt-1 shrink-0"
              style={{ width: 17, height: 17, accentColor: BRAND.forestDeep }}
            />
            <span className="text-sm leading-relaxed" style={{ color: BRAND.forestDeep }}>
              {c.text}
            </span>
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-[20px] py-3.5 text-base font-medium mt-5 transition-opacity"
        style={{
          background: BRAND.signal,
          color: BRAND.forestDeep,
          opacity: blocked && !pending ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {pending ? CONFIRM_PAGE_BUTTON_PENDING : CONFIRM_PAGE_BUTTON}
      </button>
      {/* The button disabling drops keyboard/SR focus; this live region is the
          announcement that fills the gap until the redirect lands. */}
      <span aria-live="polite" className="sr-only">
        {pending ? CONFIRM_PENDING_ANNOUNCE : ''}
      </span>
    </>
  )
}
