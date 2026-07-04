'use client'

import { useEffect, useRef, useState } from 'react'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// "Hvor meget kan jeg spare?" — the Mad answer is a RANGE from Spari's data,
// so unlike the Hjem site's live Energi counter this is a static mint pill
// with the same on-scroll entrance (fade + rise + slight scale).

const SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)'

export default function Savings() {
  const sectionRef = useRef<HTMLDivElement>(null)
  // Starts visible so the section always renders even if IntersectionObserver
  // never fires; scroll-in only replays the entrance where supported.
  const [visible, setVisible] = useState(true)

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
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        io.disconnect()
      }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

          <div style={{
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(36px) scale(0.94)',
            opacity: visible ? 1 : 0,
            transition: `transform 0.85s ${SPRING} 0.12s, opacity 0.55s ease 0.12s`,
          }}>
            <div
              className="w-full flex items-center justify-center rounded-[30px] py-4 sm:py-5 px-6 font-normal tabular-nums whitespace-nowrap text-[clamp(32px,calc(21.6px+2.66vw),80px)]"
              style={{
                background: '#bfe6e0',
                color: '#163223',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              7.500 - 15.000 kr.
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
              {/* Becomes a link when the Q2 report gets a public URL (Thor, 3 Jul). */}
              Baseret på Altid Hjem Q2-rapport. Med Altid Mad får du prisgennemsigtighed på dagligdagens indkøb, og mange danske familier forventer vi sparer mellem 10 og 20 % årligt.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
