'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import ScreenTour from '@/components/ScreenTour'
import type { Scene } from '@/lib/screen-captures'
import { H2, BODY } from '@/lib/typography'
import { EASE_EXPO, FOREST, MUTED, TEAL } from './problemTokens'

// The layout of the two problem sections: the question, its answer and the proof
// pills on one side, a phone with real pictures of the app on the other.

export interface QuestionSectionProps {
  question: string
  answer: string
  /** Proof pills under the answer — the storyboard's white chips. */
  chips: string[]
  /** Phone left + copy right on desktop (section 2's zig-zag). */
  mirror?: boolean
  /** The tour in the phone. */
  tour: { scenes: Scene[]; label: string }
}

export default function QuestionSection({
  question,
  answer,
  chips,
  mirror = false,
  tour,
}: QuestionSectionProps) {
  const reduced = useReducedMotion()
  // Own in-view flag for the chip reveal — framer's whileInView constructs an
  // IntersectionObserver unguarded, which throws in jsdom (the test suite
  // renders the whole page).
  const chipsRef = useRef<HTMLDivElement>(null)
  const [chipsIn, setChipsIn] = useState(false)
  useEffect(() => {
    const el = chipsRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setChipsIn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setChipsIn(true)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const showChips = chipsIn || !!reduced

  // Section-level in-view flag driving the copy + phone reveal (guarded IO,
  // same pattern as the chips; fires once).
  const sectionRef = useRef<HTMLElement>(null)
  const [sectionIn, setSectionIn] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSectionIn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSectionIn(true)
          io.disconnect()
        }
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Scroll-in reveal for the whole section: heading and answer stagger in, and
  // the phone rises with them. Chips keep their
  // own observer (they sit lower and reveal on their own beat).
  const revealed = sectionIn || !!reduced
  const rise = (delay: number) => ({
    initial: false as const,
    animate: { opacity: revealed ? 1 : 0, y: revealed ? 0 : 22 },
    transition: { duration: 0.6, ease: EASE_EXPO, delay: revealed ? delay : 0 },
  })

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-y-12 lg:gap-x-[clamp(40px,5vw,100px)] py-[clamp(56px,6.5vw,112px)]">
        {/* Copy — pushed toward the outer edge like the founder section.
            Below lg both sections share the same 24px margin (the mirror
            section's) and the text spans the full width, like the Trust
            boxes; the fluid desktop indents apply from lg up. */}
        <div
          className={
            mirror
              ? 'flex flex-col px-6 sm:px-10 lg:pl-0 lg:order-2 lg:pr-[clamp(1.5rem,7.292vw,8.75rem)]'
              : 'flex flex-col px-6 sm:px-10 lg:pr-0 lg:pl-[clamp(2rem,12.500vw,15rem)]'
          }
        >
          <motion.h2 className={`${H2} lg:[text-wrap:balance] lg:max-w-[560px]`} style={{ color: FOREST }} {...rise(0.1)}>
            {question}
          </motion.h2>
          <motion.p className={`${BODY} mt-6 lg:text-pretty lg:max-w-[560px]`} style={{ color: MUTED }} {...rise(0.2)}>
            {answer}
          </motion.p>
          <div ref={chipsRef} className="mt-8 max-lg:hidden flex flex-wrap gap-3">
            {chips.map((c, i) => (
              <motion.span
                key={c}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-[18px] py-[11px] text-[15px]"
                style={{ border: '1px solid #ece7db', color: FOREST }}
                initial={false}
                animate={{ opacity: showChips ? 1 : 0, y: showChips ? 0 : 10 }}
                transition={{ duration: 0.5, ease: EASE_EXPO, delay: showChips ? 0.15 + i * 0.12 : 0 }}
              >
                <span className="inline-block rounded-full shrink-0" style={{ width: 5, height: 5, background: TEAL }} />
                {c}
              </motion.span>
            ))}
          </div>
        </div>

        {/* The phone, centred in its own half. */}
        <motion.div
          className={mirror ? 'w-full flex justify-center px-6 lg:order-1' : 'w-full flex justify-center px-6'}
          {...rise(0.15)}
        >
          <ScreenTour scenes={tour.scenes} label={tour.label} />
        </motion.div>
      </div>
    </section>
  )
}
