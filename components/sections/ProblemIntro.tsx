'use client'

import { FOREST, MUTED, TEAL } from './problemShared'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Centered intro for the two "Problemet, vi løser automatisk" mockup
// sections — poses the two weekly questions the phones then answer.
export default function ProblemIntro() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-[clamp(56px,6.5vw,112px)] pb-[clamp(8px,1.5vw,20px)]">
        <div className="mx-auto text-center" style={{ maxWidth: 780 }}>
          <p className={EYEBROW} style={{ color: TEAL }}>Problemerne, vi løser automatisk</p>
          <h2 className={`${H2} mt-5 text-balance`} style={{ color: FOREST }}>
            To spørgsmål der koster tid
            <br className="max-sm:hidden" />
            og penge hver eneste uge
          </h2>
          <p className={`${BODY} mt-6 mx-auto text-pretty`} style={{ color: MUTED, maxWidth: 780 }}>
            I dag er fødevarer dyrere end nogensinde – og alligevel skal hverdagens måltider planlægges,
            indkøb gennemføres og budgettet holdes. Altid Mad løser de to spørgsmål, der optager mest tid
            og energi i ethvert travlt hjem – helt automatisk, uge efter uge.
          </p>
        </div>
      </div>
    </section>
  )
}
