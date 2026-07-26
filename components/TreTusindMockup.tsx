'use client'

import { useMockupStart } from '@/components/seo/useMockupLoop'
import { CardHeader } from '@/components/seo/mockupKit'

/**
 * The regneeksempel card on /mad-for-3000-om-maaneden: 3.000 kr./md as a
 * weekly figure held against the verified cheapest basket for a 2+2
 * household. All figures are either transparent arithmetic on the goal
 * (3.000 × 12 / 52 ≈ 692) or the verified Q2 basket number — nothing else.
 */

const TEAL = '#3E6924'
const MINT = '#DCD799'
const AMBER = { wash: 'rgba(232,139,47,0.15)', ink: '#7d430e' }
const CARD_BORDER = 'rgba(62,105,36,0.1)'

// 3.000 kr./md × 12 / 52 = 692,31 kr./uge; basket 802,79 - 692,31 = 110,48.
const GOAL_WEEK = 692
const BASKET_WEEK = 802.79
const GAP_WEEK = 110

export default function TreTusindMockup() {
  const { ref, running, reduced } = useMockupStart()
  const grown = running || reduced

  const rows = [
    { label: 'Målet: 3.000 kr. pr. måned', value: `${GOAL_WEEK} kr. pr. uge`, width: (GOAL_WEEK / BASKET_WEEK) * 100, bar: 'rgba(62,105,36,0.45)' },
    { label: 'Billigste testkurv, 2 voksne + 2 teenagere', value: '802,79 kr. pr. uge', width: 100, bar: TEAL },
  ]

  return (
    <div
      ref={ref}
      className="w-full max-w-[440px] rounded-[24px] px-5 pt-5 pb-4"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 14px 34px rgba(15,55,30,0.10)', fontFamily: 'var(--font-onest)' }}
      role="img"
      aria-label="Regneeksempel: 3.000 kr. om måneden sammenlignet med den billigste testkurv"
    >
      <CardHeader eyebrow="Regneeksempel" title="Hvor langt rækker 3.000 kr.?" />

      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="px-3.5 py-2.5"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(62,105,36,0.06)' : 'none' }}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="min-w-0 truncate font-semibold text-[13px]" style={{ color: 'var(--text-dark)' }}>
                {r.label}
              </span>
              <span className="shrink-0 text-[12.5px] font-bold tabular-nums" style={{ color: TEAL }}>
                {r.value}
              </span>
            </div>
            <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(62,105,36,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${r.width}%`,
                  background: r.bar,
                  transform: grown ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: reduced ? 'none' : `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
                }}
              />
            </div>
          </div>
        ))}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3" style={{ background: AMBER.wash }}>
          <span className="min-w-0 font-semibold text-[13px]" style={{ color: AMBER.ink }}>
            Gab i regneeksemplet
          </span>
          <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 6, background: '#ffffff', color: AMBER.ink }}>
            Ca. {GAP_WEEK} kr. pr. uge
          </span>
        </div>
      </div>

      <div className="rounded-2xl px-4 py-3" style={{ background: TEAL }}>
        <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT, marginBottom: 2 }}>
          Ærligt svar
        </p>
        <p className="font-bold text-[15px] leading-tight text-white">
          Ambitiøst for en familie, muligt for mindre husstande
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
          Selv den billigste udgave af testkurven ligger over målet for en 2+2-husstand
        </p>
      </div>

      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-light)' }}>
        Regneeksempel: 3.000 kr. pr. måned svarer til ca. 692 kr. pr. uge (× 12 ÷ 52). Kurvtallet er fra
        vores Q2-pristjek af samme kurv med 23 varer hos 7 kæder.
      </p>
    </div>
  )
}
