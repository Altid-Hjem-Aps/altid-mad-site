'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// "Hvor meget kan jeg spare?" — the Mad answer is a RANGE from the Q3-rapport:
// a mint pill with an on-scroll entrance where both ends count up together.

const SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)'
// From the Q3-rapport (13 chains): 27.624 kr./år buying the whole basket at
// Lidl vs the dearest chain, 36.248 kr./år cherry-picking each item's cheapest
// chain.
const RANGE_LO = 27624
const RANGE_HI = 36248

/** 7500 → "7.500" — deterministic, no locale dependency. */
const fmtKr = (n: number) => {
  const s = String(Math.round(n))
  return s.length > 3 ? `${s.slice(0, -3)}.${s.slice(-3)}` : s
}

export default function Savings() {
  const sectionRef = useRef<HTMLDivElement>(null)
  // Starts visible so the section always renders even if IntersectionObserver
  // never fires; scroll-in only replays the entrance where supported.
  const [visible, setVisible] = useState(true)
  // 1 = final range shown (SSR, tests, reduced motion); armed to 0 on scroll.
  const [prog, setProg] = useState(1)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // Only arm the entrance when the section is genuinely below the fold —
    // hiding an already-visible (or never-observed) section would leave a
    // blank cream slab, the exact failure the Hjem counter guarded against.
    if (el.getBoundingClientRect().top <= window.innerHeight) return
    setVisible(false)
    setProg(0)
    let controls: ReturnType<typeof animate> | undefined
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        // One master clock driving both ends in lockstep.
        controls = animate(0, 1, {
          duration: 2.1,
          delay: 0.35,
          ease: 'linear',
          onUpdate: (v) => setProg(v),
        })
        io.disconnect()
      }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => {
      io.disconnect()
      controls?.stop()
    }
  }, [])

  // Both ends share the master clock and land together — counting in
  // sequence read as glitchy, not choreographed.
  const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)
  const clamp01 = (p: number) => Math.min(1, Math.max(0, p))
  const loP = easeOutCubic(clamp01(prog))
  const hiP = loP

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 px-6 sm:px-10"
      style={{ background: '#fdfaf4' }}
    >
      <div className="max-w-[1120px] mx-auto text-center">
        <div className="mx-auto" style={{ width: 'fit-content', maxWidth: '100%' }}>
          <div style={{
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            opacity: visible ? 1 : 0,
            transition: `transform 0.7s ${SPRING}, opacity 0.55s ease`,
          }}>
            <p className={`${EYEBROW} mb-5`} style={{ color: '#163223' }}>
              Årlig besparelse
            </p>
            <h2 className={`${H2} mb-9`} style={{ color: '#163223' }}>
              Hvor meget kan jeg spare?
            </h2>
          </div>

          <div
            className="relative"
            style={{
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(36px) scale(0.94)',
              opacity: visible ? 1 : 0,
              transition: `transform 0.85s ${SPRING} 0.12s, opacity 0.55s ease 0.12s`,
            }}
          >
            <div
              className="relative w-full flex items-center justify-center rounded-[30px] py-4 sm:py-5 px-10 sm:px-16 font-normal tabular-nums whitespace-nowrap text-[clamp(32px,calc(21.6px+2.66vw),80px)]"
              style={{
                background: '#DCD799',
                color: '#163223',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {/* Invisible sizer = the FINAL string, so the pill keeps its
                  end width for the whole count-up instead of growing with
                  the digits; the live numbers overlay it. */}
              <span aria-hidden className="invisible">{fmtKr(RANGE_LO)} - {fmtKr(RANGE_HI)} kr.</span>
              <span className="absolute inset-0 flex items-center justify-center">
                {/* Count in steps of 50/100 but land EXACTLY on the odd
                    targets; clamped at 0 — the step-rounding dips below zero
                    at the start. */}
                {fmtKr(Math.max(0, RANGE_LO - Math.round((RANGE_LO * (1 - loP)) / 50) * 50))} -{' '}
                {fmtKr(Math.max(0, RANGE_HI - Math.round((RANGE_HI * (1 - hiP)) / 100) * 100))} kr.
              </span>
            </div>
          </div>

          {/* width:0 + minWidth:100% → fills the pill width without letting
              the long text expand the fit-content wrapper. */}
          <div style={{
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible ? 1 : 0,
            transition: `transform 0.7s ${SPRING} 0.25s, opacity 0.55s ease 0.25s`,
            width: 0,
            minWidth: '100%',
          }}>
            <p className={`mt-9 ${BODY} mx-auto`} style={{ color: '#6f6a61', maxWidth: 700 }}>
              Baseret på{' '}
              <a
                href="/altid-mad-kvartalsrapport-q3.pdf"
                target="_blank"
                rel="noopener"
                className="underline underline-offset-2"
                style={{ color: '#163223' }}
              >
                Altid Mad Q3-rapporten
              </a>
              . Prisen på den samme ugentlige indkøbskurv varierer med 40,4 % fra den billigste til den
              dyreste kæde. Det svarer til en mulig besparelse på op til 27.624 kr. om året. Køber du hver
              vare dér, hvor den er billigst, kan besparelsen vokse til 36.248 kr. om året, svarende til 53,1 %.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
