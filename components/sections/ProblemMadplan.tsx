'use client'

import QuestionSection from './problemShared'
import { MADPLAN_LABEL, MADPLAN_SCENES } from '@/lib/screen-captures'

// Section 1 of the pair: "Hvad skal vi have til aftensmad?". The phone goes through
// the app's own setup: who eats with you, the time for dinner, and the finished week.
export default function ProblemMadplan() {
  return (
    <QuestionSection
      question="Hvad skal vi have til aftensmad?"
      answer="Altid Mad løser det automatisk med en skræddersyet madplan og masser af inspiration, tilpasset præcis jeres smag, hverdag og familiens størrelse. I vælger, hvad I kan lide, og appen bygger ugens madplan for jer."
      chips={['Madplan på 5 minutter', 'Tilpasset din familie']}
      tour={{ scenes: MADPLAN_SCENES, label: MADPLAN_LABEL }}
    />
  )
}
