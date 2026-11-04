import { PhoneStill } from '@/components/iphone/PhoneShell'
import { SAMPLE_DATA_CAPTION } from '@/lib/screen-captures'

// The madplan guide's picture: the app's own Madplan tab.
export default function MadplanMockup() {
  return (
    <figure className="m-0 flex flex-col items-center">
      <PhoneStill id="mad.meal_plan" alt="Madplanen for ugen i Altid Mad med dagens ret fremhævet" />
      <figcaption className="mt-4 text-[12px] leading-snug text-center" style={{ color: '#6f6a61' }}>
        {SAMPLE_DATA_CAPTION}
      </figcaption>
    </figure>
  )
}
