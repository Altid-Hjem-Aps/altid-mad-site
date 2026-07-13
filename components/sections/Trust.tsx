import { Logo, MadLogo } from '@/components/Logo'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Teal → green "Mad is part of Hjem" section (Mad CVI frame node 44:1060):
// Altid Mad (teal, the waitlist funnels into Hjem) next to Altid Hjem (forest,
// the "we've done this before" credibility). The two wordmarks sit at the
// bottom, bridged by a run of pulsing dots across the seam.

const TEAL = '#335620'
const FOREST = '#193d23'
const MINT = '#DCD799'

// Green connector line — 5 equal-size dots that pulse opacity in a staggered
// loop, each peaking at its own max (20% → 100% toward the green/hjem side) so
// a highlight flows along the line while brightening from mad to hjem.
const DOT_MAX = [0.2, 0.4, 0.6, 0.8, 1]

function Dots({ className = '', vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <div className={`flex ${vertical ? 'flex-col items-center' : 'items-center'} gap-2.5 ${className}`} aria-hidden>
      {DOT_MAX.map((max, i) => (
        <span
          key={i}
          style={{
            width: 11,
            height: 11,
            borderRadius: 999,
            background: '#90ff7c',
            ['--dot-max' as string]: max,
            animation: 'dot-flow 2.6s linear infinite',
            animationDelay: `${i * 0.22}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export default function Trust() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left — Altid Mad → Altid Hjem (teal). Extra bottom padding on lg
            reserves room for the seam-bridge strip. */}
        <div
          className="relative flex flex-col px-[clamp(28px,4.6vw,92px)] pt-[clamp(64px,7.8vw,150px)] pb-[clamp(56px,7vw,120px)] max-lg:pb-16 lg:pb-[clamp(150px,10.9vw,210px)]"
          style={{ background: TEAL }}
        >
          <p className={`${EYEBROW} mb-6`} style={{ color: MINT }}>
            Altid Mad finder du i Altid Hjem appen
          </p>
          <h2 className={`${H2} text-white mb-6`}>
            Altid Mad <span aria-hidden>→</span><span className="sr-only">bliver til</span> Altid Hjem
          </h2>
          <p className={BODY} style={{ color: '#fff', maxWidth: 560 }}>
            Når du gratis skriver dig på ventelisten til Altid Mad, bliver du automatisk en del af Altid Hjem. Det betyder, at du ikke behøver nøjes med at spare penge på madbudgettet. Du kan faktisk spare penge på alle hjemmets udgifter. Læs mere om Altid Hjem på{' '}
            <a
              href="https://www.altidhjem.dk"
              className="underline underline-offset-4 transition-opacity hover:opacity-80"
              style={{ color: MINT }}
            >
              www.altidhjem.dk
            </a>
          </p>

          {/* Mobile: centered wordmark; the dot line hangs on the seam below. */}
          <div className="lg:hidden mt-10 flex justify-center">
            <MadLogo className="h-12 w-auto" />
          </div>

          {/* Mobile: vertical dot line straddling the seam — the middle dot
              lands exactly on the border between the teal and green boxes. */}
          <div className="lg:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <Dots vertical />
          </div>
        </div>

        {/* Right — Altid Hjem (green) */}
        <div
          className="flex flex-col px-[clamp(28px,4.6vw,92px)] pt-[clamp(64px,7.8vw,150px)] max-lg:pt-16 pb-[clamp(56px,7vw,120px)] lg:pb-[clamp(150px,10.9vw,210px)]"
          style={{ background: FOREST }}
        >
          {/* Mobile: the Altid Hjem logo receives the dot line from above. */}
          <div className="lg:hidden mb-9 flex justify-center">
            <Logo variant="forest" className="h-12 w-auto" />
          </div>
          <p className={`${EYEBROW} mb-6`} style={{ color: '#90ff7c' }}>
            Vi har gjort det før
          </p>
          <h2 className={`${H2} text-white mb-6`}>
            Hurtigt, nemt og billigt
          </h2>
          <p className={BODY} style={{ color: '#fff', maxWidth: 560 }}>
            Altid Hjem er skabt af teamet bag Altid Energi, som gjorde op med skjulte gebyrer på elmarkedet. Med over 15.000 kunder har vi bevist, at fair og gennemsigtige priser virker. Nu tager vi samme tilgang til madbudgettet, så du kan spare mest muligt og få ro og overblik i hverdagen. Altid.
          </p>

        </div>
      </div>

      {/* Desktop: mad → dots → hjem bridged across the seam, at the bottom. */}
      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-[clamp(44px,4.8vw,92px)] items-center gap-[clamp(20px,2.2vw,34px)]">
        <MadLogo className="h-[clamp(38px,3.2vw,56px)] w-auto" />
        <Dots />
        <Logo variant="forest" className="h-[clamp(38px,3.2vw,56px)] w-auto" />
      </div>
    </section>
  )
}
