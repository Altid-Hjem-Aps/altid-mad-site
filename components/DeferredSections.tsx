'use client'

import dynamic from 'next/dynamic'
import LazySection from '@/components/LazySection'

// The page's heavy below-fold sections (the two animated phone flows, the Mux
// founder video, the savings counters and the how-it-works cards carry
// framer-motion plus thousands of lines of choreography). dynamic(ssr:false)
// splits each into its own chunk, and LazySection delays the import until the
// visitor is within 1500px. Each section's placeholder is used BOTH before
// the observer fires and as the dynamic() loading fallback, so the height
// reservation never lapses (a null fallback shrinks the page and cascade-
// mounts everything on load). Heights are the measured section heights per
// breakpoint; literal class strings so Tailwind compiles them.

function Placeholder({ className, background }: { className: string; background: string }) {
  return <div aria-hidden className={className} style={{ background }} />
}

const founderPh = () => <Placeholder className="min-h-[850px] lg:min-h-[520px]" background="#0f6e68" />
const savingsPh = () => <Placeholder className="min-h-[630px] lg:min-h-[595px]" background="#fdfaf4" />
const madplanPh = () => <Placeholder className="min-h-[1040px] lg:min-h-[785px]" background="#ffffff" />
const indkoebPh = () => <Placeholder className="min-h-[1040px] lg:min-h-[785px]" background="#ffffff" />
const howItWorksPh = () => <Placeholder className="min-h-[1342px] lg:min-h-[770px]" background="#fdfaf4" />

const FounderVideo = dynamic(() => import('@/components/sections/FounderVideo'), { ssr: false, loading: founderPh })
const Savings = dynamic(() => import('@/components/sections/Savings'), { ssr: false, loading: savingsPh })
const ProblemMadplan = dynamic(() => import('@/components/sections/ProblemMadplan'), { ssr: false, loading: madplanPh })
const ProblemIndkoebPlus = dynamic(() => import('@/components/sections/ProblemIndkoebPlus'), { ssr: false, loading: indkoebPh })
const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), { ssr: false, loading: howItWorksPh })

export function LazyFounderVideo() {
  return (
    <LazySection placeholder={founderPh()}>
      <FounderVideo />
    </LazySection>
  )
}

export function LazySavings() {
  return (
    <LazySection placeholder={savingsPh()}>
      <Savings />
    </LazySection>
  )
}

export function LazyProblemMadplan() {
  return (
    <LazySection placeholder={madplanPh()}>
      <ProblemMadplan />
    </LazySection>
  )
}

export function LazyProblemIndkoebPlus() {
  return (
    <LazySection placeholder={indkoebPh()}>
      <ProblemIndkoebPlus />
    </LazySection>
  )
}

export function LazyHowItWorks() {
  return (
    <LazySection placeholder={howItWorksPh()}>
      <HowItWorks />
    </LazySection>
  )
}
