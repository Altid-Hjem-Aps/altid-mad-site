'use client'

import QuestionSection from './problemShared'
import { INDKOEB_REST, INDKOEB_SCENES } from '@/lib/screen-captures'

// Section 2 of the pair: "Hvor handler vi billigst ind?". The phone plays the shopping
// flow in real pictures of the app: the list → prices → stores → the trip, ticking
// items off. The frames are in lib/screen-captures.ts.
export default function ProblemIndkoebPlus() {
  return (
    <QuestionSection
      mirror
      question="Hvor handler vi billigst ind?"
      answer="Altid Mad finder automatisk de billigste varer på tværs af de butikker, du selv vælger. Du får en færdig indkøbsliste med de laveste priser, uden at du løfter en finger. Til sidst samler Altid Mad det hele til én indkøbstur, butik for butik."
      chips={['Automatisk indkøbsliste', 'Ugens tilbud på et sølvfad']}
      flow={{ scenes: INDKOEB_SCENES, rest: INDKOEB_REST }}
    />
  )
}
