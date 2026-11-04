import StoreBadges from '@/components/StoreBadges'
import IPhoneMockup from '@/components/IPhoneMockup'
import HeroStatCounter from '@/components/HeroStatCounter'
import PressStrip from '@/components/sections/PressStrip'
import { SAMPLE_DATA_CAPTION } from '@/lib/screen-captures'
import { STORE_ANCHOR } from '@/lib/store-links'
import { H1, BODY } from '@/lib/typography'

// Stats from the Mad CVI frame (node 44:1060) — left column below the CTA.
// The savings stat counts up on load (HeroStatCounter). "0 kr." is
// desktop-only; mobile shows just the centered savings counter.
const STATS = [
  { value: '0 kr.', label: 'at oprette en konto', color: '#202820', oneLine: false, desktopOnly: true },
  { value: 'counter' as const, label: 'kan du i gennemsnit spare årligt med Altid Mad', color: '#163223', oneLine: true, desktopOnly: false },
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: '#fdfaf4' }}>
      {/* Spacer matching the fixed nav height (66px CTA + py-5 + border). */}
      <div className="h-[108px] shrink-0" />

      {/* Wide grid as in the CVI frame: ~71px margins at 1920 (= Figma's ~95/47). */}
      <div className="max-w-[1920px] mx-auto w-full px-6 sm:px-10 lg:px-[clamp(48px,3.7vw,72px)]">
        {/* Press mention, MOBILE placement — directly beneath the nav so it's
            visible on load. On desktop it renders at the bottom of the hero
            instead (see below); each is hidden at the other breakpoint. */}
        <div className="lg:hidden pt-2 pb-1">
          <PressStrip />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[47fr_53fr] gap-12 lg:gap-[clamp(48px,4.8vw,92px)] items-center pb-12 pt-8 lg:py-10 lg:min-h-[680px]">

          {/* Left: copy + store badges + stats */}
          <div className="flex flex-col text-center lg:text-left">
            <h1
              className={`${H1} lg:-ml-[0.05em]`}
              style={{ color: '#163223' }}
            >
              Altid Mad er klar.
            </h1>

            <p
              className={`mt-7 ${BODY} lg:text-[18px] mx-auto lg:mx-0`}
              style={{ color: '#6f6a61', maxWidth: 620 }}
            >
              Madplan og indkøbsliste, der finder de billigste varer i dine butikker. Du finder Altid Mad i appen Altid Hjem.
            </p>

            {/* The target of every "Hent appen" link on the page. The scroll margin
                keeps the badges clear of the fixed nav. */}
            <div id={STORE_ANCHOR} className="mt-8 scroll-mt-[140px]">
              <StoreBadges position="hero" className="justify-center lg:justify-start" />
            </div>

            {/* Stats row — single centered stat below lg, both side by side on desktop */}
            <div className="mt-20 max-lg:mt-10 flex justify-center lg:justify-start lg:gap-x-[clamp(28px,5.2vw,100px)]">
              {STATS.map(s => (
                <div key={s.label} className={`text-left max-lg:text-center ${s.desktopOnly ? 'max-lg:hidden' : ''}`}>
                  <div
                    className="font-normal tabular-nums leading-none text-[clamp(22px,calc(20px+0.52vw),30px)] whitespace-nowrap"
                    style={{ color: s.color }}
                  >
                    {s.value === 'counter' ? <HeroStatCounter /> : s.value}
                  </div>
                  <div
                    className={`mt-2.5 text-[clamp(13px,0.85vw,16px)] max-lg:text-[12px] leading-snug ${s.oneLine ? 'whitespace-nowrap' : 'max-w-[220px]'}`}
                    style={{ color: '#6f6a61' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: our iPhone mockup, real pictures of the app in the phones. */}
          <div className="flex flex-col items-center justify-center">
            <IPhoneMockup />
            <p className="mt-3 text-[12px] leading-snug text-center" style={{ color: '#6f6a61' }}>
              {SAMPLE_DATA_CAPTION}
            </p>
          </div>

        </div>

        {/* Press mention, DESKTOP placement — at the bottom of the hero, on the
            same cream ground (mobile shows it at the top instead — above). */}
        <div className="hidden lg:block pb-14">
          <PressStrip />
        </div>
      </div>
    </section>
  )
}
