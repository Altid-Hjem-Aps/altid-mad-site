'use client'

import { FOREST, MUTED, TEAL } from './problemTokens'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Centered intro for the two "Problemet, vi løser automatisk" mockup
// sections — poses the two weekly questions the phones then answer.
export default function ProblemIntro() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Mobile: centered eyebrow + balanced heading, body left-aligned at
          full width. Desktop: the whole block centered as designed. */}
      <div className="mx-auto max-w-6xl px-6 sm:px-8 pt-[clamp(56px,6.5vw,112px)] pb-[clamp(8px,1.5vw,20px)]">
        <div className="mx-auto text-center lg:max-w-[780px]">
          <p className={EYEBROW} style={{ color: TEAL }}>Problemerne, vi løser automatisk</p>
          <h2 className={`${H2} mt-5 text-balance`} style={{ color: FOREST }}>
            To spørgsmål der koster tid og penge hver eneste uge
          </h2>
          <p className={`${BODY} mt-6 text-left lg:text-center lg:text-pretty mx-auto lg:max-w-[780px]`} style={{ color: MUTED }}>
            I dag er fødevarer dyrere end nogensinde – og alligevel skal hverdagens måltider planlægges,
            indkøb gennemføres og budgettet holdes. Altid Mad løser de to spørgsmål, der optager mest tid
            og energi i ethvert travlt hjem – helt automatisk, uge efter uge.
          </p>
        </div>
      </div>
    </section>
  )
}
