import Image from 'next/image'
import type { ReactNode } from 'react'
import { SCREENS, type ScreenId } from '@/lib/screen-captures'

// The phone around a picture of the app. The captures carry their own status bar,
// island, tab bar and home indicator, so the shell paints only the bezel.
export default function PhoneShell({
  children,
  variant = 'foreground',
  sheen = true,
  softShadow = false,
}: {
  children: ReactNode
  variant?: 'foreground' | 'back'
  /** The glass reflection overlay tints everything under it toward white —
   *  turn it off where exact brand colours matter. */
  sheen?: boolean
  /** Gentler halo — used by the hero's single-phone mobile layout. */
  softShadow?: boolean
}) {
  const isBack = variant === 'back'

  return (
    <div className="mx-auto select-none cursor-default">
      <div style={{ position: 'relative', width: 270, height: 560 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 52,
            padding: 8,
            background: 'linear-gradient(150deg, #2e2e2e 0%, #141414 45%, #111111 100%)',
            // Drop-shadow halo via box-shadow instead of a blurred sibling
            // <div>. CSS `filter: blur()` is clipped by the nearest ancestor
            // with a transform (the IPhoneMockup foreground wrapper has
            // translateX(-50%)), which was cutting the halo at a hard
            // vertical line ~37px from each viewport edge. box-shadow renders
            // outside the element box and isn't subject to transform-induced
            // containing-block clipping, so the halo bleeds smoothly.
            boxShadow: [
              'inset 0 1px 0 rgba(255,255,255,0.13)',
              'inset 2px 0 0 rgba(255,255,255,0.07)',
              'inset -1px 0 0 rgba(0,0,0,0.6)',
              'inset 0 -1px 0 rgba(0,0,0,0.5)',
              isBack
                ? '0 24px 39px 4px rgba(0,0,0,0.16)'
                : softShadow
                  ? '0 18px 36px 2px rgba(0,0,0,0.13)'
                  : '0 32px 50px 6px rgba(0,0,0,0.25)',
            ].join(', '),
          }}
        >
          <div
            data-phone-screen
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 44,
              background: '#000',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {children}

            {sheen && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 44,
                  background:
                    'linear-gradient(130deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 30%, transparent 55%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * One capture filling the phone's screen, never squeezed: the capture is a touch taller
 * than the screen, so it sits centred and loses a few pixels at both ends, none of them
 * carrying anything. `children` lie over the capture in its own proportions.
 */
export function PhoneScreen({
  id,
  alt = '',
  preload = false,
  lazy = false,
  children,
}: {
  id: ScreenId
  alt?: string
  preload?: boolean
  lazy?: boolean
  children?: ReactNode
}) {
  const screen = SCREENS[id]
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        aspectRatio: `${screen.width} / ${screen.height}`,
      }}
    >
      <Image
        src={screen.file}
        alt={alt}
        width={screen.width}
        height={screen.height}
        sizes="254px"
        unoptimized
        preload={preload}
        loading={preload ? undefined : lazy ? 'lazy' : 'eager'}
        draggable={false}
        onError={() => console.error(`Altid Mad frame failed to load: ${screen.file}`)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {children}
    </div>
  )
}

const DECODE_TIMEOUT_MS = 10_000

/** Resolves once a frame can be shown without a flash. Rejects if it fails or never
 *  arrives, and the caller keeps the frame it has. */
export function decodeFrame(id: ScreenId): Promise<void> {
  const image = new window.Image()
  image.src = SCREENS[id].file
  return Promise.race([
    image.decode(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timed out')), DECODE_TIMEOUT_MS)),
  ])
}
