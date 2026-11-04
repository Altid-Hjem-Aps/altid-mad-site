import ScreenTour from '@/components/ScreenTour'
import { PhoneStill } from '@/components/iphone/PhoneShell'
import { HERO_LABEL, HERO_SCENES, HERO_STILLS } from '@/lib/screen-captures'

// The hero's phones. The middle one runs the tour; from 1200 px two stills fan out
// behind it. They are CSS only, so nothing pops in when the page hydrates, and being
// display:none below that width their lazy images never load on a phone. Below 1200 px
// the fan would run into the hero's text.
//
// Scale 0.8, not larger: the browser measures a rotated image by its bounding box,
// and above this a side still takes over as the page's LCP element from the tour's
// first frame.
const SIDE_POSITIONS = [
  'translateX(-50%) translateX(-175px) rotate(-10deg) scale(0.8)',
  'translateX(-50%) translateX(175px) rotate(10deg) scale(0.8)',
]

export default function HeroPhones() {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-[270px] min-[1200px]:w-[580px]">
        {HERO_STILLS.map((id, i) => (
          <div
            key={id}
            className="hidden min-[1200px]:block absolute"
            style={{ left: '50%', top: 30, transform: SIDE_POSITIONS[i], transformOrigin: 'center bottom', zIndex: 1 }}
          >
            <PhoneStill id={id} variant="back" />
          </div>
        ))}
        <div className="relative" style={{ zIndex: 2 }}>
          <ScreenTour scenes={HERO_SCENES} label={HERO_LABEL} preloadFirst />
        </div>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-center" style={{ color: '#6f6a61' }}>
        Skærmbilleder fra appen med eksempeldata.
      </p>
    </div>
  )
}
