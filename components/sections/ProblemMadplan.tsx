'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useSpring, useTransform, useVelocity } from 'framer-motion'
import QuestionSection, {
  ACCENT, APP_ICON_MS, EASE_EXPO, EASE_QUINT, FOREST, HAIRLINE, MINT, MUTED, SAVE_TEAL, TEAL,
  AppIconClose, MintCta, PopCheck, SceneHeader, Thumb, type FlowScene,
} from './problemShared'

// Section 1 of the pair: "Hvad skal vi have til aftensmad?". The phone plays
// the madplan onboarding flow from the UI-animation storyboard: preferences →
// family & budget → the app builds the plan → the finished week.

const SCENE_MS = 5000

// ── Scene 1 · Præferencer ───────────────────────────────────────────────────

// The full tag cloud, 1:1 with Thor's Figma frame (272:297) — the exact
// seven rows from the frame, every pill visible, no fade, no clipping;
// "Vis flere" is plain text below. Rows are explicit so the layout can
// never wrap into more lines than the design.
const PREF_ROWS: { label: string; at: number | null }[][] = [
  [{ label: 'Børnevenligt', at: 400 }, { label: 'Hurtige retter', at: 800 }],
  [{ label: 'Vegetarisk', at: null }, { label: 'Proteinrig', at: null }, { label: 'Mindre kød', at: 1200 }],
  [{ label: 'Kalorielet', at: null }, { label: 'Undgå madspild', at: 1600 }, { label: 'Vegansk', at: null }],
  [{ label: 'Brug rester', at: null }, { label: 'Fisk og skaldyr', at: null }, { label: 'Varieret', at: null }],
  [{ label: 'Frugt og grønt', at: null }, { label: 'Billige måltider', at: null }, { label: 'Fuldkorn', at: null }],
  [{ label: 'Økologisk', at: null }, { label: 'Laktosefri', at: null }, { label: 'Middelhavskost', at: null }],
]

/** Chip matching the Figma pills: centred label, mint fill on pick with the
 *  check sitting inline after the label. */
function PrefPill({ label, picked }: { label: string; picked: boolean }) {
  return (
    <motion.span
      className="inline-flex items-center justify-center gap-1 rounded-full px-2 font-semibold whitespace-nowrap"
      style={{
        height: 30,
        fontSize: 9,
        background: picked ? MINT : '#fff',
        color: picked ? FOREST : MUTED,
        border: `1px solid ${picked ? 'transparent' : HAIRLINE}`,
      }}
      animate={{ scale: picked ? [1, 1.06, 1] : 1 }}
      transition={{ duration: 0.32, ease: EASE_QUINT }}
    >
      {label}
      <PopCheck show={picked} size={12} />
    </motion.span>
  )
}

/** Explicit pill rows — one flex row per array, so the layout never wraps into
 *  more lines than the design (same technique as slide 1). */
function PillRows({ rows, t }: { rows: { label: string; at: number | null }[][]; t: number }) {
  return (
    <div className="flex flex-col gap-1.5" style={{ margin: '0 -6px' }}>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          {row.map((c) => (
            <PrefPill key={c.label} label={c.label} picked={c.at !== null && t >= c.at} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Plain-text "Vis flere ⌄" — no pill, matching the Figma frames. */
function VisFlereText({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-1 text-center font-semibold ${className}`} style={{ fontSize: 9.5, color: FOREST }}>
      Vis flere
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke={FOREST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </p>
  )
}

function PrefsScene({ t }: { t: number }) {
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Hvad passer til jer?" sub="Vælg alt det, der passer" />
      <div className="flex flex-col gap-1.5" style={{ margin: '0 -6px' }}>
        {PREF_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            {row.map((c) => (
              <PrefPill key={c.label} label={c.label} picked={c.at !== null && t >= c.at} />
            ))}
          </div>
        ))}
      </div>
      <VisFlereText className="mt-2.5" />
      <div className="mt-auto pb-1">
        {/* Active once "Undgå madspild" (1600ms) is picked — the same quiet
            colour-only activation as before, just on the faster pick tempo —
            and a quick click near the end of the scene. The hidden
            GoBack is a spacer — the first scene has nothing to go back to,
            but its button must sit at the same height as the later scenes,
            which all show "Gå tilbage" below theirs. */}
        <MintCta label="Videre" active={t >= 1600} pressing={t >= 3000} pop={false} />
        <div style={{ visibility: 'hidden' }} aria-hidden><GoBack /></div>
      </div>
    </div>
  )
}

// ── Scene 2 · Hvem spiser med? ──────────────────────────────────────────────

// The household icons from the Altid Hjem forsikring-mockup (PersonIcon).
function AdultIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" fill={TEAL} />
      <path d="M3.5 20.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7Z" fill={TEAL} />
    </svg>
  )
}

function ChildIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.1" fill={TEAL} />
      <path d="M6.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2Z" fill={TEAL} />
    </svg>
  )
}

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke={TEAL} strokeWidth="2" />
      <path d="M3.5 10h17" stroke={TEAL} strokeWidth="2" />
      <path d="M8 2.5v4M16 2.5v4" stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Stepper counting up from its base — the number pops and the plus button
 *  gets a visible "press" on every increment. `base` is the resting start
 *  value, so a row that begins at 5 doesn't pop on mount. */
function StepperRow({ label, icon, value, base = 0 }: { label: string; icon: ReactNode; value: number; base?: number }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl bg-white px-3"
      style={{ height: 42, border: `1px solid ${HAIRLINE}` }}
    >
      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: FOREST }}>
        <span className="flex items-center justify-center shrink-0" style={{ width: 16 }}>{icon}</span>
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: 18, height: 18, border: `1px solid ${HAIRLINE}`, color: MUTED, fontSize: 11 }}
        >
          −
        </span>
        <motion.span
          key={value}
          className="text-[12px] font-bold tabular-nums text-center"
          style={{ color: value > 0 ? TEAL : MUTED, minWidth: 13 }}
          initial={{ scale: value > base ? 1.35 : 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_QUINT }}
        >
          {value}
        </motion.span>
        <motion.span
          key={`plus-${value}`}
          className="flex items-center justify-center rounded-full"
          style={{ width: 18, height: 18, background: MINT, color: FOREST, fontSize: 11 }}
          initial={{ scale: value > base ? 0.72 : 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: EASE_QUINT }}
        >
          +
        </motion.span>
      </span>
    </div>
  )
}

/** How many increment moments in `steps` have passed at time t. */
function countAt(t: number, steps: number[]) {
  return steps.filter((at) => t >= at).length
}

/** Quick tap-tap-tap increments: `n` presses, one every `gap` ms. */
function taps(from: number, n: number, gap = 160) {
  return Array.from({ length: n }, (_, i) => from + i * gap)
}

function GoBack() {
  return (
    <p className="mt-1.5 text-center font-medium" style={{ fontSize: 9, color: MUTED }}>
      ← Gå tilbage
    </p>
  )
}

/** The mint savings-claim card — shared by the family scene and the budget
 *  slider scene. The tag is the discount icon from the indkøb phone's
 *  "Du sparer" notes. */
function SavingsClaim() {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(191,230,224,0.45)' }}>
      <p className="flex items-start justify-between gap-1.5 font-bold leading-snug" style={{ fontSize: 11, color: TEAL }}>
        <span>Spar op til 1.250 kr./måned på madbudgettet.*</span>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0" style={{ marginTop: 1 }}>
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42z" fill={TEAL} />
          <circle cx="6" cy="6" r="1.5" fill="#fff" />
        </svg>
      </p>
      <p className="mt-1 leading-relaxed" style={{ fontSize: 7.5, color: MUTED }}>
        *En gennemsnitlig husstand på 4 personer kan spare op til 1.250 kr./måned på familiens indkøb med
        Altid Mad. Kilde: Altid Mad Q2-rapporten.
      </p>
    </div>
  )
}

// ── Scene 2 · Hvem spiser med? (steppers) ───────────────────────────────────

// Scene 2 timeline: the steppers fill in one after another — two adults, two
// kids, then the days count 5 → 7 in two quick presses.
const ADULT_TAPS = taps(400, 2, 280)
const KID_TAPS = taps(1100, 2, 280)
const DAY_TAPS = taps(1800, 2, 280)

function FamilyScene({ t }: { t: number }) {
  const adults = countAt(t, ADULT_TAPS)
  const kids = countAt(t, KID_TAPS)
  const days = 5 + countAt(t, DAY_TAPS) // starts at 5; two presses land on 7
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Hvem spiser med?" sub="Vælg, hvor mange madplanen laves til" />
      <div className="flex flex-col gap-1.5">
        <StepperRow label="Antal voksne" icon={<AdultIcon />} value={adults} />
        <StepperRow label="Antal børn" icon={<ChildIcon />} value={kids} />
        <StepperRow label="Dage i madplanen" icon={<CalendarIcon />} value={days} base={5} />
        <p className="text-[9.5px]" style={{ color: MUTED }}>Portioner beregnes automatisk</p>
      </div>
      <div className="mt-auto pb-1">
        <MintCta label="Videre" active={t >= 2300} pressing={t >= 2700} pop={false} />
        <GoBack />
      </div>
    </div>
  )
}

// ── Scene 3 · Særlige hensyn ────────────────────────────────────────────────

// Explicit rows, 1:1 with Thor's Figma frame (274:296) — every pill visible,
// no fade, plain-text "Vis flere" below each group.
const ALLERGY_ROWS: { label: string; at: number | null }[][] = [
  [{ label: 'Gluten', at: null }, { label: 'Mælk & laktose', at: null }, { label: 'Nødder', at: 700 }],
  [{ label: 'Æg', at: null }, { label: 'Fisk', at: null }, { label: 'Jordnødder', at: null }, { label: 'Skaldyr', at: null }],
]

const NO_THANKS_ROWS: { label: string; at: number | null }[][] = [
  [{ label: 'E-numre', at: 1300 }, { label: 'Palmeolie', at: null }, { label: 'Buræg', at: null }],
  [{ label: 'Forarbejdet mad', at: null }, { label: 'Højt CO2-aftryk', at: 1900 }],
]

function HensynScene({ t }: { t: number }) {
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Skal vi tage særlige hensyn?" sub="Vi tilpasser alle retter og varer" />
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Allergier</p>
      <PillRows rows={ALLERGY_ROWS} t={t} />
      <VisFlereText className="mt-2" />
      <p className="mt-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Nej tak til</p>
      <PillRows rows={NO_THANKS_ROWS} t={t} />
      <VisFlereText className="mt-2" />
      <div className="mt-auto pb-1">
        <MintCta label="Videre" />
        <GoBack />
      </div>
    </div>
  )
}

// ── Scene 5 · Budget som slider ─────────────────────────────────────────────

// Same step as the budget scene, but as a slider in two beats: the thumb
// sweeps 0 → 5.000 kr/md and gets a Bekræft — then Altid Mad takes over,
// nudges it down to 4.750 (a ghost marker keeps the original spot), the
// numbers flip to Hjem lime, and the full savings card lands below.
const SLIDER_MS = 11400
const SLIDER_MAX = 6000
const SLIDER_CHOICE = 5000
const SLIDER_OPTIMIZED = 3750 // 5.000 − 1.250, matching the savings card
const SLIDE_UP: [number, number] = [600, 2600] // 0 → 5.000
const CONFIRM_ACTIVE = 3200
const CONFIRM_PRESS = 4400 // Bekræft rests a beat after the count-up, THEN clicks
const REDUCE: [number, number] = [5200, 6600] // Altid Mad: 5.000 → 3.750
const SAVE_CARD = 7200 // the claim card lands below
const PLAN_CTA = 8400 // Sammensæt vores madplan waits a beat, then appears

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const phase = (t: number, [a, b]: [number, number]) => Math.min(1, Math.max(0, (t - a) / (b - a)))

function sliderAmount(t: number) {
  if (t < SLIDE_UP[0]) return 0
  if (t < SLIDE_UP[1]) return SLIDER_CHOICE * easeInOutCubic(phase(t, SLIDE_UP))
  if (t < REDUCE[0]) return SLIDER_CHOICE
  if (t < REDUCE[1]) return SLIDER_CHOICE - (SLIDER_CHOICE - SLIDER_OPTIMIZED) * easeOutCubic(phase(t, REDUCE))
  return SLIDER_OPTIMIZED
}

/** 4000 → "4.000" — deterministic, no locale dependency. */
function fmtKr(n: number) {
  const s = String(Math.round(n))
  return s.length > 3 ? `${s.slice(0, -3)}.${s.slice(-3)}` : s
}

function BudgetSliderScene({ t }: { t: number }) {
  const raw = sliderAmount(t)
  const ghostPct = (SLIDER_CHOICE / SLIDER_MAX) * 100
  const reducing = t >= REDUCE[0] // Altid Mad is taking over
  const reduced = t >= REDUCE[1] // ...and has cut the price

  // One spring drives the whole slider — fill, saved span and thumb glide to
  // each tick's target, so the drag reads as realtime motion.
  const pctSpring = useSpring(0, { stiffness: 110, damping: 28 })
  useEffect(() => {
    pctSpring.set((raw / SLIDER_MAX) * 100)
  }, [pctSpring, raw])
  const fillWidth = useTransform(pctSpring, (v) => `${v}%`)
  const thumbLeft = useTransform(pctSpring, (v) => `calc(${v}% - 9px)`)
  const spanLeft = useTransform(pctSpring, (v) => `${Math.min(v, ghostPct)}%`)
  const spanWidth = useTransform(pctSpring, (v) => `${Math.max(0, ghostPct - v)}%`)
  // The thumb lifts while it travels and settles when it stops — the tactile
  // cue that a finger is dragging it.
  const pctVelocity = useVelocity(pctSpring)
  const thumbScale = useSpring(useTransform(pctVelocity, (v): number => (Math.abs(v) > 3 ? 1.22 : 1)), {
    stiffness: 280,
    damping: 22,
  })
  // Every figure derives from the SAME spring as the slider, so the numbers
  // and the thumb always move at exactly the same speed.
  const monthlyText = useTransform(pctSpring, (v) => `${fmtKr(Math.round(((v / 100) * SLIDER_MAX) / 50) * 50)} kr./md`)
  const weeklyText = useTransform(pctSpring, (v) => `${fmtKr(Math.round(((v / 100) * SLIDER_MAX) / 4))} kr. om ugen`)
  const savingText = useTransform(
    pctSpring,
    (v) => `+${fmtKr(Math.max(0, Math.round((SLIDER_CHOICE - (v / 100) * SLIDER_MAX) / 50) * 50))} kr./md`,
  )
  return (
    <div className="flex h-full flex-col">
      {/* Header swap is choreographed like a scene change (out up, in from
          below) inside a fixed-height box, so the slider never shifts. */}
      <div className="relative mb-2.5" style={{ height: 36 }}>
        <AnimatePresence initial={false}>
          {!reducing && (
            <motion.div
              key="before"
              className="absolute inset-x-0 top-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE_QUINT } }}
              transition={{ duration: 0.45, ease: EASE_EXPO }}
            >
              <p className="text-[14.5px] font-semibold leading-tight" style={{ color: FOREST }}>Hvad er jeres madbudget?</p>
              <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Træk for at vælge beløb pr. måned</p>
            </motion.div>
          )}
          {reducing && (
            <motion.div
              key="after"
              className="absolute inset-x-0 top-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE_QUINT } }}
              transition={{ duration: 0.45, ease: EASE_EXPO }}
            >
              <p className="text-[14.5px] font-semibold leading-tight" style={{ color: FOREST }}>Her er jeres nye madbudget</p>
              <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Samme varer. Samme kvalitet. Bare billigere</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pt-1">
        {/* Readout: the amount stays big; the struck originals sit UNDER their
            new prices, with the space reserved from the start so the block
            never hops when they fade in. */}
        <div className="text-center">
          {/* The struck originals hang to the LEFT of each new price, outside
              the layout flow — the new numbers stay optically centered and
              nothing shifts when the strikes fade in. */}
          <p className="font-bold tabular-nums" style={{ fontSize: 16, color: TEAL }}>
            <span className="relative inline-block">
              <motion.span>{monthlyText}</motion.span>
              <span
                className="absolute whitespace-nowrap font-semibold"
                style={{
                  right: '100%',
                  marginRight: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 7,
                  color: MUTED,
                  textDecoration: 'line-through',
                  opacity: reduced ? 1 : 0,
                  transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {fmtKr(SLIDER_CHOICE)} kr./md
              </span>
            </span>
          </p>
          <p className="mt-0.5 font-medium tabular-nums" style={{ fontSize: 8, color: MUTED }}>
            <span className="relative inline-block">
              <motion.span>{weeklyText}</motion.span>
              <span
                className="absolute whitespace-nowrap"
                style={{
                  right: '100%',
                  marginRight: 5,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 7,
                  textDecoration: 'line-through',
                  opacity: reduced ? 1 : 0,
                  transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {fmtKr(SLIDER_CHOICE / 4)} kr.
              </span>
            </span>
          </p>
        </div>
        {/* The slider — spring-driven, so it moves continuously. */}
        <div className="relative mt-2" style={{ height: 18 }}>
          <span className="absolute rounded-full" style={{ left: 0, right: 0, top: 6.5, height: 5, background: 'rgba(15,110,104,0.12)' }} />
          <motion.span
            className="absolute rounded-full"
            style={{ left: 0, top: 6.5, height: 5, width: fillWidth, background: TEAL }}
          />
          {/* The saved span — from the new price back to the original choice. */}
          {reducing && (
            <motion.span
              className="absolute rounded-full"
              style={{ left: spanLeft, width: spanWidth, top: 6.5, height: 5, background: SAVE_TEAL }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE_EXPO }}
            />
          )}
          {/* Ghost thumb — where the slider sat before Altid Mad took over.
              It pops out of the live thumb as that one departs. */}
          {reducing && (
            <motion.span
              className="absolute rounded-full bg-white"
              style={{
                left: `calc(${ghostPct}% - 9px)`,
                top: 0,
                width: 18,
                height: 18,
                border: `1.5px solid ${SAVE_TEAL}`,
                boxShadow: '0 2px 6px rgba(22,50,35,0.18)',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_QUINT }}
            />
          )}
          <motion.span
            className="absolute rounded-full bg-white"
            style={{
              left: thumbLeft,
              scale: thumbScale,
              top: 0,
              width: 18,
              height: 18,
              border: `1.5px solid ${TEAL}`,
              boxShadow: '0 2px 6px rgba(22,50,35,0.18)',
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="font-medium" style={{ fontSize: 7.5, color: MUTED }}>0 kr</span>
          <span className="font-medium" style={{ fontSize: 7.5, color: MUTED }}>6.000 kr</span>
        </div>
        {/* The saving counts up in LOCKSTEP with the slider going back — it
            mounts the moment Altid Mad takes over; the claim card follows. */}
        <AnimatePresence initial={false}>
          {reducing && (
            <motion.div
              key="saving"
              className="overflow-hidden text-center"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
            >
              <p className="mt-2 font-bold tabular-nums" style={{ fontSize: 17, color: SAVE_TEAL }}>
                <motion.span>{savingText}</motion.span>
              </p>
              <p className="mt-0.5 leading-relaxed" style={{ fontSize: 7.5, color: MUTED }}>
                i forventet besparelse
              </p>
            </motion.div>
          )}
          {t >= SAVE_CARD && (
            <motion.div
              key="claim"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.45, ease: EASE_EXPO }}
            >
              <div className="mt-2 text-left">
                <SavingsClaim />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Bekræft (+ Gå tilbage) leaves entirely once pressed; the plan CTA
          arrives on its own after Altid Mad has optimised the budget. */}
      <AnimatePresence initial={false}>
        {t < CONFIRM_PRESS + 300 && (
          <motion.div
            key="bekraeft"
            className="mt-auto pb-1"
            initial={false}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.28, ease: EASE_QUINT } }}
          >
            {/* One click: the dip starts and the block exits before the CTA
                can re-pop into its active state. */}
            <MintCta label="Bekræft" active={t >= CONFIRM_ACTIVE} pressing={t >= CONFIRM_PRESS} pop={false} />
            <GoBack />
          </motion.div>
        )}
        {t >= PLAN_CTA && (
          <motion.div
            key="plan"
            className="mt-auto pb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_EXPO }}
          >
            <MintCta label="Sammensæt vores madplan" pressing={t >= SLIDER_MS - 500} />
            <GoBack />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Scene 6 · Appen bygger planen ───────────────────────────────────────────

const BUILD_STEPS = [
  { label: 'Finder retter, der passer til jer', at: 400 },
  { label: 'Tjekker ugens tilbud', at: 1100 },
  { label: 'Tilpasser portioner', at: 1800 },
]

// The loader ring — 100px, shared size with the indkøb phone's planning
// loader so the two mockups read as one system.
const RING_SIZE = 100
const RING_SW = 9
const RING_R = (RING_SIZE - RING_SW) / 2
const RING_C = 2 * Math.PI * RING_R
const RING_MID = RING_SIZE / 2

function BuildStepRow({ label, done, shown, bold = false }: { label: string; done: boolean; shown: boolean; bold?: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-2.5"
      initial={false}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 8 }}
      transition={{ duration: 0.4, ease: EASE_EXPO }}
    >
      <span className="relative flex items-center justify-center shrink-0" style={{ width: 20, height: 20 }}>
        {/* Pending: hairline ring. Done: solid teal check, full colour. */}
        {!done && <span className="absolute inset-0 rounded-full" style={{ border: `1.5px solid ${HAIRLINE}`, background: '#fff' }} />}
        <PopCheck show={done} size={20} />
      </span>
      <span className="text-[12px]" style={{ color: bold ? TEAL : done ? FOREST : MUTED, fontWeight: bold || done ? 600 : 500 }}>
        {label}
      </span>
    </motion.div>
  )
}

function BuildScene({ t }: { t: number }) {
  // Ring progress derives from the tick clock, so pausing freezes it too.
  const progress = Math.min(1, Math.max(0, (t - 300) / 2600))
  return (
    <div className="flex h-full flex-col items-center justify-center gap-9 pb-4">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
          <circle cx={RING_MID} cy={RING_MID} r={RING_R} fill="none" stroke="rgba(191,230,224,0.55)" strokeWidth={RING_SW} />
          <circle
            cx={RING_MID}
            cy={RING_MID}
            r={RING_R}
            fill="none"
            stroke={TEAL}
            strokeWidth={RING_SW}
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress)}
            transform={`rotate(-90 ${RING_MID} ${RING_MID})`}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
      </div>
      <div className="flex w-full flex-col gap-4 pl-2">
        {BUILD_STEPS.map((s) => (
          <BuildStepRow key={s.label} label={s.label} shown={t >= s.at} done={t >= s.at + 800} />
        ))}
        <BuildStepRow label="Madplan klar" shown={t >= 2800} done={t >= 3000} bold />
      </div>
    </div>
  )
}

// ── Scene 4 · Ugens madplan ─────────────────────────────────────────────────

// ── Scene 5 + 7 · Ugens madplan (overview → godkendt) ───────────────────────

// Meal tags echo what was picked in scene 1 (Børnevenligt, Hurtige retter,
// Mindre kød, Undgå madspild) — the choices visibly shaped the plan.
const PLAN = [
  { day: 'Man', img: '/food/kylling-karry.jpg', dish: 'Kylling i karry', tag: 'Børnevenlig', accent: ACCENT.brand },
  { day: 'Tir', img: '/food/pasta-groent.jpg', dish: 'Pasta med grønt', tag: 'Hurtig ret', accent: ACCENT.blue },
  { day: 'Ons', img: '/food/lasagne.jpg', dish: 'Vegetarlasagne', tag: 'Mindre kød', accent: ACCENT.brand },
  { day: 'Tor', img: '/food/laksewok.jpg', dish: 'Laksewok', tag: 'Hurtig ret', accent: ACCENT.blue },
  { day: 'Fre', img: '/food/pizzafredag.jpg', dish: 'Pizzafredag', tag: 'Børnevenlig', accent: ACCENT.brand },
  { day: 'Lør', img: '/food/tacos.jpg', dish: 'Tacos', tag: 'Børnevenlig', accent: ACCENT.brand },
  { day: 'Søn', img: '/food/chili-con-carne.jpg', dish: 'Chiligryde', tag: 'Undgå madspild', accent: ACCENT.amber },
]

// After the swipe rejects Laksewok, Thursday becomes the leftovers-friendly
// alternative — so the approved plan reflects the choice.
const TOR_ALT = { day: 'Tor', img: '/food/lasagne.jpg', dish: 'Grøntsagsgratin', tag: 'Undgå madspild', accent: ACCENT.amber }

function PlanCard({ anim, swapped = false }: { anim: boolean; swapped?: boolean }) {
  const rows = swapped ? PLAN.map((m) => (m.day === 'Tor' ? TOR_ALT : m)) : PLAN
  return (
    <div className="rounded-xl bg-white px-2.5 py-2" style={{ border: `1px solid ${HAIRLINE}` }}>
      <div className="flex flex-col gap-1.5">
        {rows.map((m, i) => (
          <motion.div
            key={m.day}
            className="flex items-center gap-1.5"
            initial={anim ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE_QUINT, delay: 0.15 + i * 0.08 }}
          >
            <span
              className="shrink-0 flex items-center justify-center font-bold"
              style={{ width: 28, height: 22, borderRadius: 7, fontSize: 8.5, background: 'rgba(191,230,224,0.5)', color: TEAL }}
            >
              {m.day}
            </span>
            <Thumb src={m.img} size={22} />
            <span className="flex-1 min-w-0 truncate font-semibold" style={{ fontSize: 10, color: FOREST }}>{m.dish}</span>
            <span
              className="shrink-0 rounded px-1 py-0.5 font-bold leading-none"
              style={{ fontSize: 7, background: m.accent.wash, color: m.accent.ink }}
            >
              {m.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Scene 5 — the overview: plan + Tilpas (opens the swipe) and Godkend. The
// Tilpas button gets a quick press near the end to signal opening the swipe.
function PlanOverviewScene({ t }: { t: number }) {
  const pressing = t >= 3700 && t < 4100
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Din madplan for ugen" sub="Tilpasset 2 voksne og 2 børn" />
      <PlanCard anim />
      <div className="mt-auto pb-1">
        <div className="flex gap-1.5">
          <motion.div
            className="flex flex-1 items-center justify-center rounded-2xl bg-white font-semibold"
            style={{ height: 38, fontSize: 11, color: FOREST, border: `1px solid ${HAIRLINE}` }}
            initial={false}
            animate={{ scale: pressing ? [1, 0.93, 1] : 1 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
          >
            Tilpas
          </motion.div>
          <div className="flex-[1.7]">
            <MintCta label="Godkend madplan" />
          </div>
        </div>
        <GoBack />
      </div>
    </div>
  )
}

// Scene 7 — approved: plan + "Madplan godkendt" and the bottom action buttons.
// "Tilføj til indkøbsliste" gets a press near the end so the hand-off to the
// app-icon closer reads as caused by it. Last live scene; the flow loops after.
function PlanGodkendtScene({ t, anim = true }: { t?: number; anim?: boolean }) {
  const pressing = t !== undefined && t >= 3400 && t < 3800
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Din madplan for ugen" sub="Tilpasset 2 voksne og 2 børn" />
      <PlanCard anim={anim} swapped />
      <motion.div
        className="mt-2 flex items-center justify-center gap-1"
        initial={anim ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE_EXPO }}
      >
        <PopCheck show size={12} />
        <span className="font-semibold" style={{ fontSize: 9.5, color: TEAL }}>Madplan godkendt</span>
      </motion.div>
      <div className="mt-auto pb-1">
        <motion.div
          initial={anim ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_EXPO, delay: 0.15 }}
        >
          <MintCta label="Tilføj til indkøbsliste" pressing={pressing} pop={false} />
        </motion.div>
        <motion.div
          className="mt-1.5 flex items-center justify-center gap-1.5 rounded-2xl bg-white font-semibold"
          style={{ height: 30, fontSize: 9.5, color: FOREST, border: `1px solid ${HAIRLINE}` }}
          initial={anim ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_EXPO, delay: 0.3 }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 3h2l1.6 8h7.2l1.4-6H5" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6.5" cy="13.5" r="1" fill={TEAL} />
            <circle cx="12" cy="13.5" r="1" fill={TEAL} />
          </svg>
          Bestil via nemlig.com
        </motion.div>
      </div>
    </div>
  )
}

// ── Scene 6 · Tilpas retterne (Tinder swipe) ────────────────────────────────

function ClockIcon({ size = 10, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.4" />
      <path d="M12 7.5V12l3 2" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// The dishes swiped through one at a time. Most are kept (dir 1 → fly right,
// ✓ pulses); Laksewok gets a NO (dir -1 → fly left, ✕ pulses) and is replaced
// by a leftovers-friendly alternative that carries a disclaimer banner. The
// stack behind shrinks so you can see how far through the week you are.
const SWIPES = [
  {
    img: '/food/kylling-karry.jpg', name: 'Kylling i karry', day: 'Mandag', time: '25 min',
    tag: 'Børnevenlig', accent: ACCENT.brand, dir: 1,
    desc: 'Cremet karrysauce med ris og friske grøntsager – familiens favorit.',
  },
  {
    img: '/food/pasta-groent.jpg', name: 'Pasta med grønt', day: 'Tirsdag', time: '20 min',
    tag: 'Hurtig ret', accent: ACCENT.blue, dir: 1,
    desc: 'Fuldkornspasta med sæsonens grøntsager i en let flødesauce.',
  },
  {
    img: '/food/lasagne.jpg', name: 'Vegetarlasagne', day: 'Onsdag', time: '45 min',
    tag: 'Mindre kød', accent: ACCENT.brand, dir: 1,
    desc: 'Lagvis lasagne med grøntsager, tomat og ost – helt uden kød.',
  },
  {
    img: '/food/laksewok.jpg', name: 'Laksewok', day: 'Torsdag', time: '20 min',
    tag: 'Hurtig ret', accent: ACCENT.blue, dir: -1,
    desc: 'Sprød laks og grøntsager i wok med nudler og soja. Hurtig og proteinrig.',
  },
  {
    img: '/food/lasagne.jpg', name: 'Grøntsagsgratin', day: 'Torsdag', time: '30 min',
    tag: 'Undgå madspild', accent: ACCENT.amber, dir: 1,
    disclaimer: 'Måske foretrækker I denne i stedet – den bruger rester fra i går, så I undgår madspild.',
    desc: 'Cremet gratin med gårsdagens grøntsager og ost. Intet går til spilde.',
  },
  {
    img: '/food/pizzafredag.jpg', name: 'Pizzafredag', day: 'Fredag', time: '30 min',
    tag: 'Børnevenlig', accent: ACCENT.brand, dir: 1,
    desc: 'Hjemmelavet pizza med jeres egne favoritter – ugens højdepunkt.',
  },
  {
    img: '/food/tacos.jpg', name: 'Tacos', day: 'Lørdag', time: '30 min',
    tag: 'Børnevenlig', accent: ACCENT.brand, dir: 1,
    desc: 'Bløde tacos med fyld til at samle selv. Børnene bygger deres egne.',
  },
  {
    img: '/food/chili-con-carne.jpg', name: 'Chiligryde', day: 'Søndag', time: '40 min',
    tag: 'Undgå madspild', accent: ACCENT.amber, dir: 1,
    desc: 'Krydret gryde med bønner og grøntsager – bruger ugens rester.',
  },
]

// Per-card dwell: ~640ms each, but the leftovers alternative (Grøntsagsgratin,
// index 4) lingers 3s so you can read it, then the swipe resumes normal speed.
// 600 = tick-aligned (200ms grid): 560 starved card 5 down to 400ms on screen.
const SWIPE_DURS = SWIPES.map((_, i) => (i === 4 ? 3000 : 600))
const SWIPE_STARTS = SWIPE_DURS.map((_, i) => SWIPE_DURS.slice(0, i).reduce((s, d) => s + d, 0))
const SWIPE_TOTAL = SWIPE_DURS.reduce((s, d) => s + d, 0)
const CARD_W = 212
const CARD_H = 234

function DishCard({ dish }: { dish: (typeof SWIPES)[number] }) {
  return (
    <>
      {/* Photo with the day spelled out. */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dish.img} alt="" loading="lazy" decoding="async" className="w-full object-cover" style={{ height: 138 }} />
        {'disclaimer' in dish && dish.disclaimer && (
          <div
            className="absolute inset-x-0 top-0 flex items-start gap-1.5 px-2.5 py-2"
            style={{ background: 'rgba(22,50,35,0.85)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 0.5 }}>
              <path d="M12 3a9 9 0 1 0 6.4 2.6M18.5 2.5V6h-3.5" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 7.5, lineHeight: 1.35, color: '#fdfaf4', fontWeight: 500 }}>{dish.disclaimer}</span>
          </div>
        )}
        <span
          className="absolute rounded-full px-2 py-1 font-semibold"
          style={{ right: 8, bottom: 8, fontSize: 9, background: 'rgba(253,250,244,0.92)', color: FOREST }}
        >
          {dish.day}
        </span>
      </div>
      {/* Dish detail. */}
      <div className="px-3 py-2.5">
        <p className="truncate font-semibold" style={{ fontSize: 12.5, color: FOREST }}>{dish.name}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-bold"
            style={{ fontSize: 8, background: 'rgba(15,110,104,0.08)', color: TEAL }}
          >
            <ClockIcon size={9} /> {dish.time}
          </span>
          <span className="rounded-full px-1.5 py-0.5 font-bold" style={{ fontSize: 8, background: dish.accent.wash, color: dish.accent.ink }}>
            {dish.tag}
          </span>
        </div>
        <p className="mt-2 leading-relaxed" style={{ fontSize: 9, color: MUTED }}>{dish.desc}</p>
      </div>
    </>
  )
}

function SwipeScene({ t }: { t: number }) {
  let idx = 0
  for (let i = 0; i < SWIPE_STARTS.length; i++) if (t >= SWIPE_STARTS[i]) idx = i
  const dish = SWIPES[idx]
  const remaining = SWIPES.length - 1 - idx // cards still behind the top one
  // The card just swiped decides which action button pulses (✕ for a no).
  const justSwiped = idx > 0 ? SWIPES[idx - 1] : null
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Vælg ugens retter" sub="Swipe jer igennem – ja tak eller nej tak" />

      {/* The card — one dish at a time, flying off to the right when kept.
          A shrinking stack sits behind it (peeking at the bottom + sides) to
          show progress through the week. */}
      <div className="relative flex-1 min-h-0 pt-1">
        {[2, 1].map((k) =>
          remaining >= k ? (
            <div
              key={k}
              className="absolute rounded-2xl bg-white"
              style={{
                left: '50%',
                marginLeft: -(CARD_W - k * 16) / 2,
                top: k * 8,
                width: CARD_W - k * 16,
                height: CARD_H,
                border: `1px solid ${HAIRLINE}`,
                boxShadow: '0 8px 18px -12px rgba(22,50,35,0.2)',
              }}
            />
          ) : null,
        )}
        <AnimatePresence>
          <motion.div
            key={dish.name}
            className="absolute overflow-hidden rounded-2xl bg-white"
            style={{
              left: '50%',
              marginLeft: -CARD_W / 2,
              top: 0,
              width: CARD_W,
              height: CARD_H,
              border: `1px solid ${HAIRLINE}`,
              boxShadow: '0 12px 26px -12px rgba(22,50,35,0.28)',
            }}
            initial={{ x: 0, y: 14, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            exit={{ x: dish.dir < 0 ? -240 : 240, rotate: dish.dir < 0 ? -15 : 15, opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE_QUINT }}
          >
            <DishCard dish={dish} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nej / ja action buttons — ✕ pulses on a rejected dish, ✓ on a kept one. */}
      <div className="flex items-center justify-center gap-6">
        <motion.span
          key={`no-${idx}`}
          className="flex items-center justify-center rounded-full bg-white"
          style={{ width: 44, height: 44, border: `1px solid ${HAIRLINE}` }}
          initial={{ scale: justSwiped && justSwiped.dir < 0 ? 0.7 : 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_QUINT }}
        >
          <svg width="15" height="15" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.span>
        <motion.span
          key={`yes-${idx}`}
          className="flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: MINT }}
          initial={{ scale: justSwiped && justSwiped.dir > 0 ? 0.7 : 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_QUINT }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7" stroke={FOREST} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </div>
      <GoBack />
    </div>
  )
}

// ── Section ─────────────────────────────────────────────────────────────────

const SCENES: FlowScene[] = [
  { key: 'prefs', label: 'Jeres smag', render: (t) => <PrefsScene t={t} />, ms: 3600 },
  { key: 'family', label: 'Hvem spiser med?', render: (t) => <FamilyScene t={t} />, ms: 3200 },
  { key: 'hensyn', label: 'Særlige hensyn', render: (t) => <HensynScene t={t} />, ms: 3000 },
  { key: 'budget', label: 'Budget', render: (t) => <BudgetSliderScene t={t} />, ms: SLIDER_MS },
  { key: 'build', label: 'Appen bygger madplanen', render: (t) => <BuildScene t={t} />, ms: 3600 },
  { key: 'overview', label: 'Din madplan for ugen', render: (t) => <PlanOverviewScene t={t} />, ms: 4200 },
  { key: 'swipe', label: 'Tilpas retterne', render: (t) => <SwipeScene t={t} />, ms: SWIPE_TOTAL },
  { key: 'godkendt', label: 'Madplan godkendt', render: (t) => <PlanGodkendtScene t={t} />, ms: 4200 },
  { key: 'appikon', label: 'Altid Hjem', render: () => <AppIconClose />, ms: APP_ICON_MS, opener: true },
]

export default function ProblemMadplan() {
  return (
    <QuestionSection
      question="Hvad skal vi have til aftensmad?"
      answer="Altid Mad løser det automatisk med en skræddersyet madplan og masser af inspiration, tilpasset præcis jeres smag, hverdag og familiens størrelse. I vælger, hvad I kan lide, og appen bygger ugens madplan for jer."
      chips={['Madplan på 5 minutter', 'Tilpasset din familie']}
      flow={{
        scenes: SCENES,
        sceneMs: SCENE_MS,
        screenTitle: 'Ny madplan',
        tab: 'mad',
        still: <PlanGodkendtScene anim={false} />,
      }}
    />
  )
}
