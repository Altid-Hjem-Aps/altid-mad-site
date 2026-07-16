// Pre-launch store pills for the hero, under the waitlist form.
//
// The Hjem version of this component exists to say "an app is coming". This one
// has a harder job: stop a Mad visitor from searching a store for "Altid Mad"
// and finding nothing. So the lead-in names Altid Hjem at every width.
//
// Below sm it also absorbs "kommer snart i", because the pills carrying that
// phrase themselves need 474px against the 327px a 375px screen offers and
// would drop to two rows. Same split as the Hjem version, one message deeper.
//
// Not Apple's or Google's badge artwork: each store sanctions exactly one
// pre-launch badge ("Pre-order on the App Store", "Pre-register on Google
// Play") and both need a live listing we don't have. The marks below are
// redrawn outside the badge artwork that licenses them — the same knowing
// trade documented on the Hjem side (Thor, 16 Jul).
//
// The pills are not links and must not become links until the listings are
// live. On this site that matters twice over: the store they'd point at has
// nothing called Altid Mad in it.

type Store = {
  name: string
  /** Brand mark path, authored in a 24x24 viewBox and rendered at 16px. */
  path: string
}

const STORES: Store[] = [
  {
    name: 'App Store',
    path: 'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09v-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z',
  },
  {
    name: 'Google Play',
    path: 'M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.61-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1.001 1.001 0 010 1.73l-2.808 1.626L15.117 12l2.581-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z',
  },
]

export default function ComingSoonStores() {
  return (
    // w-fit shrinks this to the pill row's width, so the lead-in centres over
    // the pills rather than over the whole hero column. max-w-full lets the
    // lead-in wrap on phones instead of forcing the row wider than the screen.
    <div className="w-fit max-w-full mx-auto lg:mx-0">
      <p
        id="coming-soon-prefix"
        className="text-sm leading-snug mb-3 text-center"
        style={{ color: '#6f6a61' }}
      >
        {/* "Altid Hjem-appen", not "Altid Hjem appen": the hyphenated compound
            is the correct Danish and matches the FAQ copy below. The green
            stops at the product name; the -appen suffix stays body colour. */}
        Altid Mad finder du i{' '}
        <span className="font-medium" style={{ color: '#163223' }}>
          Altid Hjem
        </span>
        -appen
        {/* Below sm the pills drop "Kommer snart i" so they fit one row, so the
            phrase lands here instead. Complement of the pills' max-sm:hidden —
            exactly one of the two shows at any width, never both. */}
        <span className="sm:hidden">, der snart kommer til</span>
      </p>

      {/* Labelled by the lead-in: below sm the pills say only "App Store" /
          "Google Play", so on their own they'd tell a screen-reader user
          nothing about which app is coming or that it isn't out yet. */}
      <ul
        aria-labelledby="coming-soon-prefix"
        className="flex flex-wrap justify-center gap-3 list-none p-0 m-0"
      >
        {STORES.map(store => (
          <li key={store.name}>
            {/* 20px radius is BUTTON_PRIMARY's corner, hard-coded rather than
                rounded-full so the pills keep matching the CTA above them if
                their height ever changes. */}
            <span
              className="inline-flex items-center gap-2 rounded-[20px] border py-3 px-3 sm:px-4 text-sm leading-none whitespace-nowrap"
              style={{
                borderColor: 'rgba(22, 50, 35, 0.18)',
                color: '#163223',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="currentColor"
              >
                <path d={store.path} />
              </svg>
              <span>
                <span className="max-sm:hidden">Kommer snart i </span>
                <span className="font-medium">{store.name}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
