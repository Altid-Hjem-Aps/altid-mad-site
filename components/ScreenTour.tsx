'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import PhoneShell, { SCREEN_H, SCREEN_INSET, SCREEN_W, onScreen } from '@/components/iphone/PhoneShell'
import { SCREENS, type Scene } from '@/lib/screen-captures'

// A real picture of the app with motion on top: the app's push between frames, a
// soft dot where someone taps, and one crop of the frame rising out of the phone.
// The picture does the talking, so nothing here redraws the app.

const PUSH_MS = 300
const TAP_LEAD_MS = 300
const TAP_STEP_MS = 500
/** A lift nobody taps rises once the push has landed. */
const LIFT_RISE_AT_MS = 550
/** A tapped lift: the dot lands, then the crop answers it. */
const LIFT_TAP_AT_MS = 500
const LIFT_TAPPED_RISE_AT_MS = 800
const LIFT_TAP_GONE_AT_MS = 920
/** The crop has settled again before the taps start. */
const LIFT_FALL_BEFORE_MS = 1150
const LOOPS = 2
/** A frame that has not arrived by now counts as failed, so a stalled request cannot
 *  leave the tour looking as if it still plays. */
const DECODE_TIMEOUT_MS = 10_000

// One pause per page across all tours, remembered between visits.
const PAUSE_KEY = 'altid-tours-paused'
const pauseListeners = new Set<() => void>()

function readPaused() {
  try {
    return window.localStorage.getItem(PAUSE_KEY) === '1'
  } catch {
    return false
  }
}
let pausedNow: boolean | null = null

function setToursPaused(next: boolean) {
  pausedNow = next
  try {
    window.localStorage.setItem(PAUSE_KEY, next ? '1' : '0')
  } catch {
    // Private mode or blocked storage: the pause holds until the page closes.
  }
  pauseListeners.forEach((listener) => listener())
}

function subscribePause(listener: () => void) {
  pauseListeners.add(listener)
  return () => {
    pauseListeners.delete(listener)
  }
}

function useToursPaused() {
  return useSyncExternalStore(
    subscribePause,
    () => {
      if (pausedNow === null) pausedNow = readPaused()
      return pausedNow
    },
    () => false,
  )
}

function subscribeReducedMotion(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

/** Resolves when the frame can be drawn. Rejects if it failed or never arrived. */
function frameReady(img: HTMLImageElement | null | undefined) {
  if (!img) return Promise.resolve()
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), DECODE_TIMEOUT_MS)
  })
  return Promise.race([img.decode(), timeout]).finally(() => clearTimeout(timer))
}

export default function ScreenTour({
  scenes,
  label,
  preloadFirst = false,
}: {
  scenes: Scene[]
  /** The one description of this tour, the same on every frame. */
  label: string
  /** The hero's first frame is the page's LCP image. */
  preloadFirst?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const images = useRef<(HTMLImageElement | null)[]>([])
  const loopsDone = useRef(0)
  const [active, setActive] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  // Two full loops done, or a frame that would not load. Play starts it again.
  const [stopped, setStopped] = useState(false)
  const [lifted, setLifted] = useState(false)
  const [liftTap, setLiftTap] = useState(false)
  const [tapping, setTapping] = useState<number | null>(null)
  const paused = useToursPaused()
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  const running = inView && pageVisible && !paused && !stopped && !reduced

  useEffect(() => {
    if (!running) return
    let cancelled = false
    const scene = scenes[active]
    const timers: ReturnType<typeof setTimeout>[] = []

    // Lazy until the tour plays, then the next frames should be there in time.
    images.current.forEach((img) => {
      if (img) img.loading = 'eager'
    })

    if (scene.lift) {
      if (scene.lift.tapped) {
        timers.push(setTimeout(() => setLiftTap(true), LIFT_TAP_AT_MS))
        timers.push(setTimeout(() => setLiftTap(false), LIFT_TAP_GONE_AT_MS))
      }
      timers.push(setTimeout(() => setLifted(true), scene.lift.tapped ? LIFT_TAPPED_RISE_AT_MS : LIFT_RISE_AT_MS))
      timers.push(setTimeout(() => setLifted(false), scene.holdMs - LIFT_FALL_BEFORE_MS))
    }
    const taps = scene.tap ?? []
    taps.forEach((_, i) => {
      const before = TAP_LEAD_MS + (taps.length - 1 - i) * TAP_STEP_MS
      timers.push(setTimeout(() => setTapping(i), scene.holdMs - before))
    })

    timers.push(
      setTimeout(async () => {
        const next = (active + 1) % scenes.length
        try {
          await frameReady(images.current[next])
        } catch (error) {
          if (cancelled) return
          console.error(`ScreenTour: ${scenes[next].id} did not load, staying on ${scene.id}`, error)
          setStopped(true)
          return
        }
        if (cancelled) return
        setTapping(null)
        setPrevious(active)
        setActive(next)
        if (next === 0) {
          loopsDone.current += 1
          if (loopsDone.current >= LOOPS) setStopped(true)
        }
      }, scene.holdMs),
    )

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      setLifted(false)
      setLiftTap(false)
      setTapping(null)
    }
  }, [running, active, scenes])

  function togglePlay() {
    if (stopped) {
      // A frame that failed stays failed until it is asked for again.
      images.current.forEach((img) => {
        if (img && img.complete && img.naturalWidth === 0) {
          const { src } = img
          img.src = src
        }
      })
      loopsDone.current = 0
      setStopped(false)
      if (paused) setToursPaused(false)
      return
    }
    setToursPaused(!paused)
  }

  // By hand, the same promise as the timed path: never swap to a frame that is not there.
  async function step(i: number) {
    const img = images.current[i]
    if (img) img.loading = 'eager'
    try {
      await frameReady(img)
    } catch (error) {
      console.error(`ScreenTour: ${scenes[i].id} did not load, staying on ${scenes[active].id}`, error)
      return
    }
    setActive(i)
  }

  const scene = scenes[active]
  const frameWidth = SCREENS[scene.id].width
  const px = (value: number) => onScreen(value, frameWidth)
  const lift = scene.lift
  const tap = tapping === null ? null : scene.tap?.[tapping]
  const dot = tap ?? (liftTap && lift ? lift : null)
  const showPlay = paused || stopped

  return (
    <div ref={rootRef} className="relative mx-auto" style={{ width: SCREEN_W + SCREEN_INSET * 2 }}>
      <div className="relative">
        <PhoneShell>
          {scenes.map((s, i) => {
            const screen = SCREENS[s.id]
            const isActive = i === active
            const isPrevious = i === previous
            const pushes = !scene.inPlace
            // Waiting off to the side, only a little faded, so the push reads as the
            // app's slide. A frame that changes in place waits on the spot, unseen.
            const resting = s.inPlace
              ? { transform: 'none', opacity: 0 }
              : { transform: 'translateX(100%)', opacity: 0.5 }
            return (
              <div
                key={s.id}
                aria-hidden={isActive ? undefined : true}
                className="absolute inset-0"
                style={{
                  zIndex: isActive ? 2 : isPrevious ? 1 : 0,
                  ...(isActive
                    ? { transform: 'none', opacity: 1 }
                    : isPrevious
                      ? { transform: pushes ? 'translateX(-30%)' : 'none', opacity: 1 }
                      : resting),
                  transition:
                    !reduced && (isActive || isPrevious)
                      ? `transform ${PUSH_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${PUSH_MS}ms ease-out`
                      : 'none',
                }}
              >
                <Image
                  ref={(el) => {
                    images.current[i] = el
                  }}
                  src={screen.file}
                  alt={isActive ? label : ''}
                  width={screen.width}
                  height={screen.height}
                  unoptimized
                  preload={preloadFirst && i === 0}
                  draggable={false}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            )
          })}
          {dot && (
            <span
              key={`${scene.id}-${tap ? tapping : 'lift'}`}
              aria-hidden
              className="screen-tour-tap absolute z-[3] rounded-full"
              style={{
                left: px(dot.x + dot.w / 2) - 22,
                top: px(dot.y + dot.h / 2) - 22,
                width: 44,
                height: 44,
              }}
            />
          )}
        </PhoneShell>

        {lift && (
          <div
            aria-hidden
            className="absolute z-[4] pointer-events-none"
            style={{
              left: SCREEN_INSET + px(lift.x),
              top: SCREEN_INSET + px(lift.y),
              width: px(lift.w),
              height: px(lift.h),
              borderRadius: px(lift.r),
              backgroundImage: `url("${SCREENS[scene.id].file}")`,
              backgroundSize: `${SCREEN_W}px ${SCREEN_H}px`,
              backgroundPosition: `${-px(lift.x)}px ${-px(lift.y)}px`,
              opacity: lifted ? 1 : 0,
              transform: lifted ? `translateY(-8px) scale(${lift.scale})` : 'none',
              boxShadow: lifted ? '0 18px 34px rgba(13,21,32,0.28)' : '0 0 0 rgba(13,21,32,0)',
              transition: 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 420ms ease-out, opacity 160ms linear',
            }}
          />
        )}
      </div>

      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={showPlay ? 'Afspil animationen' : 'Sæt animationen på pause'}
          className="screen-tour-control"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="currentColor">
            {showPlay ? (
              <path d="M4.5 2.6v10.8c0 .5.5.8 1 .5l8.3-5.4c.4-.3.4-.8 0-1L5.5 2.1c-.5-.3-1 0-1 .5Z" />
            ) : (
              <>
                <rect x="3.5" y="2" width="3.2" height="12" rx="1" />
                <rect x="9.3" y="2" width="3.2" height="12" rx="1" />
              </>
            )}
          </svg>
        </button>

        <div className="hidden motion-reduce:flex" role="group" aria-label={label}>
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => step(i)}
              aria-label={`Skærm ${i + 1} af ${scenes.length}: ${s.alt}`}
              aria-current={i === active ? 'true' : undefined}
              className="screen-tour-dot"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
