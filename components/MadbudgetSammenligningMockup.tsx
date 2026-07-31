'use client'

import { useEffect, useState } from 'react'
import { useMockupStart } from '@/components/seo/useMockupLoop'
import {
  CARD_BORDER,
  CARD_SHADOW,
  CardHeader,
  HAIRLINE,
  MINT,
  MINT_WASH,
  ON_TEAL_MUTED,
  ROW_WASH,
  TEAL,
} from '@/components/seo/mockupKit'

/**
 * Animated app-UI card for /beregn-dit-madbudget, in the Altid Mad design
 * system: a household's own monthly spend is held up against the Danmarks
 * Statistik average for the same household type, the gap is highlighted, and
 * the card lands on the possible saving.
 *
 * Replaces the interactive calculator that used to sit here. Numbers are the
 * verified ones only: 5.481 kr./md is DST FU13 2024 for "2 voksne med børn"
 * (65.775 kr./year / 12) and 21,3 pct. is the Q2 basket gap. The 6.200 kr. is
 * labelled as an example household, and the saving stays "op til" with its
 * condition — never a promised amount.
 */

type Phase = 'husstand' | 'forbrug' | 'gennemsnit' | 'forskel' | 'done'

const SEQ: { p: Phase; ms: number }[] = [
  { p: 'husstand', ms: 1900 },
  { p: 'forbrug', ms: 2100 },
  { p: 'gennemsnit', ms: 2100 },
  { p: 'forskel', ms: 2600 },
  { p: 'done', ms: 7000 },
]

const ORDER = SEQ.map(s => s.p)

const STATUS: Record<Phase, string> = {
  husstand: 'Husstanden er valgt',
  forbrug: 'Jeres forbrug vises',
  gennemsnit: 'Sammenligner med gennemsnittet',
  forskel: 'Forskellen er beregnet',
  done: 'Forskellen er beregnet',
}

const ROWS: { at: Phase; label: string; value: string; highlight?: boolean }[] = [
  { at: 'husstand', label: 'Husstand', value: '2 voksne, 2 børn' },
  { at: 'forbrug', label: 'Jeres forbrug, eksempel', value: '6.200 kr./md.' },
  { at: 'gennemsnit', label: 'Gennemsnit', value: '5.481 kr./md.' },
  { at: 'forskel', label: 'Over gennemsnittet', value: '719 kr./md.', highlight: true },
]

export default function MadbudgetSammenligningMockup() {
  const { ref, running, reduced } = useMockupStart()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!running || reduced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let i = 0
    setIdx(0)
    const next = () => {
      if (cancelled) return
      timer = setTimeout(() => {
        if (cancelled) return
        i = (i + 1) % SEQ.length
        setIdx(i)
        next()
      }, SEQ[i].ms)
    }
    next()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [running, reduced])

  // Reduced motion pins the finished state so the card still reads as a whole.
  const phase: Phase = reduced ? 'done' : SEQ[idx].p
  const at = (target: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(target)

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Eksempel: En husstand med 2 voksne og 2 børn bruger 6.200 kr. om måneden, 719 kr. mere end gennemsnittet på 5.481 kr., og kan spare op til 21,3 pct., hvis indkøbene ligner testkurven."
      className="w-full max-w-[440px] rounded-[24px] px-5 pt-5 pb-4"
      style={{ backgroundColor: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: CARD_SHADOW, fontFamily: 'var(--font-onest)' }}
    >
      <CardHeader eyebrow="Madbudget" title="Hvordan ligger jeres forbrug?" />

      <div className="rounded-2xl px-3.5 py-2.5 mb-3" style={{ backgroundColor: MINT_WASH, border: `1px solid ${CARD_BORDER}` }}>
        <span className="text-[11.5px] font-semibold" style={{ color: TEAL }}>
          {STATUS[phase]}
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {ROWS.map((r, i) => {
          const shown = at(r.at)
          const lit = r.highlight && shown
          return (
            <div
              key={r.label}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              style={{
                borderBottom: i < ROWS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                backgroundColor: lit ? ROW_WASH : 'transparent',
                opacity: shown ? 1 : 0.35,
                transition: 'background-color 0.45s ease, opacity 0.45s ease',
              }}
            >
              <span className="min-w-0 truncate text-[13px]" style={{ color: 'var(--text-light)' }}>
                {r.label}
              </span>
              <span
                className="shrink-0 font-semibold text-[13.5px] tabular-nums"
                style={{ color: lit ? TEAL : 'var(--text-dark)' }}
              >
                {shown ? r.value : '· · ·'}
              </span>
            </div>
          )
        })}
      </div>

      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
        style={{
          backgroundColor: TEAL,
          opacity: phase === 'done' ? 1 : 0,
          transform: phase === 'done' ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
        aria-hidden={phase !== 'done'}
      >
        <div className="min-w-0">
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT, marginBottom: 2 }}>
            Mulig besparelse
          </p>
          <p className="font-bold text-[17px] leading-tight text-white">
            Op til <span style={{ color: MINT }}>21,3 pct.</span> at spare
          </p>
          <p style={{ fontSize: 11, color: ON_TEAL_MUTED, marginTop: 2 }}>
            Hvis jeres indkøb ligner testkurven
          </p>
        </div>
        <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 8, backgroundColor: MINT, color: TEAL }}>
          Sparemulighed
        </span>
      </div>
    </div>
  )
}
