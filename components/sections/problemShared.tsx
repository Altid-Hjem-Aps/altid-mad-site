'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PhoneShell, { PhoneScreen, decodeFrame } from '@/components/iphone/PhoneShell'
import { SCREENS, type Beat, type FlowScene, type Region, type Reveal, type Press } from '@/lib/screen-captures'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// Shared kit for the two "Problemet, vi løser automatisk" sections. Each
// section poses one everyday question (copy column) next to the SAME iPhone
// the hero uses (PhoneShell), where the answer plays out scene by scene in real
// pictures of the app (lib/screen-captures.ts). One 200ms tick drives each
// phone's whole choreography, so pause/resume freezes frames, ticks and the
// pagination pill in lockstep (the ProblemSolved pattern, kept verbatim).

import { TEAL, FOREST, MUTED, EASE_EXPO, EASE_QUINT } from './problemTokens'

const TICK_MS = 200
const FRAME_FADE_S = 0.45

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

/** A region of a frame as a percentage box over that frame. */
function boxOf(region: Region, id: keyof typeof SCREENS) {
  const { width, height } = SCREENS[id]
  return {
    left: `${(region.x / width) * 100}%`,
    top: `${(region.y / height) * 100}%`,
    width: `${(region.w / width) * 100}%`,
    height: `${(region.h / height) * 100}%`,
  }
}

function RevealOver({ reveal, base, shown, reduced }: { reveal: Reveal; base: keyof typeof SCREENS; shown: boolean; reduced: boolean }) {
  const { width, height } = SCREENS[base]
  const { x, y, w, h } = reveal.region
  const clip = `inset(${(y / height) * 100}% ${((width - x - w) / width) * 100}% ${((height - y - h) / height) * 100}% ${(x / width) * 100}%)`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SCREENS[reveal.from].file}
      alt=""
      aria-hidden
      draggable={false}
      data-reveal={shown ? 'on' : 'off'}
      onError={() => console.error(`Altid Mad frame failed to load: ${SCREENS[reveal.from].file}`)}
      className="absolute inset-0 w-full h-full block"
      style={{ clipPath: clip, opacity: shown ? 1 : 0, transition: reduced ? 'none' : 'opacity 0.25s ease' }}
    />
  )
}

function PressOver({ press, base, t }: { press: Press; base: keyof typeof SCREENS; t: number }) {
  const on = t >= press.at && t < press.at + 400
  return (
    <span
      aria-hidden
      className="absolute block"
      style={{
        ...boxOf(press.region, base),
        borderRadius: 10,
        background: press.tone === 'on-dark' ? 'rgba(255,255,255,0.2)' : 'rgba(22,50,35,0.12)',
        opacity: on ? 1 : 0,
        transition: 'opacity 0.16s ease',
      }}
    />
  )
}

/**
 * What the phone shows: the beat's capture, with the frame before it under it while it
 * fades in. A frame goes up only once it has decoded; one that fails keeps the frame on
 * screen. Reveals and presses are a pure function of `t`, so pausing and scrubbing hold.
 */
function FrameStage({ beat, next, t, reduced }: { beat: Beat; next: Beat; t: number; reduced: boolean }) {
  const [up, setUp] = useState(beat)
  const [under, setUnder] = useState<Beat | null>(null)
  // A later beat on the same frame needs no decoding, and carries its own overlays.
  const shown = beat.frame === up.frame ? beat : up

  useEffect(() => {
    if (beat.frame === up.frame) return
    let live = true
    decodeFrame(beat.frame).then(
      () => {
        if (!live) return
        setUnder(reduced ? null : up)
        setUp(beat)
      },
      (err) => console.error(`Altid Mad frame failed: ${beat.frame}`, err),
    )
    return () => {
      live = false
    }
  }, [beat, up, reduced])

  // The next frame is ready before its turn, so the fade never waits for the network.
  useEffect(() => {
    if (next.frame === beat.frame) return
    decodeFrame(next.frame).catch((err) => console.error(`Altid Mad frame failed: ${next.frame}`, err))
  }, [next.frame, beat.frame])

  return (
    <>
      {under && (
        <div className="absolute inset-0" aria-hidden>
          <PhoneScreen id={under.frame} />
        </div>
      )}
      <motion.div
        key={shown.frame}
        className="absolute inset-0"
        initial={{ opacity: under ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: FRAME_FADE_S, ease: 'easeOut' }}
        onAnimationComplete={() => setUnder(null)}
      >
        <PhoneScreen id={shown.frame} alt={shown.alt}>
          {shown.reveals?.map((reveal) => (
            <RevealOver
              key={`${reveal.region.x},${reveal.region.y}`}
              reveal={reveal}
              base={shown.frame}
              shown={t >= reveal.at}
              reduced={reduced}
            />
          ))}
          {!reduced && shown.press && <PressOver press={shown.press} base={shown.frame} t={t} />}
        </PhoneScreen>
      </motion.div>
    </>
  )
}

/** The report's footnote, by the phone for as long as the frame states its figure. */
function ReportNote({ show }: { show: boolean }) {
  return (
    <p
      className="mt-3 text-center text-[12px] leading-snug"
      style={{ color: MUTED, maxWidth: 300, minHeight: 64, opacity: show ? 1 : 0, transition: 'opacity 0.35s ease', visibility: show ? 'visible' : 'hidden' }}
    >
      *En gennemsnitlig husstand på fire personer kan spare 11.207 kr. om året på dagligvarer med Altid Mad.{' '}
      <a href="/altid-mad-kvartalsrapport-q3.pdf" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>
        Læs Altid Mad-rapporten
      </a>
    </p>
  )
}

function beatAt(scene: FlowScene, t: number) {
  let found = scene.beats[0]
  for (const beat of scene.beats) if (t >= beat.at) found = beat
  return found
}

export interface FlowPhoneProps {
  scenes: FlowScene[]
  /** The scene shown at rest under reduced motion. */
  rest: string
}

function restTick(scenes: FlowScene[], rest: string) {
  let acc = 0
  for (const scene of scenes) {
    if (scene.key === rest) return Math.ceil((acc + scene.ms) / TICK_MS) - 1
    acc += scene.ms
  }
  throw new Error(`no scene called ${rest}`)
}

function FlowPhone({ scenes, rest }: FlowPhoneProps) {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(() => (reduced ? restTick(scenes, rest) : 0))
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  // Scrub-in-progress — the clock freezes so a held pointer can't drift the
  // playhead across a scene boundary (or into the opener) on its own.
  const [scrubbing, setScrubbing] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  // Play only while in view — paused off-screen (perf). Every entry into the
  // viewport RESTARTS the story from scene 1, so scrolling to a section
  // always shows the flow from its beginning rather than mid-loop.
  useEffect(() => {
    if (reduced) {
      setTick(restTick(scenes, rest))
      return
    }
    setTick(0)
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setPlaying(true)
      return
    }
    const io = new IntersectionObserver(([e]) => {
      setPlaying(e.isIntersecting)
      if (e.isIntersecting) setTick(0)
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, scenes, rest])

  useEffect(() => {
    const sync = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // The shared clock — stopping the interval IS the pause (and the scrub).
  useEffect(() => {
    if (reduced || !playing || paused || scrubbing || tabHidden) return
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [reduced, playing, paused, scrubbing, tabHidden])

  // Per-scene windows: each scene runs for its own `ms`.
  const durations = scenes.map((s) => s.ms)
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

  // Opener handling: the phone is closed (scaled into the centre) for the whole
  // opener scene; the moment the opener hands off to the first real scene it
  // opens (scales up from the icon) while the opener overlay fades out over it.
  // Behind the closed phone the first frame is already up.
  const isOpener = !reduced && !!scenes[index].opener
  const phoneOpen = !isOpener
  const scene = scenes[index]
  const beat = scene.opener ? scenes[0].beats[0] : beatAt(scene, t)
  const laterBeat = scene.beats.find((b) => b.at > t)
  const nextScene = scenes[(index + 1) % scenes.length]
  const next = laterBeat ?? (nextScene.opener ? scenes[0].beats[0] : nextScene.beats[0])
  const hasReportNote = scenes.some((s) => s.beats.some((b) => b.reportNote))

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
            'radial-gradient(closest-side, rgba(220,215,153,0.55) 0%, rgba(220,215,153,0.3) 55%, rgba(220,215,153,0) 100%)',
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
          transition={{ duration: reduced ? 0 : 0.55, ease: EASE_EXPO }}
        >
          <PhoneShell softShadow>
            <FrameStage beat={beat} next={next} t={scene.opener ? 0 : t} reduced={reduced} />
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
              <AppIconClose />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-7">
        <FlowTimeline
          scenes={scenes}
          durations={durations}
          starts={starts}
          elapsed={elapsed}
          paused={paused}
          canPause={!reduced}
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
      {hasReportNote && <ReportNote show={!scene.opener && !!beat.reportNote} />}
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
  canPause,
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
  canPause: boolean
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
          <div
            key={s.key}
            className="flex items-center justify-center"
            style={{ minWidth: 24, height: 24, cursor: active ? undefined : 'pointer' }}
            onClick={active ? undefined : () => onSeek(starts[i])}
          >
            <div
              ref={active ? barRef : undefined}
              role={active ? 'slider' : 'button'}
              tabIndex={hidden ? -1 : 0}
              aria-label={active ? `${s.label}, træk eller brug piletasterne for at spole` : `Gå til ${s.label}`}
              aria-valuemin={active ? 0 : undefined}
              aria-valuemax={active ? Math.round(durations[i] / 1000) : undefined}
              aria-valuenow={active ? Math.round(sceneT / 1000) : undefined}
              aria-valuetext={active ? `${Math.round(sceneT / 1000)} af ${Math.round(durations[i] / 1000)} sekunder` : undefined}
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

      {/* Pause/play toggle, same control as the site's other carousels. Under
          reduced motion nothing plays, so the dots are all there is. */}
      {canPause && <button
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
      </button>}
    </motion.div>
  )
}

// ── The section ─────────────────────────────────────────────────────────────

export interface QuestionSectionProps {
  question: string
  answer: string
  /** Optional small line above the heading — omitted, no eyebrow renders. */
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
  kicker,
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
            {kicker && <p className={EYEBROW} style={{ color: TEAL }}>{kicker}</p>}
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
        {/* Copy — pushed toward the outer edge like the founder section.
            Below lg both sections share the same 24px margin (the mirror
            section's) and the text spans the full width, like the Trust
            boxes; the fluid desktop indents apply from lg up. */}
        <div
          className={
            mirror
              ? 'flex flex-col px-6 sm:px-10 lg:pl-0 lg:order-2 lg:pr-[clamp(1.5rem,7.292vw,8.75rem)]'
              : 'flex flex-col px-6 sm:px-10 lg:pr-0 lg:pl-[clamp(2rem,12.500vw,15rem)]'
          }
        >
          {kicker && <motion.p className={EYEBROW} style={{ color: TEAL }} {...rise(0)}>{kicker}</motion.p>}
          <motion.h2 className={`${H2} ${kicker ? 'mt-5' : ''} lg:[text-wrap:balance] lg:max-w-[560px]`} style={{ color: FOREST }} {...rise(0.1)}>
            {question}
          </motion.h2>
          <motion.p className={`${BODY} mt-6 lg:text-pretty lg:max-w-[560px]`} style={{ color: MUTED }} {...rise(0.2)}>
            {answer}
          </motion.p>
          <div ref={chipsRef} className="mt-8 max-lg:hidden flex flex-wrap gap-3">
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
