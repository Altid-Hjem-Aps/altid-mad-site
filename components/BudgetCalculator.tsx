'use client'

import { useState } from 'react'
import {
  CARD_BORDER,
  CARD_SHADOW,
  CardHeader,
  CHEVRON_BG,
  Field,
  fieldStyle,
  inputCls,
  MINT,
  MINT_WASH,
  ON_TEAL_MUTED,
  parseDanishNumber,
  selectCls,
  TEAL,
} from '@/components/seo/mockupKit'

/**
 * The interactive calculator on /beregn-dit-madbudget. Everything runs
 * client-side and nothing is stored — the household answers only leave the
 * page if the user signs up via the waitlist form further down.
 *
 * Data discipline: the benchmark per household type is Danmarks Statistik
 * FU13 2024 (yearly / 12); the savings estimate is the user's OWN number
 * scaled by the verified 21,3 pct. gap from the Q2 basket analysis, always
 * presented as "op til" with the basket condition. Input is bounded to
 * 100-100.000 kr./md so implausible numbers never render branded claims.
 */

// DST FU13 2024, fødevarer og ikke-alkoholiske drikkevarer, kr./md (year/12).
const BENCHMARKS: Record<string, { label: string; month: number }> = {
  '1-0': { label: 'Enlig under 60 uden børn', month: 1811 },
  '1-1': { label: 'Enlige med børn', month: 3214 },
  '2-0': { label: '2 voksne uden børn', month: 3478 },
  '2-1': { label: '2 voksne med børn', month: 5481 },
  '3-0': { label: 'Mindst 3 voksne', month: 5953 },
  '3-1': { label: 'Mindst 3 voksne', month: 5953 },
}

const GAP_PCT = 21.3
const SPEND_MIN = 100
const SPEND_MAX = 100_000

const fmt = (n: number) => Math.round(n).toLocaleString('da-DK')

export default function BudgetCalculator() {
  const [adults, setAdults] = useState('2')
  const [kids, setKids] = useState('2')
  const [spend, setSpend] = useState('')

  const spendNum = parseDanishNumber(spend, SPEND_MIN, SPEND_MAX)
  const hasSpend = Number.isFinite(spendNum)
  const bench = BENCHMARKS[`${adults}-${Number(kids) > 0 ? 1 : 0}`]
  const diff = hasSpend ? spendNum - bench.month : 0
  const saving = hasSpend ? (spendNum * GAP_PCT) / 100 : 0

  return (
    <div
      role="group"
      aria-label="Beregner: jeres madbudget-benchmark og besparelses-estimat"
      className="w-full max-w-[440px] rounded-[24px] px-5 pt-5 pb-5"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: CARD_SHADOW, fontFamily: 'var(--font-onest)' }}
    >
      <CardHeader eyebrow="Beregner" title="Hvad er jeres madbudget-benchmark?" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Voksne">
          <select className={selectCls} style={{ ...fieldStyle, ...CHEVRON_BG }} value={adults} onChange={(e) => setAdults(e.target.value)}>
            <option value="1">1 voksen</option>
            <option value="2">2 voksne</option>
            <option value="3">3 eller flere</option>
          </select>
        </Field>
        <Field label="Hjemmeboende børn">
          <select className={selectCls} style={{ ...fieldStyle, ...CHEVRON_BG }} value={kids} onChange={(e) => setKids(e.target.value)}>
            <option value="0">Ingen</option>
            <option value="1">1 barn</option>
            <option value="2">2 børn</option>
            <option value="3">3 eller flere</option>
          </select>
        </Field>
      </div>

      <div className="mb-4">
        <Field label="Hvad bruger I på dagligvarer i dag? (kr. pr. måned)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="F.eks. 5.000"
            className={inputCls}
            style={fieldStyle}
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
          />
        </Field>
      </div>

      <div aria-live="polite">
        {/* Benchmark for the chosen household — always shown */}
        <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: MINT_WASH, border: `1px solid ${CARD_BORDER}` }}>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-light)' }}>
            Gennemsnit for husstandstypen &quot;{bench.label}&quot;
          </p>
          <p className="font-bold text-[17px]" style={{ color: TEAL }}>
            {fmt(bench.month)} kr. om måneden
          </p>
          {hasSpend && (
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-dark)' }}>
              {diff > 0
                ? `I ligger ca. ${fmt(diff)} kr. over gennemsnittet.`
                : diff < 0
                  ? `I ligger ca. ${fmt(-diff)} kr. under gennemsnittet.`
                  : 'I ligger præcis på gennemsnittet.'}
            </p>
          )}
        </div>

        {/* Savings estimate — filled when the user has given a plausible number */}
        {hasSpend ? (
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: TEAL }}>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT, marginBottom: 2 }}>
              Estimat
            </p>
            <p className="font-bold text-[17px] leading-tight text-white">
              Op til <span style={{ color: MINT }}>{fmt(saving)} kr.</span> om måneden
            </p>
            <p style={{ fontSize: 11, color: ON_TEAL_MUTED, marginTop: 2 }}>
              Ca. {fmt(saving * 12)} kr. om året, hvis jeres indkøb ligner testkurven i vores pristjek
            </p>
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'rgba(62,105,36,0.08)', border: `1px solid ${CARD_BORDER}` }}>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: TEAL, marginBottom: 2 }}>
              Estimat
            </p>
            <p className="font-bold text-[14px] leading-tight" style={{ color: TEAL }}>
              {spend.trim() === ''
                ? 'Indtast jeres månedsforbrug for at se estimatet'
                : 'Indtast et beløb mellem 100 og 100.000 kr. pr. måned'}
            </p>
          </div>
        )}
      </div>

      <a
        href="#venteliste"
        className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-medium transition-opacity hover:opacity-85"
        style={{ background: MINT, color: '#163223' }}
      >
        Lad Altid Mad hente besparelsen for jer
      </a>

      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-light)' }}>
        Benchmark: Danmarks Statistik, Forbrugsundersøgelsen FU13 (2024), fødevarer og ikke-alkoholiske
        drikkevarer. Estimatet bruger prisforskellen på 21,3 pct. fra vores Q2-kurvanalyse på jeres eget
        tal og er ikke en garanti. Intet gemmes, når I beregner.
      </p>
    </div>
  )
}
