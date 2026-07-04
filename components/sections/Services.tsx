'use client'

import { useEffect, useRef, useState } from 'react'
import { fluid } from '@/lib/fluid'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Spring-ish easing for the on-scroll card reveal (slight overshoot on settle).
const REVEAL_SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)'

// "Fordelene, du har ventet på" — teal section (Mad CVI frame node 44:1060)
// with six white benefit cards: a mint icon circle, a title and a one-liner
// ending on the brand's "Altid." beat.

type Benefit = {
  title: string
  desc: string
  icon: React.ReactNode
}

const STROKE = '#163223'

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: STROKE,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const BENEFITS: Benefit[] = [
  {
    title: 'Spar fra 10-20% årligt',
    desc: 'Familier der handler systematisk på tilbud, sparer markant mere end de tror er muligt. ',
    icon: (
      // Piggy bank
      <svg {...ICON_PROPS}>
        <path d="M5.5 10.5c.6-3 3.2-5 6.5-5 3.9 0 7 2.7 7 6 0 1.9-1 3.6-2.5 4.7V19h-2.6a8 8 0 0 1-3.8 0H7.5v-2.6C6 15.3 5 13.8 5 12H3.5v-3H5c.1-.5.3-1 .5-1.5Z" />
        <circle cx="14.5" cy="10" r="0.6" fill={STROKE} stroke="none" />
        <path d="M10 7.6c1.2-.4 2.8-.4 4 0" />
      </svg>
    ),
  },
  {
    title: 'Automatisk indkøbsliste',
    desc: 'Vælg måltiderne, og listen laver sig selv – med prissammenligning klar til at dele med familien. ',
    icon: (
      // Checklist sheet
      <svg {...ICON_PROPS}>
        <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
        <path d="M8.5 8.5l1.2 1.2 2-2.2" />
        <path d="M14.5 9h1.8" />
        <path d="M8.5 13.5l1.2 1.2 2-2.2" />
        <path d="M14.5 14h1.8" />
      </svg>
    ),
  },
  {
    title: 'Ugens tilbud på et sølvfad',
    desc: 'Vi finder tilbuddene for dig. Appen sammensætter madplanen ud fra, hvad der er billigst den uge. ',
    icon: (
      // Cloche / serving dish
      <svg {...ICON_PROPS}>
        <path d="M4 16h16" />
        <path d="M5.5 16a6.5 6.5 0 0 1 13 0" />
        <path d="M12 9.5V8" />
        <circle cx="12" cy="7" r="1" />
        <path d="M3 19h18" />
      </svg>
    ),
  },
  {
    title: 'Tilpasset din familie',
    desc: 'Angiv præferencer, kostvaner og antal. Altid Mad tilpasser opskrifter, portioner og indkøb. ',
    icon: (
      // Two people
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.5-3 2.8-5 5.5-5s5 2 5.5 5" />
        <circle cx="16.5" cy="9.5" r="2.2" />
        <path d="M16.5 14.2c2.2.2 3.7 1.8 4 4.3" />
      </svg>
    ),
  },
  {
    title: 'Madplan på 5 minutter',
    desc: 'Ikke mere "hvad skal vi spise?" – en komplet ugeplan på få minutter, uden at nogen skal tænke på det. ',
    icon: (
      // Clock
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  {
    title: 'Nemt at komme i gang',
    desc: 'Du skifter ikke til noget svært. Altid Mad er bygget til at blive det bedste system – fra dag ét. ',
    icon: (
      // Waving hand
      <svg {...ICON_PROPS}>
        <path d="M8 12.5V6.8a1.4 1.4 0 0 1 2.8 0V11" />
        <path d="M10.8 11V5.4a1.4 1.4 0 0 1 2.8 0V11" />
        <path d="M13.6 11V6.4a1.4 1.4 0 0 1 2.8 0v7.1a6 6 0 0 1-6 6c-2.6 0-4.2-1.3-5.5-3.6l-1.6-3a1.3 1.3 0 0 1 2.2-1.3L8 14.2" />
      </svg>
    ),
  },
]

export default function Services() {
  const gridRef = useRef<HTMLDivElement>(null)
  const reduceRef = useRef(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    reduceRef.current = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Reveal immediately if motion is reduced or IntersectionObserver is missing.
    if (reduceRef.current || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="tjenester" className="scroll-mt-24" style={{ background: '#0f6e68' }}>
      <div
        className="max-w-[1920px] mx-auto"
        style={{ paddingLeft: fluid(48, 24), paddingRight: fluid(48, 24), paddingTop: fluid(120, 64), paddingBottom: fluid(120, 64) }}
      >
        <p
          className={`${EYEBROW} text-center mb-4`}
          style={{ color: '#bfe6e0' }}
        >
          Tjenesterne
        </p>
        <h2 className={`${H2} text-center text-white`}>
          Fordelene, du har ventet på
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mx-auto"
          style={{ gap: fluid(24, 16), maxWidth: 'min(1377px, max(76vw, 340px))', marginTop: fluid(56, 40) }}
        >
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className="bg-white flex flex-col"
              style={{
                gap: fluid(14, 12),
                padding: fluid(26, 22),
                borderRadius: fluid(20, 16),
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                // On-scroll reveal: fade + rise, staggered per card.
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'none' : 'translateY(24px)',
                transition: reduceRef.current
                  ? 'none'
                  : `opacity 0.5s ease ${i * 70}ms, transform 0.6s ${REVEAL_SPRING} ${i * 70}ms`,
                willChange: 'opacity, transform',
              }}
            >
              <div className="flex items-center" style={{ gap: fluid(16, 12) }}>
                <span
                  className="shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: fluid(52, 44), height: fluid(52, 44), background: '#bfe6e0' }}
                >
                  {b.icon}
                </span>
                <p className="font-normal leading-snug" style={{ fontSize: fluid(20, 17), color: '#163223' }}>
                  {b.title}
                </p>
              </div>
              <p className="leading-[1.55]" style={{ fontSize: fluid(15, 14), color: '#4a5a4e' }}>
                {b.desc}
                <span className="font-medium" style={{ color: '#163223' }}>Altid.</span>
              </p>
            </div>
          ))}
        </div>

        <p
          className={`text-center text-white mx-auto ${BODY}`}
          style={{ maxWidth: fluid(923, 720), marginTop: fluid(48, 36) }}
        >
          Nøje udvalgte fordele til hverdagen, samlet i et enkelt og overskueligt system.
        </p>
      </div>
    </section>
  )
}
