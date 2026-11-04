'use client'

import { useEffect, useState } from 'react'
import { useMockupStart } from '@/components/seo/useMockupLoop'
import {
  AMBER,
  BADGE_BG,
  CARD_BORDER,
  CARD_FONT,
  CARD_SHADOW,
  CardHeader,
  FOREST,
  HAIRLINE,
  INK_MUTED,
  LAVENDER,
  ON_FOREST_MUTED,
  ROW_WASH,
} from '@/components/seo/mockupKit'

/**
 * Animated data card for /billigste-supermarked, in the app's colours and
 * font (see seo/mockupKit): the app scans the week's basket across the 13 chains, highlights
 * the cheapest and dearest, and lands on the yearly saving.
 *
 * Numbers are the verified Q3 figures only — the intermediate chains show a
 * checkmark, never an invented price.
 */


// Verified basket results: only Lidl (cheapest) and Min Købmand (dearest)
// carry numbers; the other chains were scanned but their totals are not
// published. icon = /logos/<file>.png where a chain logo exists; initials
// otherwise.
const CHAINS: { name: string; icon?: string; initials?: string; result?: 'cheapest' | 'dearest' }[] = [
  { name: 'Lidl', icon: '/logos/lidl.png', result: 'cheapest' },
  { name: 'Rema 1000', icon: '/logos/rema.png' },
  { name: 'Netto', icon: '/supermarkets/netto-disc.svg' },
  { name: '365discount', initials: '365' },
  { name: 'Meny', icon: '/logos/meny.png' },
  { name: 'Bilka', icon: '/logos/bilka.png' },
  { name: 'Kvickly', initials: 'K' },
  { name: 'Super Brugsen', initials: 'SB' },
  { name: 'Føtex', icon: '/logos/foetex.png' },
  { name: 'Brugsen', initials: 'B' },
  { name: 'Nemlig.com', initials: 'N' },
  { name: 'Spar', icon: '/logos/spar.png' },
  { name: 'Min Købmand', initials: 'MK', result: 'dearest' },
]

const SCAN_MS = 550
const HIGHLIGHT_MS = 1800
const SAVING_MS = 5200

type Stage = { scanned: number; highlight: boolean; saving: boolean }
const FINAL: Stage = { scanned: CHAINS.length, highlight: true, saving: true }

export default function PristjekMockup() {
  const { ref, running, reduced } = useMockupStart()
  const [stage, setStage] = useState<Stage>({ scanned: 0, highlight: false, saving: false })

  useEffect(() => {
    if (!running || reduced) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function run() {
      if (cancelled) return
      setStage({ scanned: 0, highlight: false, saving: false })
      let i = 0
      const scanNext = () => {
        if (cancelled) return
        i += 1
        setStage({ scanned: i, highlight: false, saving: false })
        if (i < CHAINS.length) {
          timer = setTimeout(scanNext, SCAN_MS)
        } else {
          timer = setTimeout(() => {
            if (cancelled) return
            setStage({ scanned: i, highlight: true, saving: false })
            timer = setTimeout(() => {
              if (cancelled) return
              setStage({ scanned: i, highlight: true, saving: true })
              timer = setTimeout(run, SAVING_MS) // loop
            }, HIGHLIGHT_MS)
          }, 500)
        }
      }
      timer = setTimeout(scanNext, SCAN_MS)
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
      aria-label="Eksempel: Altid Mad sammenligner ugens kurv på tværs af kæderne"
    >
      <CardHeader eyebrow="Ugens pristjek" title="Samme kurv · 23 varer · 13 kæder" />

      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#ffffff', border: `1px solid ${CARD_BORDER}` }}>
        {CHAINS.map((c, i) => {
          const scanned = i < s.scanned
          const isCheapest = c.result === 'cheapest' && s.highlight
          const isDearest = c.result === 'dearest' && s.highlight
          return (
            <div
              key={c.name}
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={{
                borderBottom: i < CHAINS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                background: isCheapest ? ROW_WASH : isDearest ? AMBER.wash : 'transparent',
                opacity: scanned ? 1 : 0.35,
                transition: 'background 0.45s ease, opacity 0.45s ease',
              }}
            >
              {c.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={c.icon} alt="" className="shrink-0 object-contain" style={{ width: 24, height: 24, borderRadius: 7 }} />
              ) : (
                <span
                  className="shrink-0 grid place-items-center font-bold"
                  style={{ width: 24, height: 24, borderRadius: 7, fontSize: 10, background: BADGE_BG, color: FOREST }}
                >
                  {c.initials}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate font-semibold text-[13.5px]" style={{ color: FOREST }}>
                {c.name}
              </span>
              {isCheapest ? (
                <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 6, background: LAVENDER, color: FOREST, transition: 'opacity 0.45s ease' }}>
                  Billigst · 782,70 kr.
                </span>
              ) : isDearest ? (
                <span className="shrink-0 font-semibold text-[11px] px-2 py-1" style={{ borderRadius: 6, background: AMBER.wash, color: AMBER.ink, transition: 'opacity 0.45s ease' }}>
                  Dyrest · 1.313,94 kr.
                </span>
              ) : (
                <span className="shrink-0 text-[12px] tabular-nums" style={{ color: scanned ? FOREST : INK_MUTED }}>
                  {scanned ? '✓' : '· · ·'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: FOREST,
          opacity: s.saving ? 1 : 0,
          transform: s.saving ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
        aria-hidden={!s.saving}
      >
        <div className="min-w-0">
          <p style={{ fontSize: 11, color: ON_FOREST_MUTED, marginBottom: 1 }}>
            Forskel på samme kurv · 531,24 kr. pr. uge
          </p>
          <p className="font-bold text-[17px] leading-tight text-white">
            Op til <span style={{ color: LAVENDER }}>27.624 kr.</span> om året
          </p>
        </div>
        <span
          className="shrink-0 font-semibold text-[11px] px-2 py-1"
          style={{ borderRadius: 8, background: LAVENDER, color: FOREST }}
        >
          Ugens besparelse
        </span>
      </div>
    </div>
  )
}
