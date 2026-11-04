/**
 * Shared tokens and form primitives for the Altid Mad page mockups and
 * calculators. The colours and DM Sans (--font-dm-sans, app/layout.tsx) are the
 * app's own, so a data card looks like it belongs to the screens beside it. These
 * cards illustrate an article's data; a picture of the app itself is a real capture
 * (lib/screen-captures.ts), never drawn here.
 */

// app forest, the app's dark ground and its text
export const FOREST = '#163223'
// tint-mad, Altid Mad's own accent in the app
export const LAVENDER = '#CDC2FB'
// tint-okonomi as a wash, for the one warning tone
export const AMBER = { wash: 'rgba(255,197,107,0.28)', ink: '#7d430e' }
// app beige
export const BEIGE = '#F1ECE0'
// app border
export const CARD_BORDER = '#EAE6DE'
export const HAIRLINE = BEIGE
// app ink-muted
export const INK_MUTED = '#6B675F'
export const CARD_SHADOW = '0 14px 34px rgba(22,50,35,0.10)'
export const LAVENDER_WASH = 'rgba(205,194,251,0.22)'
export const ROW_WASH = 'rgba(205,194,251,0.28)'
export const BADGE_BG = BEIGE
// Secondary text on forest: 0.78 keeps small functional text at ≥4.5:1.
export const ON_FOREST_MUTED = 'rgba(255,255,255,0.78)'
export const CARD_FONT = 'var(--font-dm-sans)'

export function CardHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: INK_MUTED }}>
          {eyebrow}
        </p>
        <p className="text-base font-bold" style={{ color: FOREST }}>
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
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: INK_MUTED }}>
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl px-3.5 py-3 text-[14px] font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163223]'

export const fieldStyle = { backgroundColor: LAVENDER_WASH, border: `1px solid ${CARD_BORDER}`, color: FOREST }

/** Danish number input: dots before 3-digit groups are thousands separators
 * ("1.200" = 1200), the comma starts decimals ("17,69" = 17.69). Returns NaN
 * for missing, non-positive, or out-of-range values. */
export function parseDanishNumber(v: string, min: number, max: number): number {
  const n = parseFloat(v.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN
}
