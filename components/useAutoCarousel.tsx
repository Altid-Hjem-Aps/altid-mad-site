'use client'

import { useEffect, useRef, useState } from 'react'
import { REVEAL_SPRING } from '@/lib/motion'

// Shared looping auto-carousel engine (Testimonials + Blog):
// - the track renders its items ×3 and starts centred on the middle set; once
//   scrolling settles, a teleport of exactly one set-width pulls the centred
//   card back into the middle set (mid-scroll jumps fight snap and glitch)
// - autoplay glides to the next card every `autoMs` while the track is in
//   view; the Apple-style pagination fill runs in sync and can be paused
//   (elapsed time is banked so resume continues where it left off)
// - programmatic moves use an eased rAF glide with scroll-snap suspended for
//   the ride (snap-mandatory would collapse the glide into a hard switch);
//   a user grab cancels the glide and restores snap immediately
export function useAutoCarousel(n: number, autoMs = 5000) {
  const trackRef = useRef<HTMLDivElement>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const remainingRef = useRef(autoMs)
  const prevActiveRef = useRef(0)
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)

  const cancelGlideInternal = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
    if (trackRef.current) trackRef.current.style.scrollSnapType = ''
  }

  // The EXPORTED cancelGlide is only ever wired to real user input
  // (pointerdown / wheel / touchstart in the hosts) — so it doubles as the
  // "visitor has grabbed this carousel themselves" signal that suppresses
  // the demo nudge. Programmatic glides use the internal variant.
  const userInteractedRef = useRef(false)
  const cancelGlide = () => {
    userInteractedRef.current = true
    cancelGlideInternal()
  }

  const glideTo = (el: HTMLElement, target: number, dur: number) => {
    cancelGlideInternal()
    const start = el.scrollLeft
    const dist = target - start
    if (Math.abs(dist) < 1) return
    el.style.scrollSnapType = 'none'
    const t0 = performance.now()
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      el.scrollLeft = start + dist * ease(p)
      if (p < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        animRef.current = null
        el.style.scrollSnapType = ''
      }
    }
    animRef.current = requestAnimationFrame(step)
  }

  const nearestCard = (el: HTMLElement) => {
    const cards = [...el.children] as HTMLElement[]
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - center) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center)) best = i
    })
    return { cards, best }
  }

  // Teleport back into the middle set ONLY once scrolling has settled.
  const settle = () => {
    const el = trackRef.current
    if (!el) return
    const { cards, best } = nearestCard(el)
    const setW = cards[n].offsetLeft - cards[0].offsetLeft
    if (best < n) el.scrollLeft += setW
    else if (best >= 2 * n) el.scrollLeft -= setW
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(nearestCard(el).best % n)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(settle, 150)
  }

  // Dot click → glide the middle-set card to the centre.
  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const card = el.children[n + i] as HTMLElement | undefined
    if (card) glideTo(el, card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, 750)
  }

  // Pause/play — banking the elapsed time so resume continues in sync with
  // the frozen progress fill.
  const togglePaused = () => {
    setPaused(p => {
      if (!p) remainingRef.current = Math.max(400, remainingRef.current - (Date.now() - startedAtRef.current))
      return !p
    })
  }

  // Start centred on the first card of the middle set; only autoplay while
  // the carousel is actually on screen.
  useEffect(() => {
    setReduced(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    const el = trackRef.current
    if (!el) return
    const c = el.children[n] as HTMLElement
    el.scrollLeft = c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
      io.observe(el)
    } else {
      setInView(true)
    }
    return () => {
      io?.disconnect()
      if (idleTimer.current) clearTimeout(idleTimer.current)
      cancelGlideInternal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Demo nudge: glide one card ahead ONCE — the movement itself tells the
  // visitor "this slides" without waiting out the full autoplay interval.
  // Called by useCarouselReveal after the cards' fade-up settles (NOT keyed
  // on this hook's `inView`, which goes true while the track merely peeks in
  // at the fold — the demo would spend itself off-screen before the visitor
  // arrives). The resulting active-change resets the autoplay schedule.
  const demoDoneRef = useRef(false)
  const demoNudge = () => {
    if (reduced || demoDoneRef.current) return
    // A visitor who already grabbed/scrolled the carousel has discovered the
    // mechanic — a demo glide now would fight their momentum scroll.
    if (userInteractedRef.current) return
    const el = trackRef.current
    if (!el) return
    // Mark spent only once we can actually perform the glide.
    demoDoneRef.current = true
    const { cards, best } = nearestCard(el)
    const next = cards[best + 1]
    if (next) glideTo(el, next.offsetLeft + next.offsetWidth / 2 - el.clientWidth / 2, 950)
  }

  // Autoplay: whenever a card becomes (or stays) active, glide to the NEXT
  // absolute card once the (pausable) interval runs out.
  useEffect(() => {
    if (reduced || !inView || paused) return
    if (prevActiveRef.current !== active) {
      prevActiveRef.current = active
      remainingRef.current = autoMs
    }
    startedAtRef.current = Date.now()
    const t = setTimeout(() => {
      remainingRef.current = autoMs
      const el = trackRef.current
      if (!el) return
      const { cards, best } = nearestCard(el)
      const next = cards[best + 1]
      if (next) glideTo(el, next.offsetLeft + next.offsetWidth / 2 - el.clientWidth / 2, 950)
    }, remainingRef.current)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced, inView, paused])

  return { trackRef, active, reduced, inView, paused, onScroll, cancelGlide, goTo, togglePaused, autoMs, demoNudge }
}

// One-shot card reveal for the carousels — the SAME entrance as the Services
// ("Tjenesterne") cards: fade + rise from the bottom, staggered LEFT→RIGHT
// across the visible cards. The track mounts centred on card `n` with card
// `n-1` peeking in from the left, so that card leads the sweep; delays grow
// with the loop index from there (capped, so far-off-screen clones don't lag
// behind for seconds). The demo glide in useAutoCarousel then slides one card
// AFTER this settles. Returns a per-card style factory.
export function useCarouselReveal(
  trackRef: React.RefObject<HTMLDivElement | null>,
  reduced: boolean,
  n: number,
  /** Fired once, a beat after the reveal settles — the demo glide hooks in here. */
  onSettled?: () => void,
) {
  const [revealed, setRevealed] = useState(false)
  // Settled = entrance transition (incl. stagger) is over. Used to DROP the
  // willChange hint — leaving it on would keep every card in the tripled
  // loop promoted to its own compositor layer for the life of the page.
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!revealed) return
    const t = setTimeout(() => {
      setSettled(true)
      onSettled?.()
    }, 1700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      // Shrink the viewport's bottom edge: the track must rise out of the
      // bottom fifth of the screen before the reveal starts. A bare threshold
      // can't do this — the track is short, so a large share of it is visible
      // even while it still peeks at the fold, and the reveal would play
      // before the visitor arrives (the "you don't really see it" bug).
      { rootMargin: '0px 0px -20% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trackRef, reduced])

  return (i: number): React.CSSProperties => {
    // Visual position relative to the leftmost card in view at mount (i = n-1).
    const step = Math.max(0, Math.min(i - (n - 1), 4))
    const delay = step * 130
    return {
      opacity: revealed ? 1 : 0,
      transform: revealed ? 'none' : 'translateY(28px)',
      // The Services entrance, slowed down so it registers (these cards are
      // much bigger than the service tiles). box-shadow stays in the list so
      // cards with a hover shadow keep animating it (an inline transition
      // would otherwise override the transition-shadow utility).
      transition: reduced
        ? 'none'
        : `opacity 0.75s ease ${delay}ms, transform 0.9s ${REVEAL_SPRING} ${delay}ms, box-shadow 0.3s ease`,
      willChange: settled ? undefined : 'opacity, transform',
    }
  }
}

// Apple-gallery pagination: dots where the active one stretches into a pill
// whose fill loads over the autoplay interval, plus a pause/play toggle.
export function CarouselPagination({
  count,
  carousel,
  itemLabel,
}: {
  count: number
  // Structural subset of useAutoCarousel's return — lets surfaces with their
  // own slide logic (the hero phone) reuse the exact same pagination UI.
  carousel: Pick<ReturnType<typeof useAutoCarousel>, 'active' | 'reduced' | 'inView' | 'paused' | 'goTo' | 'togglePaused' | 'autoMs'>
  itemLabel: (i: number) => string
}) {
  const { active, reduced, inView, paused, goTo, togglePaused, autoMs } = carousel
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: count }).map((_, i) => (
        // The button is the (invisible) 24px+ touch target — WCAG 2.5.8 /
        // Lighthouse target-size; the visible dot is the span inside.
        <button
          key={i}
          type="button"
          aria-label={itemLabel(i)}
          onClick={() => goTo(i)}
          className="flex items-center justify-center"
          style={{ minWidth: 24, height: 24, padding: 0 }}
        >
          <span
            className="relative overflow-hidden rounded-full transition-[width] duration-300 block"
            style={{
              width: active === i ? 52 : 9,
              height: 9,
              background: 'rgba(22,50,35,0.2)',
            }}
          >
            {active === i && (
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: '#163223',
                  width: reduced ? '100%' : undefined,
                  // Longhand props (not the `animation` shorthand) so the
                  // play-state can change without React shorthand conflicts.
                  animationName: reduced || !inView ? undefined : 'blog-progress',
                  animationDuration: `${autoMs}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              />
            )}
          </span>
        </button>
      ))}

      {/* Pause/play toggle, like Apple's gallery control */}
      {!reduced && (
        <button
          type="button"
          aria-label={paused ? 'Afspil automatisk visning' : 'Sæt automatisk visning på pause'}
          onClick={togglePaused}
          className="ml-3 flex items-center justify-center rounded-full transition-colors hover:bg-[rgba(22,50,35,0.18)]"
          style={{ width: 30, height: 30, background: 'rgba(22,50,35,0.1)' }}
        >
          {paused ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="#163223" aria-hidden>
              <path d="M3 1.5v9l7.5-4.5L3 1.5z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="#163223" aria-hidden>
              <rect x="1.5" y="1" width="3.2" height="10" rx="1.1" />
              <rect x="7.3" y="1" width="3.2" height="10" rx="1.1" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
