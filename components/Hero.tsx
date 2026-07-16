import WaitlistForm from '@/components/WaitlistForm'
import ComingSoonStores from '@/components/ComingSoonStores'
import IPhoneMockup from '@/components/IPhoneMockup'
import HeroStatCounter from '@/components/HeroStatCounter'
import { H1, BODY } from '@/lib/typography'

// Stats from the Mad CVI frame (node 44:1060) — left column below the CTA.
// The savings stat counts up on load (HeroStatCounter). "0 kr." is
// desktop-only; mobile shows just the centered savings counter.
const STATS = [
  { value: '0 kr.', label: 'at oprette en konto', color: '#202820', oneLine: false, desktopOnly: true },
  { value: 'counter' as const, label: 'kan du spare op til årligt med Altid Mad', color: '#163223', oneLine: true, desktopOnly: false },
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: '#fdfaf4' }}>
      {/* Spacer matching the fixed nav height (66px CTA + py-5 + border). */}
      <div className="h-[108px] shrink-0" />

      {/* Wide grid as in the CVI frame: ~71px margins at 1920 (= Figma's ~95/47). */}
      <div className="max-w-[1920px] mx-auto w-full px-6 sm:px-10 lg:px-[clamp(48px,3.7vw,72px)]">
        <div className="grid grid-cols-1 lg:grid-cols-[47fr_53fr] gap-12 lg:gap-[clamp(48px,4.8vw,92px)] items-center py-12 lg:py-10 lg:min-h-[680px]">

          {/* Left: copy + form + stats */}
          <div className="flex flex-col text-center lg:text-left">
            <h1
              className={`${H1} lg:-ml-[0.05em]`}
              style={{ color: '#163223' }}
            >
              <span className="block">Snart får danskerne</span>
              <span className="block" style={{ color: '#3E6924' }}>bedre råd til mad</span>
            </h1>

            <p
              className={`mt-7 ${BODY} lg:text-[18px] mx-auto lg:mx-0`}
              style={{ color: '#6f6a61', maxWidth: 620 }}
            >
              <span className="max-lg:hidden">Altid Mad laver automatisk din madplan, finder de bedste tilbud og skriver indkøbssedlen, så du kan spare penge året rundt.</span>
              <span className="lg:hidden">Altid Mad laver din madplan, finder ugens bedste tilbud og skriver indkøbssedlen, så du sparer penge året rundt.</span>{' '}
              <span style={{ color: '#163223' }}>Altid.</span>
            </p>

            {/* One w-fit box around the CTA and the pills so both size to the
                pills, without hard-coding either width against the other's
                copy. Two rules keep that honest:

                max-w-[600px] applies at EVERY width, not just lg — fit-content
                already clamps to the available space, so an lg-only cap left
                the sm..lg band uncapped and the box grew to the full column.

                w-0 min-w-full on the form makes it contribute nothing to the
                box's intrinsic width while still filling it. Without that, the
                consent block (long Danish legal copy, ~1150px unwrapped) mounts
                on the first keystroke and yanks the box wider than the pills. */}
            <div className="mt-8 w-fit max-w-[600px] mx-auto lg:mx-0">
              <div id="venteliste" className="w-0 min-w-full">
                <WaitlistForm variant="light" ctaFillsContainer />
              </div>

              <div className="mt-6">
                <ComingSoonStores />
              </div>
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

          {/* Right: our existing iPhone mockup (not the Figma phones) */}
          <div className="flex items-center justify-center">
            <IPhoneMockup />
          </div>

        </div>
      </div>
    </section>
  )
}
