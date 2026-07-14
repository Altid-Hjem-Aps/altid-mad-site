'use client'

import { useEffect, useState } from 'react'
import { CONFIRM_PAGE_BUTTON } from '@/lib/copy'
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
 * confirms nothing is ticked. A controlled-input version shipped a permanently
 * disabled button to every no-JS reader, which meant consent could not be given at
 * all — the exact failure this whole flow exists to fix.
 */
export default function ConsentConfirmForm({
  allowed,
  action,
}: {
  allowed: { key: 'mad' | 'group'; text: string }[]
  action: (formData: FormData) => void
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const anyChecked = allowed.some((c) => checked[c.key])
  const disabled = hydrated && !anyChecked

  return (
    <form action={action} className="mt-6">
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
            onChange={(e) => setChecked((s) => ({ ...s, [c.key]: e.target.checked }))}
            className="mt-1 shrink-0"
            style={{ width: 17, height: 17, accentColor: BRAND.forestDeep }}
          />
          <span className="text-sm leading-relaxed" style={{ color: BRAND.forestDeep }}>
            {c.text}
          </span>
        </label>
      ))}

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-[20px] py-3.5 text-base font-medium mt-5 transition-opacity"
        style={{
          background: BRAND.signal,
          color: BRAND.forestDeep,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {CONFIRM_PAGE_BUTTON}
      </button>
    </form>
  )
}
