'use client'

import { useEffect, useRef, useState } from 'react'
import PhoneShell from './iphone/PhoneShell'
import MealPlanScreen from './iphone/MealPlanScreen'
import GroceryListScreen from './iphone/GroceryListScreen'
import OffersScreen from './iphone/OffersScreen'
import { CarouselPagination } from './useAutoCarousel'

const SCREEN_COUNT = 3
const AUTO_ADVANCE_MS = 6000
const SWIPE_THRESHOLD = 40

export default function IPhoneMockup() {
  const [hovered, setHovered] = useState(false)
  const [showSidePhones, setShowSidePhones] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  // Real prefers-reduced-motion value — gates autoplay and the pagination pill.
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])
  const containerRef = useRef<HTMLDivElement>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Autoplay bookkeeping — mirrors useAutoCarousel so the slide advance and
  // the pagination pill's fill share the same epoch (the pill restarts its
  // CSS animation on every active-slide change and on view re-entry).
  const remainingRef = useRef(AUTO_ADVANCE_MS)
  const startedAtRef = useRef(0)
  const prevIndexRef = useRef(0)
  const touchStartX = useRef<number | null>(null)
  const hoverCountRef = useRef(0)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // JS-driven md+ gate — prevents side phones leaking into mobile DOM
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    // Below 1050px the side phones crop harshly, so narrower windows get the
    // single phone + pagination instead of the three-phone fan.
    const mql = window.matchMedia('(min-width: 1050px)')
    const sync = () => setShowSidePhones(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  // Drive `hovered` from scroll visibility — single threshold avoids
  // old iOS Safari bugs with threshold arrays; 1.5s fallback fires if IO never fires.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let ioFired = false
    const fallback = setTimeout(() => {
      if (!ioFired) setHovered(true)
    }, 1500)
    if (typeof IntersectionObserver === 'undefined') {
      return () => clearTimeout(fallback)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        ioFired = true
        setHovered(entry.isIntersecting)
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => {
      clearTimeout(fallback)
      observer.disconnect()
    }
  }, [])

  // Carousel autoplay — single-phone layout only (below the 1050px fan gate).
  // One timeout per slide, keyed on carouselIndex: any slide change (auto,
  // swipe or dot tap) restarts both this timer and the pill fill together, so
  // the advance always lands exactly when the pill completes.
  useEffect(() => {
    if (showSidePhones || reducedMotion || !hovered || paused) return
    if (prevIndexRef.current !== carouselIndex) {
      prevIndexRef.current = carouselIndex
      remainingRef.current = AUTO_ADVANCE_MS
    }
    startedAtRef.current = Date.now()
    const t = setTimeout(() => {
      remainingRef.current = AUTO_ADVANCE_MS
      setCarouselIndex(i => (i + 1) % SCREEN_COUNT)
    }, remainingRef.current)
    return () => {
      clearTimeout(t)
      // Sentinel: no timer is live — togglePaused must not bank elapsed time.
      startedAtRef.current = 0
    }
  }, [carouselIndex, hovered, paused, reducedMotion, showSidePhones])

  // Leaving the viewport (or switching to/from the desktop fan) resets the
  // pill fill — reset the timer budget with it so they stay in lockstep.
  useEffect(() => {
    if (!hovered || showSidePhones) remainingRef.current = AUTO_ADVANCE_MS
  }, [hovered, showSidePhones])

  // Per-phone desktop hover — only fires when cursor is over an actual phone shape
  function onPhoneEnter() {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    hoverCountRef.current++
    setHovered(true)
  }
  function onPhoneLeave() {
    hoverCountRef.current--
    leaveTimerRef.current = setTimeout(() => {
      if (hoverCountRef.current <= 0) {
        hoverCountRef.current = 0
        setHovered(false)
      }
    }, 50)
  }

  // Swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    setCarouselIndex(i =>
      delta < 0 ? (i + 1) % SCREEN_COUNT : (i - 1 + SCREEN_COUNT) % SCREEN_COUNT,
    )
  }

  function togglePaused() {
    const next = !pausedRef.current
    pausedRef.current = next
    // Bank remaining time only while a timer is actually live (startedAtRef
    // is 0 otherwise) — a pause tap before autoplay starts must not clamp
    // the first slide to the 400ms floor.
    if (next && startedAtRef.current) {
      remainingRef.current = Math.max(400, remainingRef.current - (Date.now() - startedAtRef.current))
    }
    setPaused(next)
  }

  function goToSlide(i: number) {
    setCarouselIndex(i)
  }

  const screens = [
    (active: boolean) => <MealPlanScreen hovered={active} />,
    (active: boolean) => <GroceryListScreen hovered={active} />,
    (active: boolean) => <OffersScreen hovered={active} />,
  ]

  return (
    <div ref={containerRef} className="flex justify-center w-full">
      {showSidePhones ? (
        /* Desktop: three phones fan out on hover. Decorative — without
           aria-hidden the Personlig AI screen's questions would read to
           screen readers as prompts with no way to answer. */
        <div
          className="relative w-[580px]"
          aria-hidden
          style={{ height: 580 }}
          onTouchStart={() => setHovered(true)}
          onTouchEnd={() => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
            resetTimerRef.current = setTimeout(() => setHovered(false), 2800)
          }}
        >
          {/* Back-left: grocery list */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: 30,
              transform: hovered
                ? 'translateX(-50%) translateX(-185px) translateY(-6px) rotate(-11deg) scale(0.85)'
                : 'translateX(-50%) translateX(-175px) translateY(0) rotate(-10deg) scale(0.85)',
              transformOrigin: 'center bottom',
              zIndex: 1,
              opacity: 0.94,
              filter: 'saturate(0.92)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}
            onMouseEnter={onPhoneEnter}
            onMouseLeave={onPhoneLeave}
          >
            <PhoneShell variant="back" hovered={hovered}>
              <GroceryListScreen hovered={hovered} />
            </PhoneShell>
          </div>

          {/* Back-right: this week's offers */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: 30,
              transform: hovered
                ? 'translateX(-50%) translateX(185px) translateY(-6px) rotate(11deg) scale(0.85)'
                : 'translateX(-50%) translateX(175px) translateY(0) rotate(10deg) scale(0.85)',
              transformOrigin: 'center bottom',
              zIndex: 1,
              opacity: 0.94,
              filter: 'saturate(0.92)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}
            onMouseEnter={onPhoneEnter}
            onMouseLeave={onPhoneLeave}
          >
            <PhoneShell variant="back" hovered={hovered}>
              <OffersScreen hovered={hovered} />
            </PhoneShell>
          </div>

          {/* Foreground: the week's meal plan */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: 0,
              transform: hovered
                ? 'translateX(-50%) translateY(-10px)'
                : 'translateX(-50%) translateY(0)',
              zIndex: 2,
              transition: hovered
                ? 'transform 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)'
                : 'transform 0.5s ease',
            }}
            onMouseEnter={onPhoneEnter}
            onMouseLeave={onPhoneLeave}
          >
            <PhoneShell hovered={hovered}>
              <MealPlanScreen hovered={hovered} />
            </PhoneShell>
          </div>
        </div>
      ) : (
        /* Mobile: single phone, screens slide inside. The phone is decorative
           (see the desktop note); the pagination below stays exposed. */
        <div className="flex flex-col items-center">
          <div aria-hidden>
          <PhoneShell hovered={hovered} softShadow>
            <div
              style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  width: `${SCREEN_COUNT * 100}%`,
                  transform: `translateX(${-carouselIndex * (100 / SCREEN_COUNT)}%)`,
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {screens.map((renderScreen, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${100 / SCREEN_COUNT}%`,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    {renderScreen(hovered && carouselIndex === i)}
                  </div>
                ))}
              </div>
            </div>
          </PhoneShell>
          </div>

          {/* Same Apple-style pagination as Blog/Testimonials */}
          <div style={{ marginTop: 28 }}>
            <CarouselPagination
              count={SCREEN_COUNT}
              carousel={{
                active: carouselIndex,
                reduced: reducedMotion,
                inView: hovered,
                paused,
                goTo: goToSlide,
                togglePaused,
                autoMs: AUTO_ADVANCE_MS,
              }}
              itemLabel={(i) => `Skærm ${i + 1}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
