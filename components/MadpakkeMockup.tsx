'use client'

import { useEffect, useState } from 'react'
import { useMockupStart } from '@/components/seo/useMockupLoop'
import { CardHeader } from '@/components/seo/mockupKit'

/**
 * Animated app-UI card for /madpakker-paa-budget, in the Altid Mad design
 * system (same tokens as the hero's iphone screens, scaled up for page
 * display): the week's lunchboxes fill in day by day, tilbud-tagged where
 * the plan caught an offer, and the card lands on "indkøbslisten er
 * skrevet". No prices anywhere — the offer tags are qualitative on purpose.
 */

const TEAL = '#3E6924'
const MINT = '#DCD799'
const HAIRLINE = 'rgba(62,105,36,0.06)'
const CARD_BORDER = 'rgba(62,105,36,0.1)'

const DAYS: { day: string; item: string; tilbud?: boolean }[] = [
  { day: 'Man', item: 'Pastasalat med grønt', tilbud: true },
  { day: 'Tir', item: 'Rugbrød med æg og agurk' },
  { day: 'Ons', item: 'Wrap med kylling fra aftensmaden', tilbud: true },
  { day: 'Tor', item: 'Mini-sandwich med ost og grønt' },
  { day: 'Fre', item: 'Boller med ost + frugt', tilbud: true },
]

const STEP_MS = 900
const DONE_MS = 1400
const HOLD_MS = 5200

type Stage = { filled: number; done: boolean }
const FINAL: Stage = { filled: DAYS.length, done: true }

export default function MadpakkeMockup() {
  const { ref, running, reduced } = useMockupStart()
  const [stage, setStage] = useState<Stage>({ filled: 0, done: false })

  useEffect(() => {
    if (!running || reduced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function run() {
      if (cancelled) return
      setStage({ filled: 0, done: false })
      let i = 0
      const next = () => {
        if (cancelled) return
        i += 1
        setStage({ filled: i, done: false })
        if (i < DAYS.length) {
          timer = setTimeout(next, STEP_MS)
        } else {
          timer = setTimeout(() => {
            if (cancelled) return
            setStage({ filled: i, done: true })
            timer = setTimeout(run, HOLD_MS) // loop
          }, DONE_MS)
        }
      }
      timer = setTimeout(next, STEP_MS)
    }

    run()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [running, reduced])

  const s = reduced ? FINAL : stage

  return (
    <div
      ref={ref}
      className="w-full max-w-[400px] rounded-[24px] px-5 pt-5 pb-4"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 14px 34px rgba(15,55,30,0.10)', fontFamily: 'var(--font-onest)' }}
      role="img"
      aria-label="Eksempel: Altid Mad planlægger ugens madpakker efter tilbud"
    >
      <CardHeader eyebrow="Ugens madpakker" title="Planlagt efter ugens tilbud" />

      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {DAYS.map((d, i) => {
          const filled = i < s.filled
          return (
            <div
              key={d.day}
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={{
                borderBottom: i < DAYS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                background: filled && d.tilbud ? 'rgba(220,215,153,0.28)' : 'transparent',
                opacity: filled ? 1 : 0.35,
                transition: 'background 0.45s ease, opacity 0.45s ease',
              }}
            >
              <span
                className="shrink-0 grid place-items-center font-bold uppercase"
                style={{ width: 30, height: 24, borderRadius: 7, fontSize: 9.5, background: 'rgba(220,215,153,0.5)', color: TEAL }}
              >
                {d.day}
              </span>
              <span
                className="flex-1 min-w-0 truncate font-semibold text-[13.5px]"
                style={{ color: 'var(--text-dark)', opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
              >
                {d.item}
              </span>
              {d.tilbud && (
                <span
                  className="shrink-0 font-semibold text-[10px] uppercase px-2 py-1"
                  style={{ borderRadius: 6, background: MINT, color: TEAL, letterSpacing: '0.4px', opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
                >
                  På tilbud
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: TEAL,
          opacity: s.done ? 1 : 0,
          transform: s.done ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
        aria-hidden={!s.done}
      >
        <div className="min-w-0">
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT, marginBottom: 2 }}>
            Automatisk
          </p>
          <p className="font-bold text-[15px] leading-tight text-white">
            Indkøbslisten er skrevet <span style={{ color: MINT }}>✓</span>
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            Ugens 5 madpakker er planlagt
          </p>
        </div>
        <span
          className="shrink-0 font-semibold text-[11px] px-2 py-1"
          style={{ borderRadius: 8, background: MINT, color: TEAL }}
        >
          Klar til ugen
        </span>
      </div>
    </div>
  )
}
