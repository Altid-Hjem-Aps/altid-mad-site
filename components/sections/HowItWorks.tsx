'use client'

import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import * as amplitude from '@amplitude/analytics-browser'
import { PhoneStill } from '@/components/iphone/PhoneShell'
import type { ScreenId } from '@/lib/screen-captures'
import { STORE_ANCHOR } from '@/lib/store-links'
import { H2, EYEBROW, BUTTON_PRIMARY } from '@/lib/typography'

type Step = { n: string; title: string; desc: React.ReactNode; still: ScreenId }

const STEPS: Step[] = [
  { n: '01', title: 'Fortæl os om din familie', desc: 'Hvem er I, hvad kan I lide, hvor meget tid bruger I i køkkenet, og hvad er jeres ugentlige madbudget?', still: 'mad.flow.1_tastes' },
  { n: '02', title: 'Vælg ugens måltider', desc: 'Få et udvalg af opskrifter tilpasset jeres præferencer, eller lad Altid Mad foreslå en madplan baseret på ugens bedste tilbud.', still: 'mad.flow.9_week_plan' },
  { n: '03', title: 'Få din indkøbsliste', desc: 'Automatisk genereret med prissammenligning på tværs af butikker. Du ser præcis, hvad du sparer, og hvad der er billigst hvor.', still: 'mad.shopping_list' },
  { n: '04', title: 'Spar penge. Hver uge. Altid.', desc: 'Del listen med familien og køb ind. Glæd jer til at se, hvad det gør for madbudgettet, når I køber varerne, hvor de er billigst.', still: 'mad.trip.in_progress' },
]

// The step's real screen stands in the foot of its card with the phone cut off by the
// card's edge, like a phone in a pocket: the top of a screen is what tells it apart.
const STILL_SCALE = 0.68

// Hairline dividers ONLY between touching cards (no outer frame), as borders on
// the cards themselves — so there's no grey container behind them to flash
// through while a card animates in from opacity 0. Per index for the 1 / 2 / 4
// column grid.
const DIVIDERS = [
  '',
  'border-t sm:border-t-0 sm:border-l',
  'border-t lg:border-t-0 lg:border-l',
  'border-t sm:border-l lg:border-t-0',
]

export default function HowItWorks() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  // Cards animate in 01→04 (staggered) when the grid scrolls into view; static
  // when the user prefers reduced motion.
  const gridMotion = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        // A share of the grid, and the grid is about 2100 px tall on a phone: much more
        // than this and it can never fit a small screen, so the cards never appear.
        viewport: { once: true, amount: 0.1 },
        variants: { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } } },
      }
  const cardVariants = prefersReducedMotion
    ? undefined
    : { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } }

  // Same as the nav: scroll to the store badges on this page, otherwise go to
  // the front page's.
  function handleCTA() {
    amplitude.track('App CTA Clicked', { source: 'how-it-works' })
    const badges = document.getElementById(STORE_ANCHOR)
    if (badges) { badges.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    router.push(`/#${STORE_ANCHOR}`)
  }

  return (
    <section className="py-20 sm:py-28" style={{ background: '#fdfaf4' }}>
      {/* Same wide margin as the hero (~72px @1920 → cards span ~90% of 1920). */}
      <div className="max-w-[1920px] mx-auto w-full px-6 sm:px-10 lg:px-[clamp(48px,3.7vw,72px)]">

        {/* Eyebrow + heading */}
        <div className="text-center mb-12 sm:mb-16">
          <p className={`${EYEBROW} mb-4`} style={{ color: '#6f6a61' }}>
            Sådan virker det
          </p>
          <h2 className={H2} style={{ color: '#163223' }}>
            Fire trin til automatisk madplan og indkøbsliste
          </h2>
        </div>

        {/* Four steps: white cards with a hairline divider ONLY between the cards
            that touch, so the perimeter has no stroke. Number and text on top, the
            step's real screen at the foot. */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-[20px]"
          {...gridMotion}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              variants={cardVariants}
              className={DIVIDERS[i]}
              style={{ background: '#ffffff', borderColor: 'rgba(22,50,35,0.12)' }}
            >
              <div className="flex flex-col h-full">
                <div className="flex flex-col gap-4" style={{ padding: 'clamp(28px,2.4vw,44px)', paddingBottom: 28 }}>
                  <div className="font-normal leading-none text-[clamp(36px,calc(31.2px+1.24vw),55px)]" style={{ color: '#163223' }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="font-normal text-[clamp(16px,1.3vw,20px)] leading-snug mb-2.5" style={{ color: '#163223' }}>{step.title}</p>
                    <p className="font-normal text-[14px] leading-[1.7]" style={{ color: '#6f6a61' }}>{step.desc}</p>
                  </div>
                </div>
                <div className="mt-auto overflow-hidden flex justify-center" style={{ height: 290 }}>
                  <div style={{ transform: `scale(${STILL_SCALE})`, transformOrigin: 'top center' }}>
                    <PhoneStill id={step.still} variant="back" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA: scrolls to the store badges */}
        <div className="flex justify-center mt-12 sm:mt-14">
          <button
            type="button"
            onClick={handleCTA}
            className={`${BUTTON_PRIMARY} w-full px-5 lg:w-auto lg:px-[42px]`}
            style={{ background: '#DCD799', color: '#163223' }}
          >
            <span className="lg:hidden">Hent appen</span>
            <span className="hidden lg:inline">Hent appen, og få ro på madbudgettet</span>
          </button>
        </div>

      </div>
    </section>
  )
}
