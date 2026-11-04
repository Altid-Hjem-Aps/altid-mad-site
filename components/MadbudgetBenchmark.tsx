'use client'

import { useMockupStart } from '@/components/seo/useMockupLoop'
import { CardHeader } from '@/components/seo/mockupKit'

/**
 * Animated benchmark card for the madbudget pages: DST household types with
 * bars that grow into view. Every figure is Danmarks Statistik,
 * Forbrugsundersøgelsen tabel FU13 (2024, løbende priser), category
 * "Fødevarer og ikke-alkoholiske drikkevarer", yearly value / 12 — no other
 * numbers appear here.
 */

const TEAL = '#3E6924'
const MINT = '#DCD799'
const HAIRLINE = 'rgba(62,105,36,0.06)'
const CARD_BORDER = 'rgba(62,105,36,0.1)'

// kr./month = FU13 yearly figure / 12, rounded to whole kroner.
const ROWS: { key: string; label: string; month: number }[] = [
  { key: 'enlig', label: 'Enlig under 60 uden børn', month: 1811 },
  { key: 'enlig60', label: 'Enlig 60+ uden børn', month: 2071 },
  { key: 'enlig-boern', label: 'Enlige med børn', month: 3214 },
  { key: 'par', label: '2 voksne uden børn', month: 3478 },
  { key: 'par-boern', label: '2 voksne med børn', month: 5481 },
  { key: 'tre-voksne', label: 'Mindst 3 voksne', month: 5953 },
]
const MAX = Math.max(...ROWS.map(r => r.month))
const AVERAGE_MONTH = 3488

const fmt = (n: number) => n.toLocaleString('da-DK')

export default function MadbudgetBenchmark({ highlight }: { highlight?: string }) {
  const { ref, running, reduced } = useMockupStart()
  const grown = running || reduced
  const highlighted = ROWS.find(r => r.key === highlight)

  return (
    <div
      ref={ref}
      className="w-full max-w-[440px] rounded-[24px] px-5 pt-5 pb-4"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 14px 34px rgba(15,55,30,0.10)', fontFamily: 'var(--font-onest)' }}
      role="group"
      aria-label="Danske husstandes gennemsnitlige udgift til mad pr. måned, fordelt på husstandstype"
    >
      <CardHeader eyebrow="Danmarks Statistik · 2024" title="Hvad bruger husstande på mad?" />

      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {ROWS.map((r, i) => {
          const isHighlight = r.key === highlight
          return (
            <div
              key={r.key}
              className="px-3.5 py-2.5"
              style={{
                borderBottom: i < ROWS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                background: isHighlight ? 'rgba(220,215,153,0.28)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="min-w-0 truncate font-semibold text-[13px]" style={{ color: 'var(--text-dark)' }}>
                  {r.label}
                </span>
                <span className="shrink-0 text-[12.5px] font-bold tabular-nums" style={{ color: TEAL }}>
                  {fmt(r.month)} kr./md
                </span>
              </div>
              <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(62,105,36,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(r.month / MAX) * 100}%`,
                    background: isHighlight ? TEAL : 'rgba(62,105,36,0.45)',
                    transform: grown ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: reduced ? 'none' : `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: TEAL }}>
        <div className="min-w-0">
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>
            {highlighted ? highlighted.label : 'Gennemsnitshusstand'}
          </p>
          <p className="font-bold text-[17px] leading-tight text-white">
            <span style={{ color: MINT }}>{fmt(highlighted ? highlighted.month : AVERAGE_MONTH)} kr.</span> om måneden
          </p>
        </div>
        <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 8, background: MINT, color: TEAL }}>
          Benchmark
        </span>
      </div>

      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-light)' }}>
        Fødevarer og ikke-alkoholiske drikkevarer, kr. pr. måned (årsbeløb delt med 12). Kilde: Danmarks
        Statistik, Forbrugsundersøgelsen, tabel FU13, 2024.
      </p>
    </div>
  )
}
