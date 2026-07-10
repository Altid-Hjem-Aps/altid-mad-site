import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Supermarkets from '@/components/sections/Supermarkets'
import FounderVideo from '@/components/sections/FounderVideo'
import Savings from '@/components/sections/Savings'
import Services from '@/components/sections/Services'
import ProblemIntro from '@/components/sections/ProblemIntro'
import ProblemMadplan from '@/components/sections/ProblemMadplan'
import ProblemIndkoebPlus from '@/components/sections/ProblemIndkoebPlus'
import HowItWorks from '@/components/sections/HowItWorks'
import Trust from '@/components/sections/Trust'
import Faq from '@/components/sections/Faq'
import Blog from '@/components/sections/Blog'
import BottomCta from '@/components/sections/BottomCta'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Supermarkets />
        <FounderVideo />
        <Savings />
        <Services />
        <ProblemIntro />
        <ProblemMadplan />
        <ProblemIndkoebPlus />
        <HowItWorks />
        <Trust />
        <Faq />
        <Blog />
        <BottomCta />
      </main>
      <Footer />
    </>
  )
}
