'use client'

import { useAutoCarousel, CarouselPagination } from '@/components/useAutoCarousel'
import { EYEBROW } from '@/lib/typography'

// Supermarket logo strip below the hero (Mad CVI frame node 44:1060): the
// chains Altid Mad compares prices across. Same seamless-loop carousel as the
// Hjem testimonials — logos overflow the viewport with the shared pagination
// dots below.

type Chain = {
  src: string
  alt: string
  /** Rendered height in px — the source PNGs have very different aspects, so
   *  each logo gets its own height to even out the visual weight. */
  height: number
}

const CHAINS: Chain[] = [
  { src: '/supermarkets/netto.png', alt: 'Netto', height: 44 },
  { src: '/supermarkets/rema1000.png', alt: 'REMA 1000', height: 40 },
  { src: '/supermarkets/bilka.png', alt: 'Bilka', height: 40 },
  { src: '/supermarkets/nemlig.png', alt: 'nemlig.com', height: 36 },
  { src: '/supermarkets/foetex.png', alt: 'føtex', height: 84 },
]

// The track renders the logos three times so the carousel can loop seamlessly
// (see useAutoCarousel).
const N = CHAINS.length
const LOOP = [...CHAINS, ...CHAINS, ...CHAINS]

export default function Supermarkets() {
  const carousel = useAutoCarousel(N)
  const { trackRef, onScroll, cancelGlide } = carousel

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
        className="mt-8 flex items-center gap-[clamp(40px,5vw,96px)] overflow-x-auto snap-x snap-mandatory pb-6 px-[max(10vw,calc((100vw-320px)/2))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {LOOP.map((c, i) => {
          // Clone sets exist only for the seamless loop — hide them from AT.
          const clone = i < N || i >= 2 * N
          return (
            <div
              key={`${c.alt}-${i}`}
              aria-hidden={clone || undefined}
              className="snap-center shrink-0 flex items-center justify-center min-w-[160px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                alt={clone ? '' : c.alt}
                loading="lazy"
                decoding="async"
                style={{ height: c.height, width: 'auto' }}
              />
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
