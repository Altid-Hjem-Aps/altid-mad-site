'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import PhoneShell, { TabBar, HomeIndicator } from '@/components/iphone/PhoneShell'
import { fluid } from '@/lib/fluid'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Shared kit for the two "Problemet, vi løser automatisk" sections. Each
// section poses one everyday question (copy column) next to the SAME iPhone
// the hero uses (PhoneShell), where the answer plays out as an in-app user
// flow — scene by scene, exactly like the Altid Mad UI-animation storyboard
// (video/Altid Mad - UI Animation 16x9.html). One 200ms tick drives each
// phone's whole choreography, so pause/resume freezes scenes, pops and the
// pagination pill in lockstep (the ProblemSolved pattern, kept verbatim).

export const TEAL = '#0f6e68'
export const MINT = '#bfe6e0'
export const FOREST = '#163223'
export const MUTED = '#6f6a61'
export const HAIRLINE = 'rgba(15,110,104,0.12)'

export const ACCENT = {
  blue: { wash: 'rgba(47,143,208,0.13)', ink: '#1c567e', dot: '#2f8fd0' },
  amber: { wash: 'rgba(232,139,47,0.15)', ink: '#7d430e', dot: '#e88b2f' },
  brand: { wash: 'rgba(15,110,104,0.1)', ink: TEAL, dot: TEAL },
}

// The savings tone: a mid-teal that reads clearly on the beige screen — used
// for "+X kr." savings figures across the phone mockups.
export const SAVE_TEAL = '#3d9187'

export const EASE_EXPO = [0.16, 1, 0.3, 1] as const
export const EASE_QUINT = [0.22, 1, 0.36, 1] as const

const TICK_MS = 200

// ── Small in-phone primitives ───────────────────────────────────────────────

/** The Altid Mad four-point star from the storyboard's kicker. */
export function Star({ size = 12, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="-9 -9 18 18" fill="none" aria-hidden>
      <path
        d="M0 -9C1.2 -3.4 3.4 -1.2 9 0C3.4 1.2 1.2 3.4 0 9C-1.2 3.4 -3.4 1.2 -9 0C-3.4 -1.2 -1.2 -3.4 0 -9Z"
        fill={color}
      />
    </svg>
  )
}

export function SceneHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2.5">
      <p className="text-[14.5px] font-semibold leading-tight" style={{ color: FOREST }}>{title}</p>
      <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>{sub}</p>
    </div>
  )
}

export function PopCheck({ show, size = 15 }: { show: boolean; size?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: size, height: size, background: TEAL }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE_QUINT }}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M1.5 5.5L4 8l4.5-5.5" stroke={MINT} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function Thumb({ src, size, radius = 7 }: { src: string; size: number; radius?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="shrink-0 object-cover"
      style={{ width: size, height: size, borderRadius: radius }}
    />
  )
}

/** Mint primary button. Always in the layout; starts disabled (washed mint)
 *  and becomes active with a small confirming pop once the flow allows it.
 *  When `pressing` flips true it does a tap-down (button press) to signal the
 *  slide is about to change. States are driven by a variant NAME string so the
 *  keyframe pop fires exactly once on the edge, not on every 200ms tick. */
export function MintCta({
  label,
  show = true,
  active = true,
  pressing = false,
  tone = 'mint',
  pop = true,
}: {
  label: string
  show?: boolean
  active?: boolean
  pressing?: boolean
  /** 'white' = white pill + hairline + lift; 'teal' = solid teal pill (a strong
   *  primary that stands out over the blur overlay). */
  tone?: 'mint' | 'white' | 'teal'
  /** Set false to activate quietly (colour only) — the scale pop can read as
   *  an early press when the real click follows soon after. */
  pop?: boolean
}) {
  const state = pressing ? 'pressing' : active ? 'active' : 'inactive'
  const white = tone === 'white'
  const teal = tone === 'teal'
  return (
    <motion.div
      className="flex items-center justify-center rounded-2xl font-semibold"
      style={{
        height: 38,
        fontSize: 11,
        background: teal
          ? active ? TEAL : 'rgba(15,110,104,0.4)'
          : white
            ? active ? '#fff' : 'rgba(255,255,255,0.55)'
            : active ? MINT : 'rgba(191,230,224,0.35)',
        color: teal ? (active ? '#eafaf6' : 'rgba(234,250,246,0.65)') : active ? FOREST : 'rgba(22,50,35,0.4)',
        border: white ? `1px solid ${active ? 'rgba(15,110,104,0.28)' : HAIRLINE}` : 'none',
        boxShadow: white && active ? '0 10px 24px -12px rgba(22,50,35,0.45)' : teal && active ? '0 10px 24px -12px rgba(15,110,104,0.55)' : 'none',
        transition: 'background 0.4s ease, color 0.4s ease',
        transformOrigin: 'center',
      }}
      initial={false}
      animate={state}
      variants={{
        inactive: { opacity: show ? 1 : 0, y: show ? 0 : 8, scale: 1 },
        active: { opacity: show ? 1 : 0, y: show ? 0 : 8, scale: pop ? [1, 1.05, 1] : 1 },
        // Quick click: dip down a touch, then pop straight back up.
        pressing: { opacity: 1, y: 0, scale: [1, 0.93, 1] },
      }}
      transition={{
        duration: 0.4,
        ease: EASE_EXPO,
        scale: pressing ? { duration: 0.26, ease: 'easeOut' } : { duration: 0.5, ease: EASE_QUINT },
      }}
    >
      {label}
    </motion.div>
  )
}

/** The FAQ-style "Vis flere" pill — positioned by the call site (it floats
 *  over the faded last pill row, so more options clearly wait below). */
export function VisFlerePill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 font-semibold"
      style={{
        height: 28,
        fontSize: 9.5,
        background: '#fff',
        color: FOREST,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 2px 10px rgba(22,50,35,0.08)',
      }}
    >
      Vis flere
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ── The app-icon closer ─────────────────────────────────────────────────────

// The shared final scene: the phone shrinks away (via the flow's `opener`
// mechanism) into the Altid Hjem app icon with the group tagline.
export const APP_ICON_MS = 3600

export function AppIconClose() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/app-badge.png"
        alt=""
        style={{ width: 84, height: 84, borderRadius: 20, boxShadow: '0 18px 40px -16px rgba(22,50,35,0.45)' }}
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_QUINT, delay: 0.25 }}
      />
      <motion.p
        className="text-center font-semibold text-balance"
        style={{ fontSize: 17, color: FOREST, maxWidth: 300 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_EXPO, delay: 0.55 }}
      >
        Altid Mad finder du i Altid Hjem appen
      </motion.p>
    </div>
  )
}

// ── The flow phone ──────────────────────────────────────────────────────────

export interface FlowScene {
  key: string
  /** Pagination label (Danish, human-readable). */
  label: string
  render: (t: number) => ReactNode
  /** Optional per-scene window in ms (defaults to the flow's sceneMs). Lets a
   *  single scene run longer — e.g. the swipe lingering on one card. */
  ms?: number
  /** An "opener" scene renders FULL over the phone (no bezel/chrome) — a real
   *  physical scene — and the phone stays closed until the scene's last beat,
   *  when it opens (scales up from the centre icon). Used by the Indkøb intro. */
  opener?: boolean
}

// Scene-to-scene is a quick step forward; the LOOP back to scene 0 is its own
// beat — the finished flow sinks away and the story rises in fresh, slightly
// slower and with a breath of delay, so the restart never reads as a glitch.
const sceneVariants: Variants = {
  enter: (loop: boolean) => (loop ? { opacity: 0, y: 26, scale: 0.985 } : { opacity: 0, y: 14 }),
  center: (loop: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: loop ? 0.65 : 0.5, ease: EASE_EXPO, delay: loop ? 0.15 : 0 },
  }),
  exit: (loop: boolean) =>
    loop
      ? { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.5, ease: EASE_QUINT } }
      : { opacity: 0, y: -10, transition: { duration: 0.32, ease: EASE_QUINT } },
}

function ScreenChrome({ title, tab, children }: { title: string; tab: 'hjem' | 'mad'; children: ReactNode }) {
  return (
    <>
      <div className="px-5 pt-2 pb-2.5 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-light)' }}>
            Altid Mad
          </p>
          <p className="text-base font-bold" style={{ color: TEAL }}>{title}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/services/icon-mad.svg" alt="" style={{ width: 30, height: 30, flexShrink: 0 }} />
      </div>
      <div className="relative flex-1 min-h-0 mx-4">{children}</div>
      <TabBar active={tab} />
      <HomeIndicator />
    </>
  )
}

export interface FlowPhoneProps {
  scenes: FlowScene[]
  /** Uniform scene window in ms — keeps the pagination pill truthful. */
  sceneMs: number
  screenTitle: string
  tab: 'hjem' | 'mad'
  /** Reduced-motion still: the flow's end state. */
  still: ReactNode
}

function FlowPhone({ scenes, sceneMs, screenTitle, tab, still }: FlowPhoneProps) {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  // Scrub-in-progress — the clock freezes so a held pointer can't drift the
  // playhead across a scene boundary (or into the opener) on its own.
  const [scrubbing, setScrubbing] = useState(false)
  // Bumped on every viewport entry: scenes mount at PAGE load, so their
  // wall-clock entrance animations would otherwise play out off-screen and
  // the first scene would look "already finished" when scrolled to. Keying
  // the scene by runId remounts it fresh alongside the tick reset.
  const [runId, setRunId] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  // Play only while in view — paused off-screen (perf). Every entry into the
  // viewport RESTARTS the story from scene 1, so scrolling to a section
  // always shows the flow from its beginning rather than mid-loop.
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setPlaying(true)
      return
    }
    const io = new IntersectionObserver(([e]) => {
      setPlaying(e.isIntersecting)
      if (e.isIntersecting) {
        setTick(0)
        setRunId((r) => r + 1)
      }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The shared clock — stopping the interval IS the pause (and the scrub).
  useEffect(() => {
    if (reduced || !playing || paused || scrubbing) return
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [reduced, playing, paused, scrubbing])

  // Per-scene windows: each scene runs for its own `ms` (default sceneMs), so
  // one scene (the swipe) can linger longer without speeding up the rest.
  const durations = scenes.map((s) => s.ms ?? sceneMs)
  const starts: number[] = []
  let acc = 0
  for (const d of durations) {
    starts.push(acc)
    acc += d
  }
  const total = acc

  // Loop reset in its own effect — never inside another setter's updater
  // (StrictMode double-invokes updaters; see ProblemSolved's swap bug).
  useEffect(() => {
    if (tick * TICK_MS >= total) setTick(0)
  }, [tick, total])

  const elapsed = tick * TICK_MS
  let index = 0
  for (let i = 0; i < starts.length; i++) if (elapsed >= starts[i]) index = i
  const t = elapsed - starts[index]

  // Wrap detection: the jump from the last scene back to the first gets the
  // loop choreography instead of the ordinary scene step.
  const prevIndexRef = useRef(0)
  const looping = index === 0 && prevIndexRef.current === scenes.length - 1
  useEffect(() => {
    prevIndexRef.current = index
  }, [index])

  // Opener handling: the phone is closed (scaled into the centre) for the whole
  // opener scene; the moment the opener hands off to the first real scene it
  // opens (scales up from the icon) while the opener overlay fades out over it.
  const isOpener = !reduced && !!scenes[index].opener
  const phoneOpen = !isOpener

  return (
    <div ref={stageRef} className="relative flex flex-col items-center">
      {/* Soft mint halo behind the phone — the storyboard's canvas ellipse. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 540,
          maxWidth: '92vw',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(closest-side, rgba(191,230,224,0.55) 0%, rgba(191,230,224,0.3) 55%, rgba(191,230,224,0) 100%)',
        }}
      />
      <div className="relative">
        {/* The phone itself. During an "opener" scene it stays closed (scaled
            into the centre) and only opens for its last beat — so the app looks
            like it launches from the icon the opener hands off to. */}
        <motion.div
          style={{ transformOrigin: 'center center' }}
          initial={false}
          animate={{ scale: phoneOpen ? 1 : 0.34, opacity: phoneOpen ? 1 : 0 }}
          transition={{ duration: 0.55, ease: EASE_EXPO }}
        >
          <PhoneShell softShadow>
            {reduced ? (
              <ScreenChrome title={screenTitle} tab={tab}>
                <div className="absolute inset-0">{still}</div>
              </ScreenChrome>
            ) : (
              <ScreenChrome title={screenTitle} tab={tab}>
                <AnimatePresence custom={looping}>
                  <motion.div
                    key={`${scenes[index].key}-${runId}`}
                    custom={looping}
                    variants={sceneVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    {scenes[index].opener ? null : scenes[index].render(t)}
                  </motion.div>
                </AnimatePresence>
              </ScreenChrome>
            )}
          </PhoneShell>
        </motion.div>

        {/* Opener overlay — the physical scene, covering the whole phone box
            (bezel included) so there is no phone until it opens. It fades out
            (AnimatePresence exit) as the phone scales up into the first scene. */}
        <AnimatePresence>
          {isOpener && (
            <motion.div
              key="opener"
              className="absolute"
              style={{ top: '-6%', bottom: '-6%', left: '50%', width: 'clamp(340px, 92vw, 1080px)', x: '-50%', zIndex: 40 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_EXPO }}
            >
              {scenes[index].render(t)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!reduced && (
        <div className="relative mt-7">
          <FlowTimeline
            scenes={scenes}
            durations={durations}
            starts={starts}
            elapsed={elapsed}
            paused={paused}
            hidden={isOpener}
            dragging={scrubbing}
            onDraggingChange={setScrubbing}
            // Ceil, not round: several scene starts aren't multiples of the
            // 200ms tick, and rounding DOWN would land a keyboard seek one
            // tick before its target scene (the arrow key then goes nowhere).
            onSeek={(ms) => setTick(Math.ceil(ms / TICK_MS))}
            onTogglePaused={() => setPaused((p) => !p)}
          />
        </div>
      )}
    </div>
  )
}

// ── The timeline ────────────────────────────────────────────────────────────

// Dot pagination with a built-in scrubber: inactive scenes are plain dots
// (click = jump there); the ACTIVE scene's dot opens into a pill that shows
// the scene's progress and can be dragged/clicked to go back and forth
// WITHIN that scene (arrow keys nudge ±1s). It hides while the app-icon
// closer plays and returns with scene 1.
function FlowTimeline({
  scenes,
  durations,
  starts,
  elapsed,
  paused,
  hidden,
  dragging,
  onDraggingChange,
  onSeek,
  onTogglePaused,
}: {
  scenes: FlowScene[]
  durations: number[]
  starts: number[]
  elapsed: number
  paused: boolean
  hidden: boolean
  dragging: boolean
  onDraggingChange: (d: boolean) => void
  onSeek: (ms: number) => void
  onTogglePaused: () => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const setDragging = onDraggingChange

  // Window-level release: dragging freezes the clock, so a pointerup that
  // never reaches the bar (capture failed, released elsewhere) must still end
  // the scrub — otherwise the animation stays frozen.
  useEffect(() => {
    if (!dragging) return
    const end = () => setDragging(false)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, setDragging])

  // The app-icon closer (opener scene, trailing) has no dot of its own —
  // the pagination hides while it plays, so it can't be scrubbed into either.
  const visCount = scenes.filter((s) => !s.opener).length

  let index = 0
  for (let i = 0; i < starts.length; i++) if (elapsed >= starts[i]) index = i
  const activeIndex = Math.min(index, visCount - 1)

  // Scrub WITHIN the active scene: the expanded pill maps its width onto the
  // scene's own duration. Clamp a hair under the end — landing exactly on it
  // would trip the next scene under the pointer.
  const seekFromClientX = (clientX: number) => {
    const el = barRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    onSeek(Math.min(starts[activeIndex] + durations[activeIndex] - TICK_MS, starts[activeIndex] + frac * durations[activeIndex]))
  }

  return (
    <motion.div
      className="flex items-center justify-center gap-0"
      initial={false}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? 6 : 0 }}
      transition={{ duration: 0.35, ease: EASE_EXPO }}
      style={{ pointerEvents: hidden ? 'none' : 'auto' }}
      aria-hidden={hidden || undefined}
    >
      {scenes.slice(0, visCount).map((s, i) => {
        // ONE persistent element per scene whose role flips with `active`:
        // a dot (button semantics, click = jump there) that opens into the
        // 52px scrubber pill when its scene plays. Keeping the element
        // mounted preserves keyboard focus across scene changes and lets the
        // dot→pill width transition actually animate.
        const active = i === activeIndex
        const segFill = Math.min(1, Math.max(0, (elapsed - starts[i]) / durations[i]))
        const sceneT = Math.min(durations[i], Math.max(0, elapsed - starts[i]))
        return (
          <div key={s.key} className="flex items-center justify-center" style={{ minWidth: 24, height: 24 }}>
            <div
              ref={active ? barRef : undefined}
              role={active ? 'slider' : 'button'}
              tabIndex={hidden ? -1 : 0}
              aria-label={active ? `${s.label} — træk eller brug piletasterne for at spole` : `Gå til ${s.label}`}
              aria-valuemin={active ? 0 : undefined}
              aria-valuemax={active ? Math.round(durations[i] / 1000) : undefined}
              aria-valuenow={active ? Math.round(sceneT / 1000) : undefined}
              aria-valuetext={active ? `${Math.round(sceneT / 1000)} af ${Math.round(durations[i] / 1000)} sekunder` : undefined}
              onClick={active ? undefined : () => onSeek(starts[i])}
              onPointerDown={
                active
                  ? (e) => {
                      setDragging(true)
                      seekFromClientX(e.clientX)
                      // Keep the drag alive when the pointer leaves the pill;
                      // guarded — capture can throw on synthetic pointers.
                      try {
                        e.currentTarget.setPointerCapture(e.pointerId)
                      } catch {
                        /* drag still works while the pointer stays on the pill */
                      }
                    }
                  : undefined
              }
              onPointerMove={
                active
                  ? (e) => {
                      // buttons-guard: if capture failed and the pointer was
                      // released off-element, hover must not scrub.
                      if (dragging && (e.buttons & 1 || e.pointerType === 'touch')) seekFromClientX(e.clientX)
                    }
                  : undefined
              }
              onPointerUp={active ? () => setDragging(false) : undefined}
              onPointerCancel={active ? () => setDragging(false) : undefined}
              onLostPointerCapture={active ? () => setDragging(false) : undefined}
              onKeyDown={(e) => {
                if (!active && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSeek(starts[i])
                }
                if (active && e.key === 'ArrowRight') {
                  e.preventDefault()
                  onSeek(Math.min(starts[i] + durations[i] - TICK_MS, starts[i] + sceneT + 1000))
                }
                if (active && e.key === 'ArrowLeft') {
                  e.preventDefault()
                  onSeek(Math.max(starts[i], starts[i] + sceneT - 1000))
                }
              }}
              className="relative overflow-hidden rounded-full transition-[width] duration-300 block"
              style={{
                width: active ? 52 : 9,
                height: 9,
                background: 'rgba(22,50,35,0.2)',
                touchAction: active ? 'none' : undefined,
                cursor: active ? 'ew-resize' : 'pointer',
              }}
            >
              <span
                className="absolute inset-y-0 left-0 block rounded-full"
                style={{
                  background: '#163223',
                  width: active ? `${segFill * 100}%` : 0,
                  // Smooth the 200ms tick steps — but not while scrubbing,
                  // where the fill must track the pointer instantly.
                  transition: dragging ? 'none' : 'width 0.2s linear',
                }}
              />
            </div>
          </div>
        )
      })}

      {/* Pause/play toggle, same control as the site's other carousels */}
      <button
        type="button"
        aria-label={paused ? 'Afspil animationen' : 'Sæt animationen på pause'}
        onClick={onTogglePaused}
        tabIndex={hidden ? -1 : 0}
        className="ml-3 flex items-center justify-center rounded-full transition-colors hover:bg-[rgba(22,50,35,0.18)]"
        style={{ width: 30, height: 30, background: 'rgba(22,50,35,0.1)', flexShrink: 0 }}
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
    </motion.div>
  )
}

// ── The section ─────────────────────────────────────────────────────────────

export interface QuestionSectionProps {
  question: string
  answer: string
  /** The small line above the heading (e.g. "Første spørgsmål"). */
  kicker?: string
  /** Proof pills under the answer — the storyboard's white chips. */
  chips: string[]
  /** Phone left + copy right on desktop (section 2's zig-zag). */
  mirror?: boolean
  /** Centered hero layout: copy on top, ONE full-width stage below (like the
   *  Altid Hjem "Ét hjem" scene) — used for the opener/intro section. */
  centered?: boolean
  flow: FlowPhoneProps
}

export default function QuestionSection({
  question,
  answer,
  kicker = 'Problemet, vi løser automatisk',
  chips,
  mirror = false,
  centered = false,
  flow,
}: QuestionSectionProps) {
  const reduced = useReducedMotion()
  // Own in-view flag for the chip reveal — framer's whileInView constructs an
  // IntersectionObserver unguarded, which throws in jsdom (the test suite
  // renders the whole page). Same guarded pattern as FlowPhone.
  const chipsRef = useRef<HTMLDivElement>(null)
  const [chipsIn, setChipsIn] = useState(false)
  useEffect(() => {
    const el = chipsRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setChipsIn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setChipsIn(true)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const showChips = chipsIn || !!reduced

  // Section-level in-view flag driving the copy + phone reveal (guarded IO,
  // same pattern as the chips; fires once).
  const sectionRef = useRef<HTMLElement>(null)
  const [sectionIn, setSectionIn] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSectionIn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSectionIn(true)
          io.disconnect()
        }
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Centered hero layout — heading centred on top, ONE full-width stage below
  // (mirrors Altid Hjem's WhatIs/EtHjem). The phone sits at the section centre,
  // so the opener's wide physical scene lands in the middle of the section.
  if (centered) {
    return (
      <section className="relative overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-[clamp(56px,6.5vw,112px)]">
          <div className="mx-auto text-center" style={{ maxWidth: 680 }}>
            <p className={EYEBROW} style={{ color: TEAL }}>{kicker}</p>
            <h2 className={`${H2} mt-5 text-balance`} style={{ color: FOREST }}>{question}</h2>
            <p className={`${BODY} mt-6 mx-auto text-pretty`} style={{ color: MUTED, maxWidth: 620 }}>{answer}</p>
            <div ref={chipsRef} className="mt-8 flex flex-wrap justify-center gap-3">
              {chips.map((c, i) => (
                <motion.span
                  key={c}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white px-[18px] py-[11px] text-[15px]"
                  style={{ border: '1px solid #ece7db', color: FOREST }}
                  initial={false}
                  animate={{ opacity: showChips ? 1 : 0, y: showChips ? 0 : 10 }}
                  transition={{ duration: 0.5, ease: EASE_EXPO, delay: showChips ? 0.15 + i * 0.12 : 0 }}
                >
                  <span className="inline-block rounded-full shrink-0" style={{ width: 5, height: 5, background: TEAL }} />
                  {c}
                </motion.span>
              ))}
            </div>
          </div>
          <div className="relative mx-auto mt-[clamp(28px,4vw,64px)] flex justify-center">
            <FlowPhone {...flow} />
          </div>
        </div>
      </section>
    )
  }

  // Scroll-in reveal for the whole section: kicker → heading → answer stagger
  // in, and the phone (mockup + pagination) rises with them. Chips keep their
  // own observer (they sit lower and reveal on their own beat).
  const revealed = sectionIn || !!reduced
  const rise = (delay: number) => ({
    initial: false as const,
    animate: { opacity: revealed ? 1 : 0, y: revealed ? 0 : 22 },
    transition: { duration: 0.6, ease: EASE_EXPO, delay: revealed ? delay : 0 },
  })

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-y-12 lg:gap-x-[clamp(40px,5vw,100px)] py-[clamp(56px,6.5vw,112px)]">
        {/* Copy — pushed toward the outer edge like the founder section. */}
        <div
          className={mirror ? 'flex flex-col pl-6 sm:pl-10 lg:pl-0 lg:order-2' : 'flex flex-col pr-6 sm:pr-10 lg:pr-0'}
          style={mirror ? { paddingRight: fluid(140, 24) } : { paddingLeft: fluid(240, 32) }}
        >
          <motion.p className={EYEBROW} style={{ color: TEAL }} {...rise(0)}>{kicker}</motion.p>
          <motion.h2 className={`${H2} mt-5 text-balance`} style={{ color: FOREST, maxWidth: 560 }} {...rise(0.1)}>
            {question}
          </motion.h2>
          <motion.p className={`${BODY} mt-6 text-pretty`} style={{ color: MUTED, maxWidth: 560 }} {...rise(0.2)}>
            {answer}
          </motion.p>
          <div ref={chipsRef} className="mt-8 flex flex-wrap gap-3">
            {chips.map((c, i) => (
              <motion.span
                key={c}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-[18px] py-[11px] text-[15px]"
                style={{ border: '1px solid #ece7db', color: FOREST }}
                initial={false}
                animate={{ opacity: showChips ? 1 : 0, y: showChips ? 0 : 10 }}
                transition={{ duration: 0.5, ease: EASE_EXPO, delay: showChips ? 0.15 + i * 0.12 : 0 }}
              >
                <span className="inline-block rounded-full shrink-0" style={{ width: 5, height: 5, background: TEAL }} />
                {c}
              </motion.span>
            ))}
          </div>
        </div>

        {/* The phone (mockup + pagination), centred in its own half. */}
        <motion.div
          className={mirror ? 'w-full flex justify-center px-6 lg:order-1' : 'w-full flex justify-center px-6'}
          {...rise(0.15)}
        >
          <FlowPhone {...flow} />
        </motion.div>
      </div>
    </section>
  )
}
