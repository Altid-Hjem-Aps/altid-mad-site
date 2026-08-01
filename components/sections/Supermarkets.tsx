'use client'

import { useAutoCarousel, useCarouselReveal, CarouselPagination } from '@/components/useAutoCarousel'
import { EYEBROW } from '@/lib/typography'

// Supermarket logo strip below the hero (Mad CVI frame node 44:1060): the
// chains Altid Mad compares prices across. Same seamless-loop carousel as the
// Hjem testimonials — logos overflow the viewport with the shared pagination
// dots below.

type Chain = {
  src: string
  alt: string
  /** Rendered height in px — the sources have very different aspects, so
   *  each logo gets its own height to even out the visual weight. */
  height: number
  /** Netto's lockup is wordmark + the scottie-dog disc; the disc rides along
   *  as a second image at its own height. */
  disc?: { src: string; height: number }
}

// Wordmarks are the chains' own SVGs (bilka.dk / foetex.dk site assets, the
// official Netto 2019 wordmark, REMA 1000's outlined one-liner) — crisp at
// any size, viewBoxes trimmed to the artwork so nothing renders cut off.
// nemlig.com's official vector from their own site assets (RGB positive).
const CHAINS: Chain[] = [
  { src: '/supermarkets/netto-wordmark.svg', alt: 'Netto', height: 42, disc: { src: '/logos/netto.png', height: 54 } },
  { src: '/supermarkets/rema1000.svg', alt: 'REMA 1000', height: 50 },
  { src: '/supermarkets/bilka.svg', alt: 'Bilka', height: 50 },
  { src: '/supermarkets/nemlig.svg', alt: 'nemlig.com', height: 46 },
  { src: '/supermarkets/foetex.svg', alt: 'føtex', height: 104 },
]

// The track renders the logos three times so the carousel can loop seamlessly
// (see useAutoCarousel).
const N = CHAINS.length
const LOOP = [...CHAINS, ...CHAINS, ...CHAINS]

export default function Supermarkets() {
  const carousel = useAutoCarousel(N)
  const { trackRef, onScroll, cancelGlide } = carousel
  const reveal = useCarouselReveal(trackRef, carousel.reduced, N, carousel.demoNudge)

  return (
    <section className="py-14 sm:py-16" style={{ background: '#fff' }}>
      <p className={`${EYEBROW} mx-auto max-w-[960px] px-6 text-center`} style={{ color: '#163223' }}>
        Flere supermarkeder, du kender, kommer på løbende
      </p>

      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={cancelGlide}
        onWheel={cancelGlide}
        onTouchStart={cancelGlide}
        className="mt-8 flex items-center gap-[clamp(40px,7vw,140px)] overflow-x-auto snap-x snap-mandatory pb-6 px-10 sm:px-[max(10vw,calc((100vw-320px)/2))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {LOOP.map((c, i) => {
          // Clone sets exist only for the seamless loop — hide them from AT.
          const clone = i < N || i >= 2 * N
          return (
            <div
              key={`${c.alt}-${i}`}
              aria-hidden={clone || undefined}
              // Cell width + gap must keep one 5-logo cycle wider than the
              // viewport at 1920, so the tripled loop never shows the same
              // logo twice at once (stride ≈ 320+140 = 460px → ~4.2 visible).
              // Below sm the cell spans 100vw minus a gap per side, so exactly
              // one logo is in view (neighbours land outside the viewport).
              className="snap-center shrink-0 flex items-center justify-center min-w-[calc(100vw-80px)] sm:min-w-[clamp(160px,16vw,320px)]"
              style={reveal(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={clone ? '' : c.alt}
                loading="lazy"
                decoding="async"
                style={{ height: c.height, width: 'auto' }}
              />
              {c.disc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.disc.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="ml-2.5"
                  style={{ height: c.disc.height, width: 'auto', borderRadius: '50%' }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-2">
        <CarouselPagination count={N} carousel={carousel} itemLabel={(i) => `Gå til ${CHAINS[i].alt}`} />
      </div>
    </section>
  )
}
