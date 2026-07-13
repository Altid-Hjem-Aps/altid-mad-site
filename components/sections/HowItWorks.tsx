'use client'

import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import * as amplitude from '@amplitude/analytics-browser'
import { H2, EYEBROW, BUTTON_PRIMARY } from '@/lib/typography'

type Step = { n: string; title: string; desc: React.ReactNode }

const STEPS: Step[] = [
  { n: '01', title: 'Fortæl os om din familie', desc: 'Hvem er I, hvad kan I lide, hvor meget tid bruger I i køkkenet, og hvad er jeres ugentlige madbudget?' },
  { n: '02', title: 'Vælg ugens måltider', desc: 'Få et udvalg af opskrifter tilpasset jeres præferencer, eller lad Altid Mad foreslå en madplan baseret på ugens bedste tilbud.' },
  { n: '03', title: 'Få din indkøbsliste', desc: 'Automatisk genereret med prissammenligning på tværs af butikker. Du ser præcis hvad du sparer – og hvad der er billigst hvor.' },
  { n: '04', title: 'Spar penge. Hver uge. Altid.', desc: 'Del listen med familien og køb ind. Glæd jer til at se, hvad det gør for madbudgettet, når I køber varerne, hvor de er billigst.' },
]

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
        viewport: { once: true, amount: 0.3 },
        variants: { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } } },
      }
  const cardVariants = prefersReducedMotion
    ? undefined
    : { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } }

  // Same signup flow as nav/hero/founder: scroll to the bottom form if present,
  // otherwise expand the hero form, otherwise navigate home with #venteliste.
  function handleCTA() {
    amplitude.track('Waitlist CTA Clicked', { source: 'how-it-works' })
    const onPageForm = document.getElementById('venteliste2')
    if (onPageForm) { onPageForm.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (window.location.pathname !== '/') { router.push('/#venteliste'); return }
    window.dispatchEvent(new CustomEvent('expand-waitlist'))
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

        {/* Four steps — white cards with a hairline divider ONLY between the
            cards that touch. The `gap-px` reveals the container background as
            those internal dividers; there's no outer frame (no padding), so the
            perimeter has no stroke. Cards are 4:3 from sm up, number top / text
            bottom to fill the format nicely. */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-[20px]"
          {...gridMotion}
        >
          {STEPS.map((step, i) => (
            // The 4:3 format is a MINIMUM, not the card's height: an invisible
            // aspect spacer is stacked under the content (both in grid cell
            // 1/1), so the card is max(4:3, its text) and can never clip.
            // Aspect-ratio'd boxes don't stretch to the grid row, so putting
            // the ratio directly on the card left uneven rows at ~1024–1400px.
            <motion.div
              key={step.n}
              variants={cardVariants}
              className={`grid grid-cols-[minmax(0,1fr)] ${DIVIDERS[i]}`}
              style={{ background: '#ffffff', borderColor: 'rgba(22,50,35,0.12)' }}
            >
              <div aria-hidden className="hidden sm:block w-full sm:aspect-[4/3] col-start-1 row-start-1" />
              <div className="col-start-1 row-start-1 flex flex-col gap-4" style={{ padding: 'clamp(28px,2.4vw,44px)' }}>
                <div className="font-normal leading-none text-[clamp(36px,calc(31.2px+1.24vw),55px)]" style={{ color: '#163223' }}>
                  {step.n}
                </div>
                <div>
                  <p className="font-normal text-[clamp(16px,1.3vw,20px)] leading-snug mb-2.5" style={{ color: '#163223' }}>{step.title}</p>
                  <p className="font-normal text-[14px] leading-[1.7]" style={{ color: '#6f6a61' }}>{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA — same button design as the hero, redirecting to the bottom form */}
        <div className="flex justify-center mt-12 sm:mt-14">
          <button
            type="button"
            onClick={handleCTA}
            className={`${BUTTON_PRIMARY} w-full px-5 lg:w-auto lg:px-[42px]`}
            style={{ background: '#DCD799', color: '#163223' }}
          >
            <span className="lg:hidden">Skriv dig gratis på ventelisten</span>
            <span className="hidden lg:inline">Skriv dig på ventelisten og få ro på madbudgettet</span>
          </button>
        </div>

      </div>
    </section>
  )
}
