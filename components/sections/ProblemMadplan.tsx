'use client'

import QuestionSection from './problemShared'
import { MADPLAN_REST, MADPLAN_SCENES } from '@/lib/screen-captures'

// Section 1 of the pair: "Hvad skal vi have til aftensmad?". The phone plays the
// madplan flow in real pictures of the app: preferences → family → budget → the
// app builds the plan → the finished week. The frames are in lib/screen-captures.ts.
export default function ProblemMadplan() {
  return (
    <QuestionSection
      question="Hvad skal vi have til aftensmad?"
      answer="Altid Mad løser det automatisk med en skræddersyet madplan og masser af inspiration, tilpasset præcis jeres smag, hverdag og familiens størrelse. I vælger, hvad I kan lide, og appen bygger ugens madplan for jer."
      chips={['Madplan på 5 minutter', 'Tilpasset din familie']}
      flow={{ scenes: MADPLAN_SCENES, rest: MADPLAN_REST }}
    />
  )
}
