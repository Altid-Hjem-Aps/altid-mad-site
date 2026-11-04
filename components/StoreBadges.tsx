'use client'

import { APP_STORE_LINK, PLAY_STORE_LINK, type Store, type StorePosition } from '@/lib/store-links'

// The official store badges as links. Drawn unmodified (public/store-badges/
// README.md): the Google PNG carries its own clear space (192 of 250 px is
// badge), so it is drawn at 250/192 of the App Store badge height to make both
// look equally tall. Together they need 318px, side by side on a 390px phone;
// the Play badge wraps under the App Store badge on narrower screens.

// The click is counted by our server (app/api/store-click), not by the browser
// SDK: the SDK only runs after cookie consent, and the click leaves the page.
// sendBeacon outlives the navigation, which goes ahead untouched.
function countClick(store: Store, position: StorePosition) {
  navigator.sendBeacon(
    '/api/store-click',
    new Blob([JSON.stringify({ store, position })], { type: 'application/json' }),
  )
}

const LINK = 'block shrink-0 rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'

export default function StoreBadges({ position, className = '' }: { position: StorePosition; className?: string }) {
  return (
    <div className={`flex flex-row flex-wrap items-center gap-x-3 gap-y-3 ${className}`}>
      <a href={APP_STORE_LINK} onClick={() => countClick('appstore', position)} className={LINK}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/store-badges/app-store-da.svg"
          alt="Hent i App Store"
          width={144}
          height={48}
          style={{ display: 'block', height: 48, width: 'auto' }}
        />
      </a>
      <a href={PLAY_STORE_LINK} onClick={() => countClick('play', position)} className={LINK}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/store-badges/google-play-da.png"
          alt="Hent i Google Play"
          width={163}
          height={63}
          style={{ display: 'block', height: 62.5, width: 'auto' }}
        />
      </a>
    </div>
  )
}
