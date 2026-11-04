import Image from 'next/image'
import type { ReactNode } from 'react'
import { SCREENS, type ScreenId } from '@/lib/screen-captures'

// The phone around a picture of the app. The captures carry their own status bar,
// island and home indicator, so the shell paints only the bezel.
const BEZEL = 8
export const SCREEN_W = 254
/** The captures' own proportion, so a frame is never squeezed. */
export const SCREEN_H = 551

export default function PhoneShell({ children, variant = 'foreground' }: { children: ReactNode; variant?: 'foreground' | 'back' }) {
  return (
    <div
      className="select-none"
      style={{
        width: SCREEN_W + BEZEL * 2,
        height: SCREEN_H + BEZEL * 2,
        borderRadius: 52,
        padding: BEZEL,
        background: 'linear-gradient(150deg, #2e2e2e 0%, #141414 45%, #111111 100%)',
        // box-shadow rather than a blurred sibling: a transformed ancestor clips a
        // filter's blur, and every phone here sits in one.
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.13)',
          'inset 2px 0 0 rgba(255,255,255,0.07)',
          'inset -1px 0 0 rgba(0,0,0,0.6)',
          'inset 0 -1px 0 rgba(0,0,0,0.5)',
          variant === 'back' ? '0 24px 39px 4px rgba(0,0,0,0.16)' : '0 32px 50px 6px rgba(0,0,0,0.25)',
        ].join(', '),
      }}
    >
      <div
        data-phone-screen
        style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden', background: '#fdfaf4' }}
      >
        {children}
      </div>
    </div>
  )
}

/** A phone holding one still. Decorative unless it gets an alt: usually the text or
 *  the tour beside it says what the app is. */
export function PhoneStill({ id, variant, alt = '' }: { id: ScreenId; variant?: 'foreground' | 'back'; alt?: string }) {
  const screen = SCREENS[id]
  return (
    <PhoneShell variant={variant}>
      <Image
        src={screen.file}
        alt={alt}
        width={screen.width}
        height={screen.height}
        unoptimized
        draggable={false}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </PhoneShell>
  )
}

/** Where a region of a frame lands on the phone's screen, in CSS px. */
export const onScreen = (px: number, frameWidth: number) => (px * SCREEN_W) / frameWidth
export const SCREEN_INSET = BEZEL
