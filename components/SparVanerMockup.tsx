'use client'

import { useEffect, useState } from 'react'
import { useMockupStart } from '@/components/seo/useMockupLoop'
import {
  BADGE_BG,
  CARD_BORDER,
  CARD_FONT,
  CARD_SHADOW,
  CardHeader,
  FOREST,
  HAIRLINE,
  LAVENDER,
  ROW_WASH,
} from '@/components/seo/mockupKit'

/**
 * Animated data card for /spar-penge-paa-dagligvarer: the five habits from
 * the guide tick themselves off as a weekly plan, and the card lands on
 * "ugens plan er lagt". Qualitative on purpose — no numbers.
 */


const HABITS = [
  'Vælg hovedbutik efter jeres samlede kurv',
  'Læg madplanen efter ugens tilbud',
  'Skriv indkøbslisten, før I går hjemmefra',
  'Handl stort ind én gang om ugen',
  'Planlæg en resterdag i ugen',
]

const STEP_MS = 800
const DONE_MS = 1300
const HOLD_MS = 5200

type Stage = { checked: number; done: boolean }
const FINAL: Stage = { checked: HABITS.length, done: true }

export default function SparVanerMockup() {
  const { ref, running, reduced } = useMockupStart()
  const [stage, setStage] = useState<Stage>({ checked: 0, done: false })

  useEffect(() => {
    if (!running || reduced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function run() {
      if (cancelled) return
      setStage({ checked: 0, done: false })
      let i = 0
      const next = () => {
        if (cancelled) return
        i += 1
        setStage({ checked: i, done: false })
        if (i < HABITS.length) {
          timer = setTimeout(next, STEP_MS)
        } else {
          timer = setTimeout(() => {
            if (cancelled) return
            setStage({ checked: i, done: true })
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
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: CARD_SHADOW, fontFamily: CARD_FONT }}
      role="img"
      aria-label="Eksempel: ugens fem sparevaner sat op som en plan"
    >
      <CardHeader eyebrow="Ugens sparevaner" title="Fem vaner, én plan" />

      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {HABITS.map((habit, i) => {
          const checked = i < s.checked
          return (
            <div
              key={habit}
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={{
                borderBottom: i < HABITS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                background: checked ? ROW_WASH : 'transparent',
                opacity: checked ? 1 : 0.45,
                transition: 'background 0.45s ease, opacity 0.45s ease',
              }}
            >
              <span
                className="shrink-0 grid place-items-center font-bold"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  fontSize: 12,
                  background: checked ? LAVENDER : BADGE_BG,
                  color: FOREST,
                  transition: 'background 0.45s ease',
                }}
              >
                {checked ? '✓' : i + 1}
              </span>
              <span className="flex-1 min-w-0 font-semibold text-[13.5px]" style={{ color: FOREST }}>
                {habit}
              </span>
            </div>
          )
        })}
      </div>

      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: FOREST,
          opacity: s.done ? 1 : 0,
          transform: s.done ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
        aria-hidden={!s.done}
      >
        <div className="min-w-0">
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: LAVENDER, marginBottom: 2 }}>
            Klar til ugen
          </p>
          <p className="font-bold text-[15px] leading-tight text-white">
            Ugens plan er lagt <span style={{ color: LAVENDER }}>✓</span>
          </p>
        </div>
        <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 8, background: LAVENDER, color: FOREST }}>
          5 vaner
        </span>
      </div>
    </div>
  )
}
