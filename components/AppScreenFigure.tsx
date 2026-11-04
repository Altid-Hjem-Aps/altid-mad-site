import Image from 'next/image'
import { GUIDE_SCREENS, SAMPLE_DATA_CAPTION, SCREENS } from '@/lib/screen-captures'
import type { Region } from '@/lib/screen-captures'

// The guide pages' picture of the app: a capture or a crop of one, with no phone around
// it, because these pages had none. Which picture goes where is in lib/screen-captures.ts.
export default function AppScreenFigure({ guide }: { guide: keyof typeof GUIDE_SCREENS }) {
  const entry = GUIDE_SCREENS[guide]
  const screen = SCREENS[entry.id]
  const crop: Region | undefined = 'crop' in entry ? entry.crop : undefined
  const box = crop ?? { x: 0, y: 0, w: screen.width, h: screen.height }
  return (
    <figure className="m-0 flex flex-col items-center w-full">
      <div
        className="relative overflow-hidden w-full"
        style={{
          maxWidth: crop && crop.w > crop.h ? 440 : 300,
          aspectRatio: `${box.w} / ${box.h}`,
          borderRadius: 28,
          boxShadow: '0 14px 34px rgba(15,55,30,0.14)',
        }}
      >
        <Image
          src={screen.file}
          alt={entry.alt}
          width={screen.width}
          height={screen.height}
          unoptimized
          draggable={false}
          loading="lazy"
          style={{
            position: 'absolute',
            maxWidth: 'none',
            left: `${(-box.x / box.w) * 100}%`,
            top: `${(-box.y / box.h) * 100}%`,
            width: `${(screen.width / box.w) * 100}%`,
            height: `${(screen.height / box.h) * 100}%`,
          }}
        />
      </div>
      <figcaption className="mt-3 text-[12px] leading-snug text-center" style={{ color: '#6f6a61' }}>
        {SAMPLE_DATA_CAPTION}
      </figcaption>
    </figure>
  )
}
