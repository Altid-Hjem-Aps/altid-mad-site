import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Supermarkets from '@/components/sections/Supermarkets'
import {
  LazyFounderVideo,
  LazySavings,
  LazyProblemMadplan,
  LazyProblemIndkoebPlus,
  LazyHowItWorks,
} from '@/components/DeferredSections'
import Services from '@/components/sections/Services'
import ProblemIntro from '@/components/sections/ProblemIntro'
import Trust from '@/components/sections/Trust'
import Faq from '@/components/sections/Faq'
import Blog from '@/components/sections/Blog'
import BottomCta from '@/components/sections/BottomCta'
import Footer from '@/components/Footer'

// The animation-heavy sections load through DeferredSections (viewport-gated
// chunks); the SEO-carrying text sections stay server-rendered.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Supermarkets />
        <LazyFounderVideo />
        <LazySavings />
        <Services />
        <ProblemIntro />
        <LazyProblemMadplan />
        <LazyProblemIndkoebPlus />
        <LazyHowItWorks />
        <Trust />
        <Faq />
        <Blog />
        <BottomCta />
      </main>
      <Footer />
    </>
  )
}
