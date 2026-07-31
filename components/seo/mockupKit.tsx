/**
 * Shared tokens and form primitives for the Altid Mad page mockups and
 * calculators. Mirrors the hero screens' design system (see
 * components/sections/problemTokens.ts) at page-card scale, so a palette
 * change is one edit.
 */

export const TEAL = '#3E6924'
export const MINT = '#DCD799'
export const AMBER = { wash: 'rgba(232,139,47,0.15)', ink: '#7d430e' }
export const HAIRLINE = 'rgba(62,105,36,0.06)'
export const CARD_BORDER = 'rgba(62,105,36,0.1)'
export const CARD_SHADOW = '0 14px 34px rgba(15,55,30,0.10)'
export const MINT_WASH = 'rgba(220,215,153,0.22)'
export const ROW_WASH = 'rgba(220,215,153,0.28)'
export const BADGE_BG = 'rgba(220,215,153,0.5)'
// Secondary text on TEAL: 0.78 keeps small functional text at ≥4.5:1.
export const ON_TEAL_MUTED = 'rgba(255,255,255,0.78)'

export function CardHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
          {eyebrow}
        </p>
        <p className="text-base font-bold" style={{ color: TEAL }}>
          {title}
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/services/icon-mad.svg" alt="" style={{ width: 30, height: 30, flexShrink: 0 }} />
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-light)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl px-3.5 py-3 text-[14px] font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E6924]'

// Selects get an explicit chevron since appearance-none removes the native
// one — without it the dropdowns are indistinguishable from text inputs.
export const selectCls = `${inputCls} appearance-none pr-9 bg-no-repeat`
export const CHEVRON_BG = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%233E6924' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 14px center',
  // Must be set HERE, not left to the `bg-no-repeat` class in selectCls:
  // fieldStyle is an inline style, so it outranks the utility class, and the
  // `background` shorthand it used to carry reset repeat to its initial
  // `repeat` — which tiled the chevron across the whole select as a zigzag.
  backgroundRepeat: 'no-repeat',
}

// backgroundColor, never the `background` shorthand: the shorthand wipes the
// chevron image and its repeat setting when the two are spread together.
export const fieldStyle = { backgroundColor: MINT_WASH, border: `1px solid ${CARD_BORDER}`, color: '#163223' }

/** Danish number input: dots before 3-digit groups are thousands separators
 * ("1.200" = 1200), the comma starts decimals ("17,69" = 17.69). Returns NaN
 * for missing, non-positive, or out-of-range values. */
export function parseDanishNumber(v: string, min: number, max: number): number {
  const n = parseFloat(v.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN
}
