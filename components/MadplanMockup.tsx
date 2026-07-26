'use client'

import { useEffect, useState } from 'react'
import { useMockupStart } from '@/components/seo/useMockupLoop'
import { CardHeader } from '@/components/seo/mockupKit'

/**
 * Animated app-UI card for /madplan-efter-tilbud, in the Altid Mad design
 * system (same tokens and food photos as the hero's iphone screens, scaled
 * up for page display): the app reads the week's tilbudsaviser, the five
 * dinners fill in with offer tags, and the plan lands as a ready grocery
 * list. No prices anywhere — the offer tags are qualitative on purpose.
 */

const TEAL = '#3E6924'
const MINT = '#DCD799'
const HAIRLINE = 'rgba(62,105,36,0.06)'
const CARD_BORDER = 'rgba(62,105,36,0.1)'

const PAPERS = [
  { name: 'Rema 1000', icon: '/logos/rema.png' },
  { name: 'Netto', icon: '/logos/netto.png' },
  { name: 'Bilka', icon: '/logos/bilka.png' },
  { name: 'Føtex', icon: '/logos/foetex.png' },
  { name: 'Spar', icon: '/logos/spar.png' },
]

// Same week as the hero's MealPlanScreen — dishes and photos match.
const DAYS: { day: string; dish: string; img: string; offer?: boolean; tag?: string }[] = [
  { day: 'Man', dish: 'Kylling i karry', img: '/food/kylling-karry.jpg', offer: true },
  { day: 'Tir', dish: 'Pasta med grønt', img: '/food/pasta-groent.jpg', offer: true },
  { day: 'Ons', dish: 'Laksewok', img: '/food/laksewok.jpg', offer: true },
  { day: 'Tor', dish: 'Vegetarlasagne', img: '/food/lasagne.jpg', tag: 'Mindre kød' },
  { day: 'Fre', dish: 'Pizzafredag', img: '/food/pizzafredag.jpg', tag: 'Favorit' },
]

const SCAN_MS = 420
const STEP_MS = 750
const DONE_MS = 1200
const HOLD_MS = 5200

type Stage = { scanned: number; filled: number; done: boolean }
const FINAL: Stage = { scanned: PAPERS.length, filled: DAYS.length, done: true }

export default function MadplanMockup() {
  const { ref, running, reduced } = useMockupStart()
  const [stage, setStage] = useState<Stage>({ scanned: 0, filled: 0, done: false })

  useEffect(() => {
    if (!running || reduced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function run() {
      if (cancelled) return
      setStage({ scanned: 0, filled: 0, done: false })
      let i = 0
      const scanNext = () => {
        if (cancelled) return
        i += 1
        setStage({ scanned: i, filled: 0, done: false })
        if (i < PAPERS.length) {
          timer = setTimeout(scanNext, SCAN_MS)
        } else {
          let j = 0
          const fillNext = () => {
            if (cancelled) return
            j += 1
            setStage({ scanned: i, filled: j, done: false })
            if (j < DAYS.length) {
              timer = setTimeout(fillNext, STEP_MS)
            } else {
              timer = setTimeout(() => {
                if (cancelled) return
                setStage({ scanned: i, filled: j, done: true })
                timer = setTimeout(run, HOLD_MS) // loop
              }, DONE_MS)
            }
          }
          timer = setTimeout(fillNext, STEP_MS)
        }
      }
      timer = setTimeout(scanNext, SCAN_MS)
    }

    run()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [running, reduced])

  const s = reduced ? FINAL : stage
  const allScanned = s.scanned === PAPERS.length

  return (
    <div
      ref={ref}
      className="w-full max-w-[400px] rounded-[24px] px-5 pt-5 pb-4"
      style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 14px 34px rgba(15,55,30,0.10)', fontFamily: 'var(--font-onest)' }}
      role="img"
      aria-label="Eksempel: Altid Mad bygger ugens madplan efter tilbudsaviserne"
    >
      <CardHeader eyebrow="Ugens madplan" title="Planlagt efter ugens tilbud" />

      {/* The tilbudsaviser being read, chain by chain */}
      <div
        className="rounded-2xl px-3.5 py-2.5 mb-3 flex items-center gap-2.5"
        style={{ background: 'rgba(220,215,153,0.22)', border: `1px solid ${CARD_BORDER}` }}
      >
        <span className="flex-1 min-w-0 truncate text-[11.5px] font-semibold" style={{ color: TEAL }}>
          {allScanned ? 'Tilbudsaviserne er læst' : 'Læser tilbudsaviserne …'}
        </span>
        <span className="flex items-center gap-1.5">
          {PAPERS.map((p, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={p.name}
              src={p.icon}
              alt=""
              className="object-contain"
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                opacity: i < s.scanned ? 1 : 0.25,
                transition: 'opacity 0.4s ease',
              }}
            />
          ))}
        </span>
      </div>

      {/* The five dinners */}
      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {DAYS.map((d, i) => {
          const filled = i < s.filled
          return (
            <div
              key={d.day}
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={{
                borderBottom: i < DAYS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                background: filled && d.offer ? 'rgba(220,215,153,0.28)' : 'transparent',
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.img}
                alt=""
                className="shrink-0 object-cover"
                style={{ width: 24, height: 24, borderRadius: 7, opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
              />
              <span
                className="flex-1 min-w-0 truncate font-semibold text-[13.5px]"
                style={{ color: 'var(--text-dark)', opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
              >
                {d.dish}
              </span>
              {d.offer && (
                <span
                  className="shrink-0 font-semibold text-[10px] uppercase px-2 py-1"
                  style={{ borderRadius: 6, background: MINT, color: TEAL, letterSpacing: '0.4px', opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
                >
                  Tilbud
                </span>
              )}
              {d.tag && (
                <span
                  className="shrink-0 font-semibold text-[10px] px-2 py-1"
                  style={{ borderRadius: 6, background: 'rgba(62,105,36,0.1)', color: TEAL, opacity: filled ? 1 : 0, transition: 'opacity 0.45s ease' }}
                >
                  {d.tag}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Status card — the plan turns into a ready grocery list */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: TEAL,
          opacity: s.done ? 1 : 0,
          transform: s.done ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
        aria-hidden={!s.done}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: MINT, marginBottom: 2 }}>
              Automatisk
            </p>
            <p className="font-bold text-[15px] leading-tight text-white">Madplanen er klar</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Indkøbslisten er skrevet efter ugens tilbud
            </p>
          </div>
          <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 8, background: MINT, color: TEAL }}>
            3 retter på tilbud
          </span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: MINT, marginTop: 6 }}>Se indkøbslisten →</p>
      </div>
    </div>
  )
}
