'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import QuestionSection, {
  ACCENT, APP_ICON_MS, EASE_EXPO, EASE_QUINT, FOREST, HAIRLINE, MINT, MUTED, SAVE_TEAL, TEAL,
  AppIconClose, MintCta, SceneHeader, Thumb, type FlowScene,
} from './problemShared'

// A COPY of "Hvor handler vi billigst ind?" — the full shopping story: two
// lists (madplan optimized, basisvarer not), optimizing the basisvarer with
// the price hunt, planning one combined trip (lists forwarded to each store's
// scan-app), and a real map with the route. The original ProblemIndkoeb is
// untouched. Map tiles: © OpenStreetMap contributors.

const SCENE_MS = 5000

// Clear "needs fixing" error red for the un-optimised basisvarer status.
const ERROR_RED = '#d92d20'
const ERROR_WASH = 'rgba(217,45,32,0.12)'
// What the madplan is already saving (the list is pre-optimised on this scene).
const MADPLAN_SAVE = 312

type StoreKey = 'netto' | 'rema' | 'bilka'
// Store identity colours follow the chains' ACTUAL brands: Netto yellow,
// REMA 1000 navy, Bilka blue. Ink is a darkened tone of each for text on wash.
const STORES: Record<StoreKey, { name: string; dot: string; wash: string; ink: string; dist: string }> = {
  netto: { name: 'Netto', dot: '#ffd400', wash: 'rgba(255,212,0,0.18)', ink: '#7a6200', dist: '3,1 km' },
  rema: { name: 'REMA 1000', dot: '#24418f', wash: 'rgba(36,65,143,0.12)', ink: '#24418f', dist: '2,4 km' },
  bilka: { name: 'Bilka', dot: '#0a5cad', wash: 'rgba(10,92,173,0.12)', ink: '#0a5cad', dist: '350 m' },
}

// Official brand app-icons, pulled straight from each chain's own site
// favicon/apple-touch-icon (bilka.dk, netto.dk, rema1000.dk). Square marks —
// Bilka's blue "B" tile, REMA's rounded tile, Netto's black scottie-dog disc.
const LOGO: Record<StoreKey, { src: string; name: string }> = {
  bilka: { src: '/logos/bilka.png', name: 'Bilka' },
  rema: { src: '/logos/rema.png', name: 'REMA 1000' },
  netto: { src: '/logos/netto.png', name: 'Netto' },
}

function StoreLogo({ store, size = 22, shadow = false }: { store: StoreKey; size?: number; shadow?: boolean }) {
  const L = LOGO[store]
  // Netto's icon is a circular disc; keep it round. The others are app tiles.
  const radius = store === 'netto' ? '50%' : `${Math.round(size * 0.23)}px`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={L.src}
      alt={L.name}
      className="block shrink-0 object-contain"
      style={{ width: size, height: size, borderRadius: radius, boxShadow: shadow ? '0 2px 5px rgba(0,0,0,0.35)' : 'none' }}
    />
  )
}

type Item = { name: string; store: StoreKey; price?: string }
const MADPLAN_ITEMS: Item[] = [
  { name: 'Kyllingefilet, 600 g', store: 'rema', price: '29 kr.' },
  { name: 'Koldrøget laks, 400 g', store: 'bilka', price: '45 kr.' },
  { name: 'Hakket oksekød, 400 g', store: 'netto', price: '32 kr.' },
]
const BASIS_ITEMS: Item[] = [
  { name: '5 stk Minimælk, 1 L', store: 'netto' },
  { name: '2 stk Toiletpapir, 8 ruller', store: 'rema' },
  { name: '3 stk Smør, 150 g', store: 'bilka' },
]

function StoreBadge({ store }: { store: StoreKey }) {
  const s = STORES[store]
  return (
    <span className="flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 font-bold" style={{ fontSize: 7.5, background: s.wash, color: s.ink }}>
      <span className="inline-block rounded-full" style={{ width: 4, height: 4, background: s.dot }} />
      {s.name}
    </span>
  )
}

function StatusBadge({ optimized }: { optimized: boolean }) {
  return optimized ? (
    <span className="flex items-center gap-1 font-bold" style={{ fontSize: 7.5, color: TEAL }}>
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2 6.5L4.8 9l5-6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Bedste priser fundet
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 font-bold" style={{ fontSize: 7.5, background: ERROR_WASH, color: ERROR_RED }}>
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden>
        <circle cx="6" cy="6" r="5" stroke={ERROR_RED} strokeWidth="1.4" />
        <path d="M6 3.4v3.1" stroke={ERROR_RED} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6" cy="8.5" r="0.7" fill={ERROR_RED} />
      </svg>
      Ikke optimeret
    </span>
  )
}

function ListCard({
  title, items, optimized, more, footer, reveal = false, statusDelay, strokeDelay,
}: {
  title: string
  items: Item[]
  optimized: boolean
  more?: number
  footer?: React.ReactNode
  /** Animate the shop badges + prices on, staggered (the Madplan card). */
  reveal?: boolean
  /** Delay (s) before the status badge pops on; static/immediate if omitted. */
  statusDelay?: number
  /** Delay (s) before a stronger teal stroke fades on (like the hero mockup). */
  strokeDelay?: number
}) {
  const moreCount = more ?? items.length - 3
  return (
    <div className="relative rounded-xl bg-white px-2.5 py-2" style={{ border: `1px solid ${HAIRLINE}` }}>
      {strokeDelay !== undefined && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ border: '1.5px solid rgba(15,110,104,0.42)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: strokeDelay, duration: 0.45, ease: EASE_EXPO }}
        />
      )}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-bold" style={{ fontSize: 10.5, color: FOREST }}>{title}</span>
        {statusDelay !== undefined ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: statusDelay, duration: 0.45, ease: EASE_EXPO }}>
            <StatusBadge optimized={optimized} />
          </motion.div>
        ) : (
          <StatusBadge optimized={optimized} />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.slice(0, 3).map((it, i) => {
          const tag = (
            <>
              <StoreBadge store={it.store} />
              {it.price && <span className="font-bold" style={{ fontSize: 9, color: FOREST, minWidth: 26, textAlign: 'right' }}>{it.price}</span>}
            </>
          )
          return (
            <div key={it.name} className="flex items-center gap-2">
              <span className="inline-block rounded-full shrink-0" style={{ width: 6, height: 6, background: optimized ? STORES[it.store].dot : 'rgba(15,110,104,0.22)' }} />
              <span className="flex-1 min-w-0 truncate font-semibold" style={{ fontSize: 9.5, color: FOREST }}>{it.name}</span>
              {optimized ? (
                reveal ? (
                  <motion.span className="flex shrink-0 items-center gap-1.5" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 + i * 0.22, duration: 0.4, ease: EASE_EXPO }}>{tag}</motion.span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1.5">{tag}</span>
                )
              ) : <span style={{ fontSize: 8, color: MUTED }}>Vælg butik</span>}
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 text-[8.5px]" style={{ color: MUTED }}>+ {moreCount} flere varer</p>
      {footer}
    </div>
  )
}

// Counts a number up from 0 → `to` on mount (used for the madplan saving).
function CountUp({ to, delay = 0, duration = 1 }: { to: number; delay?: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const controls = animate(0, to, { delay, duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setVal(Math.round(v)) })
    return () => controls.stop()
  }, [to, delay, duration])
  return <>{val}</>
}

// A small success confetti burst over a card (deterministic, so it's SSR-safe).
const CONFETTI_COLORS = ['#0f6e68', '#bfe6e0', '#e88b2f', '#f5c542', '#2f8fd0']
function Confetti({ delay = 0, count = 16 }: { delay?: number; count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ overflow: 'visible', zIndex: 5 }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const ang = (i / count) * Math.PI * 2
        const dist = 44 + (i % 3) * 24
        const dx = Math.cos(ang) * dist
        const dy = Math.sin(ang) * dist * 0.62 - 6
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: '50%', top: '44%', width: 5, height: 8, borderRadius: 1.5, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ x: dx, y: [0, dy, dy + 12], opacity: [0, 1, 1, 0], scale: 1, rotate: (i * 47) % 360 }}
            transition={{ delay: delay + (i % 4) * 0.02, duration: 0.95, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}


// Scene 1 — two lists, choreographed: the Madplan card animates in and, once
// it has settled, tallies its saving; THEN the Basisvarer card animates in with
// its info + "Ikke optimeret", THEN its "Find de bedste priser" button appears
// and is clicked → the flow advances. Explicit mount delays (seconds) sequence it.
const cardIn = (delay: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.5, ease: EASE_EXPO },
})
function IndkobslisteScene({ t }: { t: number }) {
  const pressing = t >= 5600 && t < 6000
  return (
    <div className="flex h-full flex-col">
      <motion.div {...cardIn(0.1)}>
        <SceneHeader title="Dine indkøbslister" sub="Madplan og basisvarer, samlet ét sted" />
      </motion.div>
      <div className="flex flex-col gap-2.5">
        {/* Madplan: items in → shops+prices → saving counts up → "Bedste priser
            fundet" pops on with a small confetti burst. */}
        <motion.div className="relative" {...cardIn(0.3)}>
          <ListCard
            title="Madplan"
            items={MADPLAN_ITEMS}
            optimized
            reveal
            statusDelay={2.2}
            more={25}
            footer={
              <motion.div
                className="mt-2 flex items-center justify-center gap-1.5 pt-2 font-semibold"
                style={{ borderTop: `1px solid ${HAIRLINE}`, color: TEAL, fontSize: 10 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: EASE_EXPO, delay: 1.3 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42z" fill={TEAL} />
                  <circle cx="6" cy="6" r="1.5" fill="#fff" />
                </svg>
                Du sparer <CountUp to={MADPLAN_SAVE} delay={1.4} duration={1.0} /> kr. på 28 varer
              </motion.div>
            }
          />
          <Confetti delay={2.3} />
        </motion.div>
        {/* Basisvarer: info in → red "Ikke optimeret" pops on → the stroke
            highlights the card the moment the CTA arrives below. The whole
            build stays tight — a long half-empty phone reads as broken. */}
        <motion.div {...cardIn(2.7)}>
          <ListCard
            title="Basisvarer"
            items={BASIS_ITEMS}
            optimized={false}
            more={2}
            strokeDelay={4.3}
            statusDelay={3.7}
          />
        </motion.div>
      </div>
      {/* Classic bottom CTA like the other slides — arrives with the card
          stroke, one clean click near the scene's end. The small spacer sits
          the button roughly halfway between flush-bottom and the raised
          "Gå tilbage" height — balanced between the card and the tab bar. */}
      <div className="mt-auto pb-1">
        <MintCta label="Find de bedste priser" show={t >= 4300} pressing={pressing} pop={false} />
        <div style={{ height: 10 }} aria-hidden />
      </div>
    </div>
  )
}

// Scene 2 — the price hunt. Fixed column order (Netto · REMA · Bilka) so the
// winning column visibly jumps between supermarkets.
const HUNT_ORDER: StoreKey[] = ['netto', 'rema', 'bilka']
const BASIS_HUNT: { img: string; name: string; save: number; best: StoreKey; prices: Record<StoreKey, number> }[] = [
  { img: '/basis/minimaelk.jpg', name: 'Minimælk, 1 L', save: 2, best: 'netto', prices: { netto: 8, rema: 11, bilka: 10 } },
  { img: '/basis/toiletpapir.jpg', name: 'Toiletpapir, 8 ruller', save: 5, best: 'rema', prices: { netto: 32, rema: 27, bilka: 29 } },
  { img: '/basis/smoer.jpg', name: 'Smør, 200 g', save: 5, best: 'bilka', prices: { netto: 19, rema: 18, bilka: 15 } },
  { img: '/basis/havregryn.jpg', name: 'Havregryn, 1 kg', save: 3, best: 'rema', prices: { netto: 13, rema: 12, bilka: 14 } },
  { img: '/basis/kaffe.jpg', name: 'Kaffe, 400 g', save: 7, best: 'rema', prices: { netto: 45, rema: 39, bilka: 42 } },
]
const BASIS_WINDOW = 1600
const BASIS_TOTAL_MS = BASIS_HUNT.length * BASIS_WINDOW
const BASIS_SAVE = BASIS_HUNT.reduce((s, h) => s + h.save, 0)

function BasisHuntScene({ t }: { t: number }) {
  const idx = Math.min(BASIS_HUNT.length - 1, Math.floor(t / BASIS_WINDOW))
  const within = t - idx * BASIS_WINDOW
  const found = within > 1200 // this item's best price is locked in
  let saved = 0
  for (let i = 0; i < idx; i++) saved += BASIS_HUNT[i].save
  if (found) saved += BASIS_HUNT[idx].save
  const item = BASIS_HUNT[idx]
  return (
    <div className="flex h-full flex-col">
      <SceneHeader title="Finder bedste pris" sub="Basisvarer, butik for butik" />
      <div className="rounded-xl bg-white p-2.5 overflow-hidden" style={{ border: `1px solid ${HAIRLINE}` }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: EASE_QUINT }}
          >
            <div className="flex items-center gap-2">
              <Thumb src={item.img} size={26} />
              <span className="flex-1 font-semibold" style={{ fontSize: 11, color: FOREST }}>{item.name}</span>
              <span style={{ fontSize: 9, color: MUTED }}>{idx + 1} af {BASIS_HUNT.length}</span>
            </div>
            <div className="mt-2 flex gap-1">
              {HUNT_ORDER.map((k, i) => {
                const shown = within > 300 + i * 260
                const locked = within > 1200
                const isBest = item.best === k
                return (
                  <motion.div
                    key={k}
                    className="flex-1 rounded-lg px-0.5 py-1 text-center"
                    style={{ background: locked && isBest ? TEAL : 'transparent', border: locked && isBest ? '1px solid transparent' : `1px solid ${HAIRLINE}` }}
                    initial={false}
                    animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 6 }}
                    transition={{ duration: 0.3, ease: EASE_QUINT }}
                  >
                    <span className="flex items-center justify-center gap-1 font-medium" style={{ fontSize: 7.5, color: locked && isBest ? MINT : MUTED }}>
                      <span className="inline-block rounded-full shrink-0" style={{ width: 4, height: 4, background: locked && isBest ? MINT : STORES[k].dot }} />
                      {STORES[k].name}
                    </span>
                    <span className="block font-bold" style={{ fontSize: 11, color: locked && isBest ? '#fff' : 'rgba(22,50,35,0.75)', textDecoration: locked && !isBest ? 'line-through' : 'none' }}>
                      {item.prices[k]} kr.
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* The classic "+X kr." pops IN FRONT of the running total the moment a
          best price locks — both sit in fixed-width slots so nothing slides
          while the numbers change. */}
      <div className="mt-2.5 flex items-center justify-between rounded-full px-3.5 py-2" style={{ background: 'rgba(191,230,224,0.45)' }}>
        <span className="font-semibold" style={{ fontSize: 10, color: TEAL }}>Du sparer indtil videre</span>
        <span className="flex items-center gap-1.5">
          <motion.span
            className="inline-block text-right font-bold tabular-nums"
            style={{ fontSize: 10.5, color: SAVE_TEAL, width: 34 }}
            initial={false}
            animate={{ opacity: found ? 1 : 0, y: found ? 0 : 4 }}
            transition={{ duration: 0.3, ease: EASE_QUINT }}
          >
            +{item.save} kr.
          </motion.span>
          <span className="inline-block text-right font-bold tabular-nums" style={{ fontSize: 11.5, color: TEAL, minWidth: 38 }}>
            {saved} kr.
          </span>
        </span>
      </div>
      <p className="mt-2.5 text-[9.5px]" style={{ color: MUTED }}>Finder de bedste priser på basisvarer i dine foretrukne supermarkeder</p>
    </div>
  )
}

// Scene 3 — finished basis list, a "Planlæg indkøbstur" button, and the
// list-selection popup that opens from it (all on the same scene).
const BASIS_FINAL: { img: string; name: string; store: StoreKey; price: string }[] = [
  { img: '/basis/minimaelk.jpg', name: 'Minimælk', store: 'netto', price: '8 kr.' },
  { img: '/basis/toiletpapir.jpg', name: 'Toiletpapir', store: 'rema', price: '27 kr.' },
  { img: '/basis/smoer.jpg', name: 'Smør', store: 'bilka', price: '15 kr.' },
  { img: '/basis/havregryn.jpg', name: 'Havregryn', store: 'rema', price: '12 kr.' },
  { img: '/basis/kaffe.jpg', name: 'Kaffe', store: 'rema', price: '39 kr.' },
]

function SelectRow({ label, sub, selected }: { label: string; sub: string; selected: boolean }) {
  return (
    <div
      className="mb-1.5 flex items-center gap-2 rounded-xl px-2.5 py-2"
      style={{ background: selected ? 'rgba(191,230,224,0.32)' : '#fff', border: `1px solid ${selected ? 'rgba(15,110,104,0.32)' : HAIRLINE}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}
    >
      <div className="flex-1">
        <p className="font-semibold" style={{ fontSize: 10.5, color: FOREST }}>{label}</p>
        <p style={{ fontSize: 8.5, color: MUTED }}>{sub}</p>
      </div>
      <motion.span
        className="flex items-center justify-center shrink-0"
        style={{ width: 18, height: 18, borderRadius: 6, background: selected ? TEAL : 'transparent', border: selected ? 'none' : `1.5px solid ${HAIRLINE}` }}
        animate={{ scale: selected ? [1, 1.18, 1] : 1 }}
        transition={{ duration: 0.32, ease: EASE_QUINT }}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6.5L4.8 9l5-6" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.span>
    </div>
  )
}

function GoBack() {
  return (
    <p className="mt-1.5 text-center font-medium" style={{ fontSize: 9, color: MUTED }}>
      ←  Gå tilbage
    </p>
  )
}

function BasisListScene({ t }: { t?: number }) {
  const live = t !== undefined
  const tt = t ?? 0
  const btnPress = live && tt >= 1650 && tt < 1900
  const opened = live && tt >= 1900
  const to = tt - 1900
  const madplanSel = to >= 1000
  const confirmPress = to >= 2400 && to < 2700
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 24, height: 24, background: MINT }}
          initial={live ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.45, ease: EASE_QUINT, delay: 0.15 }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2.5 7.5l3 3 6-7" stroke={FOREST} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
        <div>
          <p className="text-[14.5px] font-semibold leading-tight" style={{ color: FOREST }}>Indkøbslisten er klar</p>
          <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Basisvarer til laveste pris</p>
        </div>
      </div>
      <div className="rounded-xl bg-white p-2.5" style={{ border: `1px solid ${HAIRLINE}` }}>
        <div className="flex flex-col gap-2">
          {BASIS_FINAL.map((r, i) => (
            <motion.div
              key={r.name}
              className="flex items-center gap-2"
              initial={live ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE_QUINT, delay: 0.3 + i * 0.09 }}
            >
              <Thumb src={r.img} size={25} />
              <span className="flex-1 min-w-0 truncate font-semibold" style={{ fontSize: 10.5, color: FOREST }}>{r.name}</span>
              <StoreBadge store={r.store} />
              <span className="shrink-0 font-bold" style={{ fontSize: 10, color: FOREST, minWidth: 28, textAlign: 'right' }}>{r.price}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        className="mt-2.5 flex items-center justify-center gap-1.5 pt-2 font-semibold"
        style={{ borderTop: `1px solid ${HAIRLINE}`, color: TEAL, fontSize: 10.5 }}
        initial={live ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_EXPO, delay: 0.6 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42z" fill={TEAL} />
          <circle cx="6" cy="6" r="1.5" fill="#fff" />
        </svg>
        Du sparer {BASIS_SAVE} kr. på basisvarer
      </motion.div>

      {/* Blur overlay — bleeds past the content on ALL sides so the whole
          screen dims, status bar (time + battery) included. */}
      <AnimatePresence>
        {opened && (
          <motion.div
            key="blur"
            className="absolute"
            style={{ top: -210, left: -16, right: -16, bottom: -84, zIndex: 40, backdropFilter: 'blur(1.6px)', WebkitBackdropFilter: 'blur(1.6px)', background: 'rgba(22,50,35,0.07)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet (Figma 3747-203) — full-bleed to the phone edges and
          all the way down over the tab bar, so it reads as one white card
          swiped up from the bottom; the grab handle on top signals it can be
          swiped down again. Selection rows and the teal "Lad os handle ind"
          primary live INSIDE the sheet. */}
      <AnimatePresence>
        {opened && (
          <motion.div
            key="sheet"
            className="absolute rounded-t-3xl bg-white px-4 pt-2"
            // -61, not the blur overlay's -84: the scene bottom sits ~61px
            // above the visible screen edge (TabBar + home indicator) — any
            // deeper and the button gets sliced by the screen crop. The
            // paddingBottom lifts the content a bit above the screen edge —
            // higher than flush, lower than the CTA row.
            style={{ left: -16, right: -16, bottom: -61, zIndex: 41, paddingBottom: 44, boxShadow: '0 -14px 34px -18px rgba(22,50,35,0.45)' }}
            initial={{ y: '108%' }}
            animate={{ y: 0 }}
            exit={{ y: '108%' }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
          >
            <div className="mx-auto mb-2 rounded-full" style={{ width: 34, height: 4, background: 'rgba(22,50,35,0.18)' }} />
            <p className="font-semibold" style={{ fontSize: 13, color: FOREST }}>Vælg lister til turen</p>
            <p className="mt-0.5 mb-2.5" style={{ fontSize: 9.5, color: MUTED }}>Vi samler dem til én rute</p>
            <SelectRow label="Basisvarer" sub="5 varer" selected />
            <SelectRow label="Madplan" sub="28 varer" selected={madplanSel} />
            <motion.div
              className="mt-2.5 flex items-center justify-center rounded-full font-semibold"
              style={{
                height: 34,
                fontSize: 11,
                background: TEAL,
                color: '#eafaf6',
                boxShadow: '0 10px 24px -12px rgba(15,110,104,0.55)',
              }}
              initial={false}
              animate={{ scale: confirmPress ? [1, 0.93, 1] : 1 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
            >
              Lad os handle ind
            </motion.div>
            {/* No "Gå tilbage" here — the grab handle is the dismiss
                affordance, and anything below the button falls outside the
                visible screen now that the sheet runs to the bottom edge. */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls — the sheet covers these while it is open. */}
      <div className="mt-auto pb-1">
        <MintCta label="Planlæg indkøbstur" pressing={btnPress} pop={false} />
        <GoBack />
      </div>
    </div>
  )
}

// Scene 4 — the planning loader (styled after "Appen bygger madplanen"): a
// big ring, then the combined list forwarded to each store's scan-app.
// 100px — shared size with the madplan phone's build loader.
const RING_SIZE = 100
const RING_SW = 9
const RING_R = (RING_SIZE - RING_SW) / 2
const RING_C = 2 * Math.PI * RING_R
const RING_MID = RING_SIZE / 2
// One list per store — OUR lists, split by where each item is cheapest.
// (No third-party app hand-off claims here; see the memory note about the
// shelved Scan & Go integration story.)
const HANDOFFS: { store: StoreKey; label: string; sub: string; at: number }[] = [
  { store: 'bilka', label: 'Indkøbsliste til Bilka', sub: '8 varer til laveste pris', at: 700 },
  { store: 'rema', label: 'Indkøbsliste til REMA 1000', sub: '13 varer til laveste pris', at: 1700 },
  { store: 'netto', label: 'Indkøbsliste til Netto', sub: '12 varer til laveste pris', at: 2700 },
]

function PlanlaegningScene({ t }: { t: number }) {
  const progress = Math.min(1, Math.max(0, (t - 300) / 3400))
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 pb-3">
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
            <circle cx={RING_MID} cy={RING_MID} r={RING_R} fill="none" stroke="rgba(191,230,224,0.6)" strokeWidth={RING_SW} />
            <circle
              cx={RING_MID} cy={RING_MID} r={RING_R} fill="none" stroke={TEAL} strokeWidth={RING_SW} strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - progress)}
              transform={`rotate(-90 ${RING_MID} ${RING_MID})`} style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
        </div>
        <p className="font-semibold" style={{ fontSize: 13.5, color: FOREST }}>Planlægger indkøbstur</p>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        {HANDOFFS.map((h) => {
          const shown = t >= h.at
          const done = t >= h.at + 700
          return (
            <motion.div
              key={h.store}
              className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5"
              style={{ border: `1px solid ${HAIRLINE}` }}
              initial={false}
              animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 8 }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
            >
              <StoreLogo store={h.store} size={26} />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold" style={{ fontSize: 11, color: done ? FOREST : MUTED }}>{h.label}</p>
                <p className="truncate" style={{ fontSize: 9, color: MUTED }}>{h.sub}</p>
              </div>
              <motion.span
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 18, height: 18, background: done ? TEAL : 'transparent', border: done ? 'none' : `1.5px solid ${HAIRLINE}` }}
                initial={false}
                animate={{ scale: done ? [0.6, 1.15, 1] : 1 }}
                transition={{ duration: 0.32, ease: EASE_QUINT }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 6.5L4.8 9l5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Scene 5 — the map: a real OpenStreetMap of the Tilst/Aarhus cluster (where a
// Bilka, REMA 1000 and Netto actually sit close together), the route through
// them, and a bottom sheet with how many varer to get at each store.
// Trip order = the driving order: Bilka (first, nearest home) → REMA → Netto.
const TRIP: { store: StoreKey; count: number }[] = [
  { store: 'bilka', count: 8 },
  { store: 'rema', count: 13 },
  { store: 'netto', count: 12 },
]
const TOTAL_VARER = TRIP.reduce((s, g) => s + g.count, 0)
const PINS: { store: StoreKey; left: string; top: string }[] = [
  { store: 'bilka', left: '16.3%', top: '15.5%' },
  { store: 'rema', left: '75.1%', top: '26.9%' },
  { store: 'netto', left: '85.1%', top: '55.3%' },
]
// Real drivable route (OSRM, following roads) home → Bilka → REMA → Netto → home.
// Home now sits on Skjoldhøjvej by Skjoldhøjskolen (~36%,31%). ROUTE_PTS starts
// AND ends at home, so drawing it from offset 0 grows house → Bilka → … → home.
const ROUTE_PTS =
  '36.0,30.7 29.5,31.5 24.0,32.8 23.5,32.0 23.4,28.6 23.4,21.4 23.4,17.9 16.5,17.9 16.5,16.1 13.6,15.5 14.7,13.7 16.6,12.8 26.6,14.5 45.2,17.3 50.8,18.5 55.4,19.6 76.1,25.1 76.8,25.7 75.1,26.7 74.0,26.7 76.8,25.7 79.4,26.0 98.8,31.1 100.0,32.7 100.0,35.4 100.0,37.6 100.0,38.7 100.0,41.6 100.0,46.1 97.1,49.0 94.3,51.3 91.2,54.7 87.5,54.7 84.4,54.8 84.5,55.4 85.0,57.7 83.3,57.9 79.8,58.2 77.0,58.5 74.3,58.8 72.4,58.9 71.7,58.2 71.3,56.3 70.8,55.7 68.5,55.8 62.2,55.5 56.2,54.9 49.8,54.0 48.3,53.6 48.0,52.0 47.0,47.9 46.6,46.0 45.3,39.5 44.7,35.8 45.2,31.4 45.7,30.1 45.7,29.9 45.4,29.8 45.1,29.9 39.9,30.4 36.0,30.7'

// Route geometry parsed once. The polyline lives in a 0–100 viewBox stretched
// non-uniformly to the phone (~2.54px/x-unit, ~3.80px/y-unit), so segment
// lengths are weighted by that scale to make the draw advance at an even
// *visual* speed. `partialRoute(p)` returns the first p-fraction of the path —
// a clean contiguous reveal from the house outward (dash-offset draws break
// under vectorEffect=non-scaling-stroke, so we trim points instead).
const ROUTE_ARR: [number, number][] = ROUTE_PTS.split(' ').map((s) => {
  const [x, y] = s.split(',').map(Number)
  return [x, y]
})
const RX = 2.54
const RY = 3.8
const ROUTE_SEG = ROUTE_ARR.slice(1).map((p, i) => Math.hypot((p[0] - ROUTE_ARR[i][0]) * RX, (p[1] - ROUTE_ARR[i][1]) * RY))
const ROUTE_LEN = ROUTE_SEG.reduce((a, b) => a + b, 0)

function partialRoute(progress: number): string {
  if (progress >= 1) return ROUTE_PTS
  if (progress <= 0) return `${ROUTE_ARR[0][0]},${ROUTE_ARR[0][1]}`
  const target = ROUTE_LEN * progress
  const out: string[] = [`${ROUTE_ARR[0][0]},${ROUTE_ARR[0][1]}`]
  let acc = 0
  for (let i = 1; i < ROUTE_ARR.length; i++) {
    const d = ROUTE_SEG[i - 1]
    if (acc + d < target) {
      out.push(`${ROUTE_ARR[i][0]},${ROUTE_ARR[i][1]}`)
      acc += d
    } else {
      const f = d === 0 ? 0 : (target - acc) / d
      const x = ROUTE_ARR[i - 1][0] + (ROUTE_ARR[i][0] - ROUTE_ARR[i - 1][0]) * f
      const y = ROUTE_ARR[i - 1][1] + (ROUTE_ARR[i][1] - ROUTE_ARR[i - 1][1]) * f
      out.push(`${x.toFixed(1)},${y.toFixed(1)}`)
      break
    }
  }
  return out.join(' ')
}

// A "you are here / home" marker — the trip starts and returns here. It pops
// in first (before the route starts drawing), like the store pins do.
function HomeMarker({ animateIn = false }: { animateIn?: boolean }) {
  return (
    <div className="absolute" style={{ left: '36%', top: '30.7%', transform: 'translate(-50%,-50%)' }}>
      <motion.div
        className="flex items-center justify-center rounded-full bg-white"
        style={{ width: 24, height: 24, boxShadow: '0 2px 7px rgba(0,0,0,0.32)' }}
        initial={animateIn ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 0.1 }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 11L12 4l8 7" stroke={FOREST} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v10h12V10" stroke={FOREST} strokeWidth="2" strokeLinejoin="round" />
          <rect x="10" y="14" width="4" height="6" fill={FOREST} />
        </svg>
      </motion.div>
    </div>
  )
}

// Bilka Tilst's real opening hours (Agerøvej 7, 8381 Tilst): Mon–Fri 08–22,
// Sat–Sun 07–22. Computed live so the card reads open/closed against the clock.
const BILKA_CLOSE_MIN = 22 * 60
const bilkaOpenMin = (day: number) => (day >= 1 && day <= 5 ? 8 * 60 : 7 * 60)
const fmtKl = (min: number) => `kl. ${Math.floor(min / 60)}.${String(min % 60).padStart(2, '0')}`
function bilkaStatus() {
  const now = new Date()
  const day = now.getDay()
  const mins = now.getHours() * 60 + now.getMinutes()
  const open = bilkaOpenMin(day)
  if (mins >= open && mins < BILKA_CLOSE_MIN) {
    return { open: true, label: 'Åbent', detail: `Lukker ${fmtKl(BILKA_CLOSE_MIN)}` }
  }
  const nextOpen = mins < open ? open : bilkaOpenMin((day + 1) % 7)
  return { open: false, label: 'Lukket', detail: `Åbner ${fmtKl(nextOpen)}` }
}

// A Google-Maps-style place card for the first stop, Bilka Tilst — with the
// store's own photo, real address and a live open/closed status.
function BilkaPopup() {
  const s = bilkaStatus()
  const statusColor = s.open ? '#188038' : '#c5221f'
  return (
    <motion.div
      className="absolute"
      style={{ left: '19%', top: '13%', width: 176, zIndex: 6 }}
      initial={{ opacity: 0, y: -8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE_EXPO }}
    >
      {/* pointer up toward the Bilka marker */}
      <div className="absolute" style={{ left: 12, top: -5, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #fff', zIndex: 1 }} />
      <div className="overflow-hidden rounded-xl bg-white" style={{ boxShadow: '0 8px 22px -6px rgba(0,0,0,0.4)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bilka-tilst.jpg" alt="Bilka Tilst" className="h-[58px] w-full object-cover" />
        <div className="p-2">
          <div className="flex items-center gap-1.5">
            <StoreLogo store="bilka" size={18} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold" style={{ fontSize: 10, color: FOREST }}>Bilka Tilst</p>
              <p className="truncate" style={{ fontSize: 7.5, color: MUTED }}>Stormagasin · 350 m</p>
            </div>
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 font-bold"
              style={{ fontSize: 7, background: 'rgba(15,110,104,0.1)', color: TEAL }}
            >
              Første stop
            </span>
          </div>
          <p className="mt-1 truncate" style={{ fontSize: 7.5, color: MUTED }}>Agerøvej 7, 8381 Tilst</p>
          <div className="mt-1 flex items-center gap-1" style={{ fontSize: 8 }}>
            <span className="font-semibold" style={{ color: statusColor }}>{s.label}</span>
            <span style={{ color: MUTED }}>· {s.detail}</span>
          </div>
          {s.open && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="flex items-end" style={{ gap: 1, height: 9 }}>
                {[3, 5, 4, 6, 4, 3].map((h, i) => (
                  <span key={i} style={{ width: 2, height: h, borderRadius: 1, background: i === 3 ? '#188038' : 'rgba(24,128,56,0.35)' }} />
                ))}
              </span>
              <span className="font-semibold" style={{ fontSize: 8, color: '#188038' }}>Ikke travlt lige nu</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Map controls (bottom-right, above the sheet) — recenter + directions, like a maps app.
function MapButtons({ hidden }: { hidden: boolean }) {
  return (
    <motion.div
      className="absolute flex flex-col gap-2"
      style={{ right: 10, bottom: 78 }}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1, x: hidden ? 6 : 0 }}
      transition={{ duration: 0.35, ease: EASE_EXPO }}
    >
      <div className="flex items-center justify-center rounded-full bg-white" style={{ width: 32, height: 32, boxShadow: '0 3px 10px rgba(0,0,0,0.28)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 11L21 4l-7 17-2.5-7.5L3 11z" fill="#4b4b4b" />
        </svg>
      </div>
      <div className="flex items-center justify-center rounded-xl" style={{ width: 32, height: 32, background: TEAL, boxShadow: '0 3px 10px rgba(0,0,0,0.28)' }}>
        {/* Clean "directions" turn-right arrow (Maps-style). */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 17.5V12.5A3.5 3.5 0 0 1 11.5 9H15.5" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 6l3 3-3 3" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.div>
  )
}

// Where the route passes each store, as a fraction of its total length — the
// draw holds here so the store's own logo can pop in before it carries on.
const STOP_FRAC: Record<StoreKey, number> = { bilka: 0.157, rema: 0.42, netto: 0.682 }
// Draw choreography: draw a leg → hold while the pin pops → next leg. Repeating
// a keyframe value makes the hold; `times` (0–1 of DRAW_DURATION) sets the beats.
const DRAW_KEYS = [0, 0.157, 0.157, 0.42, 0.42, 0.682, 0.682, 1]
const DRAW_TIMES = [0, 0.108, 0.212, 0.393, 0.498, 0.677, 0.782, 1]
const DRAW_DURATION = 3.4

function KortScene({ t }: { t: number }) {
  // In `still` mode (t huge, reduced motion) everything is shown immediately.
  const isStill = t > 1e6
  const [drawP, setDrawP] = useState(isStill ? 1 : 0)
  const [sheetUp, setSheetUp] = useState(isStill)
  const [showBilka, setShowBilka] = useState(isStill)
  useEffect(() => {
    if (isStill) {
      setDrawP(1)
      setSheetUp(true)
      setShowBilka(true)
      return
    }
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    setDrawP(0)
    setSheetUp(false)
    setShowBilka(false)
    // Draw the route (pausing at each store), then bring up the sheet + place card.
    const controls = animate(0, DRAW_KEYS, {
      duration: DRAW_DURATION,
      delay: 0.6,
      times: DRAW_TIMES,
      ease: 'linear',
      onUpdate: (v) => !cancelled && setDrawP(v),
      onComplete: () => {
        if (cancelled) return
        timers.push(setTimeout(() => !cancelled && setSheetUp(true), 400))
        timers.push(setTimeout(() => !cancelled && setShowBilka(true), 1200))
      },
    })
    return () => {
      cancelled = true
      controls.stop()
      timers.forEach(clearTimeout)
    }
  }, [isStill])
  const drawn = partialRoute(drawP)
  return (
    <div className="relative h-full -mx-4 overflow-hidden">
      {/* Camera group — the map view sits panned ~5% to the RIGHT: the box
          extends past the LEFT edge, so the visible window shows the image's
          right side (no gaps — the crop eats the left sliver instead). The
          route/pins live in an inner frame compensating for the ×1.05 cover
          rescale, so they stay street-aligned with the shifted image. */}
      <div className="absolute inset-y-0" style={{ left: '-5%', width: '105%' }}>
        {/* Real map (© OpenStreetMap contributors). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/map-tur.jpg" alt="Kort over ruten" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-x-0" style={{ top: '-2.5%', height: '105%' }}>
          {/* Real drivable route (following roads), drawn on from the house — a
              single maps-blue line, no casing, for clean contrast on the light map. */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={drawn} fill="none" stroke="#1a73e8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>

          <HomeMarker animateIn={!isStill} />
          {PINS.map((p) => {
            // The pin pops in the instant the route reaches its store.
            const shown = drawP >= STOP_FRAC[p.store] - 0.002
            return (
              <div key={p.store} className="absolute" style={{ left: p.left, top: p.top, transform: 'translate(-50%,-50%)' }}>
                <AnimatePresence>
                  {shown && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                    >
                      {/* The Bilka pin pops again the moment its place card
                          opens — ties the card to the map marker. */}
                      <motion.div
                        initial={false}
                        animate={{ scale: p.store === 'bilka' && showBilka ? [1, 1.45, 1] : 1 }}
                        transition={{ duration: 0.55, ease: EASE_QUINT }}
                      >
                        <StoreLogo store={p.store} size={24} shadow />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          <AnimatePresence>{showBilka && <BilkaPopup key="bilka" />}</AnimatePresence>
        </div>
      </div>
      <MapButtons hidden={sheetUp} />

      {/* Bottom sheet — clean white over the map, rows on a soft wash. */}
      <motion.div
        className="absolute inset-x-0 bottom-0 rounded-t-2xl px-3 pt-1.5 pb-2.5"
        style={{ background: '#fff', boxShadow: '0 -10px 26px -14px rgba(22,50,35,0.4)' }}
        initial={{ y: 96 }}
        animate={{ y: sheetUp ? 0 : 96 }}
        transition={{ duration: 0.6, ease: EASE_EXPO }}
      >
        <div className="mx-auto mb-1.5 rounded-full" style={{ width: 32, height: 4, background: 'rgba(22,50,35,0.18)' }} />
        <div className="mb-2 flex items-center justify-between">
          <span className="font-bold" style={{ fontSize: 11, color: FOREST }}>Din indkøbstur</span>
          <span style={{ fontSize: 8.5, color: MUTED }}>{TOTAL_VARER} varer · 3 butikker · 17 min</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {TRIP.map((g) => {
            const s = STORES[g.store]
            // The Bilka row gets a visible tap right before the scene hands
            // off to its shopping list — the link between the two.
            const tapped = g.store === 'bilka' && t >= 6200 && t < 6600
            return (
              <motion.div
                key={g.store}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                style={{ background: '#fdfaf4', border: `1px solid ${HAIRLINE}` }}
                initial={false}
                animate={{ scale: tapped ? [1, 0.95, 1] : 1 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <StoreLogo store={g.store} size={20} />
                <span className="flex-1 font-bold" style={{ fontSize: 10, color: FOREST }}>{s.name}</span>
                <span style={{ fontSize: 8.5, color: MUTED }}>{s.dist}</span>
                <span className="rounded-full px-2 py-0.5 font-bold" style={{ fontSize: 8.5, background: 'rgba(191,230,224,0.5)', color: TEAL }}>{g.count} varer</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

// Scene 6 — inside Bilka's list: the first stop's varer with tick-off
// circles (two get checked) and the store saving. (The store-app CTA is
// shelved — see the memory note.)
const BILKA_LIST: { img?: string; name: string; price: string; checkAt: number }[] = [
  { img: '/basis/smoer.jpg', name: 'Smør, 200 g', price: '15 kr.', checkAt: 2600 },
  { name: 'Koldrøget laks, 400 g', price: '45 kr.', checkAt: 3600 },
  { name: 'Rugbrød, 950 g', price: '14 kr.', checkAt: Infinity },
  { name: 'Æg, 10 stk.', price: '24 kr.', checkAt: Infinity },
  { name: 'Yoghurt, 1 kg', price: '22 kr.', checkAt: Infinity },
  { name: 'Pasta, 500 g', price: '8 kr.', checkAt: Infinity },
  { name: 'Flåede tomater, 400 g', price: '6 kr.', checkAt: Infinity },
  { name: 'Frosne ærter, 750 g', price: '16 kr.', checkAt: Infinity },
]
const BILKA_MS = 5600

function BilkaCheckRow({ row, t, delay }: { row: (typeof BILKA_LIST)[number]; t: number; delay: number }) {
  const checked = t >= row.checkAt
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: EASE_QUINT, delay }}
    >
      {/* Tick-off circle — fills teal with a pop when the item is bought. */}
      <motion.span
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 17, height: 17, background: checked ? TEAL : '#fff', border: checked ? '1.5px solid transparent' : `1.5px solid ${HAIRLINE}` }}
        initial={false}
        animate={{ scale: checked ? [0.7, 1.12, 1] : 1 }}
        transition={{ duration: 0.32, ease: EASE_QUINT }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6.5L4.8 9l5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.span>
      <span
        className="flex-1 min-w-0 truncate font-semibold"
        style={{ fontSize: 10.5, color: FOREST, opacity: checked ? 0.45 : 1, textDecoration: checked ? 'line-through' : 'none', transition: 'opacity 0.3s ease' }}
      >
        {row.name}
      </span>
      <span className="shrink-0 font-bold" style={{ fontSize: 10, color: FOREST, opacity: checked ? 0.45 : 1, transition: 'opacity 0.3s ease' }}>
        {row.price}
      </span>
    </motion.div>
  )
}

function BilkaListScene({ t }: { t: number }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2.5 flex items-center gap-2">
        <StoreLogo store="bilka" size={26} />
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-semibold leading-tight" style={{ color: FOREST }}>Indkøbsliste til Bilka</p>
          <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>Første stop · 8 varer · 350 m</p>
        </div>
      </div>
      <div className="rounded-xl bg-white p-2.5" style={{ border: `1px solid ${HAIRLINE}` }}>
        <div className="flex flex-col gap-1.5">
          {BILKA_LIST.map((r, i) => (
            <BilkaCheckRow key={r.name} row={r} t={t} delay={0.25 + i * 0.07} />
          ))}
        </div>
      </div>
      {/* Store saving — the tag note the other lists use. */}
      <motion.div
        className="mt-2.5 flex items-center justify-center gap-1.5 pt-2 font-semibold"
        style={{ borderTop: `1px solid ${HAIRLINE}`, color: TEAL, fontSize: 10.5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_EXPO, delay: 1.2 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42z" fill={TEAL} />
          <circle cx="6" cy="6" r="1.5" fill="#fff" />
        </svg>
        Du sparer 74 kr. i Bilka
      </motion.div>
      {/* No store-app CTA here (see the shelved Scan & Go note) — the scene
          ends on the saving line and hands off to the app-icon closer. */}
      <div className="mt-auto pb-1">
        <GoBack />
      </div>
    </div>
  )
}

// ── Intro scene — the analog "before": a messy desk (flyers, hand-written list
// + pen, groceries, calculator, coffee) that gets spilled on and wiped away,
// then the Altid Mad app icon appears, is pressed, and launches the app. ───────

// TALL portrait supermarket tilbudsaviser (like the real Netto avis): the
// chain's logo on a coloured banner + a grid of real packshots with bold black
// price stars. The cover page flips UP (top hinge) on a loop, revealing the
// offers page beneath — "pages turning". Eight Danish chains carry the story.
const STAR_CLIP =
  'polygon(50% 0,61% 12%,78% 6%,78% 24%,95% 27%,85% 41%,100% 50%,85% 59%,95% 73%,78% 76%,78% 94%,61% 88%,50% 100%,39% 88%,22% 94%,22% 76%,5% 73%,15% 59%,0 50%,15% 41%,5% 27%,22% 24%,22% 6%,39% 12%)'
// Clean flat grocery illustrations — no low-res photos, no wrong-store branding.
type Groc = 'maelk' | 'kaffe' | 'brod' | 'banan' | 'ost' | 'smor'
function Grocery({ kind }: { kind: Groc }) {
  const S = { width: '100%', height: '100%', display: 'block' } as const
  switch (kind) {
    case 'maelk':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><path d="M22 20l8-8 8 8v30a2 2 0 0 1-2 2H24a2 2 0 0 1-2-2z" fill="#fff" stroke="#d8d3c6" strokeWidth="1.4" /><path d="M22 20l8-8 8 8z" fill="#eaf2f7" stroke="#d8d3c6" strokeWidth="1.4" /><rect x="25" y="30" width="10" height="13" rx="1.5" fill="#2f8fd0" /><rect x="26.5" y="24" width="7" height="3" rx="1.5" fill="#bcd9ec" /></svg>)
    case 'kaffe':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><path d="M18 18h24l-2 34a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2z" fill="#5a3722" /><path d="M18 18h24v6H18z" fill="#3f2415" /><rect x="24" y="30" width="12" height="10" rx="1.5" fill="#e9ddce" /><circle cx="30" cy="24" r="0" /></svg>)
    case 'brod':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><path d="M12 34c0-9 8-15 18-15s18 6 18 15v6a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" fill="#d9a35e" stroke="#b57d3c" strokeWidth="1.4" /><path d="M22 24l3 5M30 22l0 6M38 24l-3 5" stroke="#a86e30" strokeWidth="1.6" strokeLinecap="round" /></svg>)
    case 'banan':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><path d="M16 20c2 16 12 24 28 22-3 4-10 6-17 4C17 43 12 32 14 21z" fill="#f4c020" stroke="#d9a400" strokeWidth="1.4" /><path d="M16 20l-2-3" stroke="#7a5a12" strokeWidth="2.4" strokeLinecap="round" /></svg>)
    case 'ost':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><path d="M12 40l30-14 6 14z" fill="#f6c94a" stroke="#d9a92f" strokeWidth="1.4" /><circle cx="24" cy="36" r="2.2" fill="#e0ad2b" /><circle cx="33" cy="33" r="1.6" fill="#e0ad2b" /><circle cx="30" cy="38" r="1.4" fill="#e0ad2b" /></svg>)
    case 'smor':
      return (<svg viewBox="0 0 60 60" style={S} aria-hidden><rect x="14" y="26" width="32" height="16" rx="2" fill="#fff" stroke="#e2ddce" strokeWidth="1.4" /><rect x="14" y="26" width="32" height="8" rx="2" fill="#f4d873" /><rect x="22" y="29" width="16" height="3" rx="1.5" fill="#e9b93c" /></svg>)
  }
}

// A bold supermarket price star (the iconic black burst, yellow price).
function PriceStar({ price, size = 30, fs = 10 }: { price: string; size?: number; fs?: number }) {
  return (
    <span className="flex items-center justify-center" style={{ width: size, height: size, background: '#111', color: '#ffe000', fontSize: fs, fontWeight: 900, clipPath: STAR_CLIP, lineHeight: 1 }}>{price}</span>
  )
}

type Offer = readonly [Groc, string]
type Chain = { name: string; logo: string; band: string; dark: boolean; cover: readonly Offer[]; inner: readonly Offer[] }
const CHAINS: Record<string, Chain> = {
  bilka: { name: 'Bilka', logo: '/logos/bilka.png', band: '#0a5cad', dark: false, cover: [['kaffe', '39,-'], ['smor', '15,-']], inner: [['ost', '25,-'], ['maelk', '8,-']] },
  netto: { name: 'Netto', logo: '/logos/netto.png', band: '#ffe000', dark: true, cover: [['maelk', '8,-'], ['brod', '12,-']], inner: [['banan', '9,-'], ['ost', '27,-']] },
  foetex: { name: 'Føtex', logo: '/logos/foetex.png', band: '#0a1e3f', dark: false, cover: [['ost', '27,-'], ['kaffe', '42,-']], inner: [['smor', '18,-'], ['brod', '13,-']] },
  rema: { name: 'REMA 1000', logo: '/logos/rema.png', band: '#e30613', dark: false, cover: [['smor', '18,-'], ['banan', '9,-']], inner: [['kaffe', '39,-'], ['maelk', '8,-']] },
  lidl: { name: 'Lidl', logo: '/logos/lidl.png', band: '#0050aa', dark: false, cover: [['brod', '10,-'], ['kaffe', '37,-']], inner: [['banan', '8,-'], ['ost', '24,-']] },
  meny: { name: 'Meny', logo: '/logos/meny.png', band: '#e2001a', dark: false, cover: [['kaffe', '44,-'], ['ost', '29,-']], inner: [['smor', '18,-'], ['brod', '14,-']] },
  kvickly: { name: 'Kvickly', logo: '/logos/kvickly.png', band: '#00519e', dark: false, cover: [['maelk', '9,-'], ['kaffe', '40,-']], inner: [['ost', '26,-'], ['smor', '17,-']] },
  spar: { name: 'Spar', logo: '/logos/spar.png', band: '#009640', dark: false, cover: [['brod', '13,-'], ['maelk', '9,-']], inner: [['kaffe', '41,-'], ['banan', '10,-']] },
}

// One tilbudsavis page: bold brand header + two hero offers with big price stars.
function CatPage({ chain, offers }: { chain: string; offers: readonly Offer[] }) {
  const c = CHAINS[chain]
  return (
    <div className="flex h-full flex-col" style={{ background: '#fff' }}>
      <div className="flex shrink-0 items-center justify-center gap-1.5" style={{ height: 28, background: c.band }}>
        <span className="inline-flex shrink-0 overflow-hidden" style={{ background: '#fff', borderRadius: 4, padding: 1.5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logo} alt="" style={{ width: 18, height: 18, borderRadius: 3, display: 'block' }} />
        </span>
        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.6, color: c.dark ? '#1a1a1a' : '#fff' }}>TILBUDSAVIS</span>
      </div>
      <div className="flex flex-1 flex-col">
        {offers.map(([g, price], i) => (
          <div key={i} className="relative flex flex-1 items-center justify-center" style={{ borderTop: i ? '1px solid #efeae0' : 'none', padding: 6 }}>
            <div style={{ width: '58%', height: '80%' }}><Grocery kind={g} /></div>
            <div className="absolute" style={{ right: 4, top: '50%', transform: 'translateY(-50%)' }}><PriceStar price={price} size={30} fs={9.5} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// A tall tilbudsavis whose cover page flips UP (top hinge) on a loop, revealing
// the offers page beneath — several catalogs together read as pages turning.
function Catalog({ chain, flipDelay }: { chain: string; flipDelay: number }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '7 / 10', perspective: 850, filter: 'drop-shadow(0 12px 18px rgba(40,30,15,0.42))' }}>
      <div className="absolute inset-0 overflow-hidden rounded-md" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <CatPage chain={chain} offers={CHAINS[chain].inner} />
      </div>
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-md"
        style={{ transformOrigin: 'center top', backfaceVisibility: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 -2px 8px -3px rgba(0,0,0,0.28)' }}
        animate={{ rotateX: [0, 0, 160, 160] }}
        transition={{ duration: 3, times: [0, 0.24, 0.66, 1], repeat: Infinity, repeatDelay: 1.1, delay: flipDelay, ease: [0.5, 0, 0.2, 1] }}
      >
        <CatPage chain={chain} offers={CHAINS[chain].cover} />
      </motion.div>
    </div>
  )
}

// A floating supermarket-chain badge — the chain's logo in a white disc.
function FloatIcon({ chain }: { chain: string }) {
  return (
    <div className="flex items-center justify-center rounded-full bg-white" style={{ width: '100%', aspectRatio: '1', boxShadow: '0 7px 15px -5px rgba(40,30,15,0.4)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHAINS[chain].logo} alt="" style={{ width: '74%', height: '74%', borderRadius: '26%', objectFit: 'cover' }} />
    </div>
  )
}

// A real hand-written shopping list on a notepad, with a pen resting across it.
const LIST_ITEMS: { t: string; done: boolean }[] = [
  { t: 'Mælk', done: true },
  { t: 'Æg', done: true },
  { t: 'Kaffe', done: false },
  { t: 'Rugbrød', done: false },
  { t: 'Bananer', done: false },
  { t: 'Kylling', done: false },
  { t: 'Smør', done: false },
]
function ShoppingList() {
  return (
    <div className="relative rounded bg-white px-2.5 pb-2.5 pt-2" style={{ boxShadow: '0 8px 18px -7px rgba(60,40,20,0.35)', fontFamily: '"Segoe Print","Bradley Hand","Comic Sans MS",cursive' }}>
      <p className="mb-1.5 pb-1" style={{ fontSize: 10, fontWeight: 700, color: '#4a4030', borderBottom: '1px solid #ece2cf' }}>Indkøbsliste</p>
      {LIST_ITEMS.map((it) => (
        <div key={it.t} className="mb-[3px] flex items-center gap-1.5">
          <span className="flex items-center justify-center shrink-0" style={{ width: 9, height: 9, borderRadius: 2, border: '1.4px solid #bdb6a7', background: it.done ? TEAL : 'transparent' }}>
            {it.done && (
              <svg width="6" height="6" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.8 9l5-6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </span>
          <span style={{ fontSize: 8.5, color: it.done ? '#b3ab9c' : '#4a4437', textDecoration: it.done ? 'line-through' : 'none' }}>{it.t}</span>
        </div>
      ))}
      {/* pen resting diagonally across the pad */}
      <div className="absolute" style={{ right: -14, bottom: 8, width: 74, height: 9, transform: 'rotate(24deg)', transformOrigin: 'center' }}>
        <div style={{ position: 'absolute', left: 8, top: 0, right: 10, height: 9, borderRadius: 5, background: 'linear-gradient(180deg,#3a8f86,#0f6e68)' }} />
        <div style={{ position: 'absolute', right: 0, top: 1.5, width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '10px solid #d8b46a' }} />
        <div style={{ position: 'absolute', left: 0, top: 1.5, width: 8, height: 6, borderRadius: 3, background: '#0b544f' }} />
      </div>
    </div>
  )
}

// A pocket calculator — its screen reads 312 (the savings number).
function Calculator() {
  return (
    <div className="rounded-lg p-1.5" style={{ background: '#2b3a33', boxShadow: '0 8px 16px -7px rgba(0,0,0,0.45)' }}>
      <div className="mb-1 flex items-center justify-end rounded px-1" style={{ height: 15, background: '#bfe0c2' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#26332b', fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }}>312</span>
      </div>
      <div className="grid grid-cols-4 gap-[3px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ height: 7, borderRadius: 2, background: i % 4 === 3 ? '#e88b2f' : '#48584f' }} />
        ))}
      </div>
    </div>
  )
}

// Intro timeline — ONE progress 0→1 on a single clock, the "Ét hjem" technique
// borrowed from the Altid Hjem mockup: every element is a useTransform(progress);
// the physical desk pieces fly and fade straight INTO the app icon (each fades
// at ~90% of its flight), which appears first, is pressed, then opens the app.
const INTRO_DUR = 8.4 // seconds
const ci = (v: number) => Math.max(0, Math.min(1, v))
const eio = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
const eob = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }
const win = (p: number, a: number, b: number) => ci((p - a) / (b - a))

const I_ICON_AT = 0.56
const I_ICON_W = 0.05
const I_COLLECT: [number, number] = [0.6, 0.86]
const I_PRESS: [number, number] = [0.9, 0.98]
const I_ITEM_FLY = 0.58
const collectLocal = (p: number) => win(p, I_COLLECT[0], I_COLLECT[1])
const itemFlyC = (cp: number, i: number, n: number) => ci((cp - (n <= 1 ? 0 : (i * (1 - I_ITEM_FLY)) / (n - 1))) / I_ITEM_FLY)

type DeskItem = { id: string; ox: number; oy: number; rot: number; w: number; h: number; appear: number; el: React.ReactNode }

// One desk piece: pops in (easeOutBack), sits, then flies to the centre icon
// and dissolves into it. Offsets are from the stage centre, scaled by `k` (the
// stage's width factor, so the whole composition compresses on narrow screens).
function DeskPiece({ item, index, count, k, progress }: { item: DeskItem; index: number; count: number; k: number; progress: MotionValue<number> }) {
  const sizeK = 0.6 + 0.4 * k
  const collect = (p: number) => eio(itemFlyC(collectLocal(p), index, count))
  const appear = (p: number) => win(p, item.appear, item.appear + 0.05)
  const x = useTransform(progress, (p) => item.ox * k * (1 - collect(p)))
  const y = useTransform(progress, (p) => item.oy * k * (1 - collect(p)) - 40 * Math.sin(Math.PI * collect(p)))
  const scale = useTransform(progress, (p) => sizeK * eob(ci(appear(p))) * (1 - 0.82 * collect(p)))
  const rotate = useTransform(progress, (p) => item.rot * (1 - collect(p)))
  const opacity = useTransform(progress, (p) => ci(appear(p) * 4) * (1 - ci((collect(p) - 0.85) / 0.15)))
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
      <motion.div style={{ x, y, scale, rotate, opacity }}>
        {/* gentle idle float, independent of the collect transform above */}
        <motion.div
          style={{ width: item.w, marginLeft: -item.w / 2, marginTop: -item.h / 2 }}
          animate={{ y: [0, -5, 0, 3, 0], rotate: [0, 0.7, 0, -0.7, 0] }}
          transition={{ duration: 5.5 + (index % 4) * 0.6, repeat: Infinity, ease: 'easeInOut', delay: (index % 5) * 0.5 }}
        >
          {item.el}
        </motion.div>
      </motion.div>
    </div>
  )
}

// The Altid Hjem app icon: appears at the centre, receives the imploding pile,
// is pressed, then scales up and fades as the app "opens".
function CenterIcon({ progress }: { progress: MotionValue<number> }) {
  // The icon appears, takes the imploding pile, then is pressed. It does NOT
  // zoom away — the PHONE opening from this same centre is the "launch".
  const scale = useTransform(progress, (p) => eob(win(p, I_ICON_AT, I_ICON_AT + I_ICON_W)) * (1 - 0.12 * Math.sin(Math.PI * win(p, I_PRESS[0], I_PRESS[1]))))
  const opacity = useTransform(progress, (p) => ci(win(p, I_ICON_AT, I_ICON_AT + I_ICON_W * 0.6)))
  const ringScale = useTransform(progress, (p) => 0.6 + 1.7 * win(p, I_PRESS[0], I_PRESS[1]))
  const ringOpacity = useTransform(progress, (p) => { const w = win(p, I_PRESS[0], I_PRESS[1]); return w > 0 && w < 1 ? 0.5 * (1 - w) : 0 })
  return (
    <>
      <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
        <motion.div style={{ x: -40, y: -40, scale, opacity }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-badge.png" alt="Altid Hjem" style={{ width: 80, height: 80, borderRadius: 19, filter: 'drop-shadow(0 16px 30px rgba(15,55,30,0.42))' }} />
        </motion.div>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
        <motion.div style={{ x: -40, y: -40, scale: ringScale, opacity: ringOpacity }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, border: '3px solid rgba(15,110,104,0.55)' }} />
        </motion.div>
      </div>
    </>
  )
}

function IntroScene({ t }: { t: number }) {
  const isStill = t > 1e6
  const progress = useMotionValue(isStill ? 1 : 0)
  useEffect(() => {
    if (isStill) {
      progress.set(1)
      return
    }
    progress.set(0)
    const controls = animate(progress, 1, { duration: INTRO_DUR, ease: 'linear' })
    return () => controls.stop()
  }, [isStill, progress])

  // Measure the (wide) stage and compress the whole composition on narrow
  // screens — offsets ×k, sizes ×(0.6+0.4k). Full spread at ~820px+.
  const ref = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => setK(Math.max(0.42, Math.min(1, el.offsetWidth / 1000)))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 6 tall tilbudsaviser scattered around the centre, floating chain-logo
  // badges drifting in the gaps, and the shopping list anchoring the middle.
  const CW = 112 // catalog width
  const CH = 160 // catalog height (7:10)
  const ICO = 52
  const items: DeskItem[] = [
    { id: 'bilka', ox: -300, oy: -96, rot: -9, w: CW, h: CH, appear: 0.02, el: <Catalog chain="bilka" flipDelay={0} /> },
    { id: 'lidl', ox: 296, oy: -104, rot: 6, w: CW, h: CH, appear: 0.05, el: <Catalog chain="lidl" flipDelay={1.1} /> },
    { id: 'foetex', ox: -380, oy: 78, rot: 7, w: CW, h: CH, appear: 0.08, el: <Catalog chain="foetex" flipDelay={2.2} /> },
    { id: 'meny', ox: 378, oy: 84, rot: -7, w: CW, h: CH, appear: 0.11, el: <Catalog chain="meny" flipDelay={0.6} /> },
    { id: 'netto', ox: -196, oy: 150, rot: -4, w: CW, h: CH, appear: 0.14, el: <Catalog chain="netto" flipDelay={1.6} /> },
    { id: 'rema', ox: 200, oy: 154, rot: 8, w: CW, h: CH, appear: 0.17, el: <Catalog chain="rema" flipDelay={2.7} /> },
    { id: 'list', ox: 2, oy: 12, rot: -2, w: 196, h: 156, appear: 0.19, el: <ShoppingList /> },
    { id: 'f-kvickly', ox: -120, oy: -150, rot: 0, w: ICO, h: ICO, appear: 0.22, el: <FloatIcon chain="kvickly" /> },
    { id: 'f-spar', ox: 126, oy: -158, rot: 0, w: ICO, h: ICO, appear: 0.24, el: <FloatIcon chain="spar" /> },
    { id: 'f-rema', ox: -450, oy: -74, rot: 0, w: ICO - 6, h: ICO - 6, appear: 0.26, el: <FloatIcon chain="rema" /> },
    { id: 'f-lidl', ox: 452, oy: -60, rot: 0, w: ICO - 6, h: ICO - 6, appear: 0.28, el: <FloatIcon chain="lidl" /> },
    { id: 'f-netto', ox: 2, oy: 184, rot: 0, w: ICO, h: ICO, appear: 0.3, el: <FloatIcon chain="netto" /> },
    { id: 'f-meny', ox: -300, oy: 190, rot: 0, w: ICO - 6, h: ICO - 6, appear: 0.32, el: <FloatIcon chain="meny" /> },
    { id: 'f-bilka', ox: 306, oy: 192, rot: 0, w: ICO - 6, h: ICO - 6, appear: 0.34, el: <FloatIcon chain="bilka" /> },
  ]

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <CenterIcon progress={progress} />
      {items.map((it, i) => (
        <DeskPiece key={it.id} item={it} index={i} count={items.length} k={k} progress={progress} />
      ))}
    </div>
  )
}

// ── Section ─────────────────────────────────────────────────────────────────

const SCENES: FlowScene[] = [
  { key: 'indkobsliste', label: 'Dine indkøbslister', render: (t) => <IndkobslisteScene t={t} />, ms: 6300 },
  { key: 'basishunt', label: 'Optimér basisvarer', render: (t) => <BasisHuntScene t={t} />, ms: BASIS_TOTAL_MS },
  { key: 'basisklar', label: 'Indkøbslisten er klar', render: (t) => <BasisListScene t={t} /> },
  { key: 'planlaeg', label: 'Planlægger indkøbstur', render: (t) => <PlanlaegningScene t={t} />, ms: 4400 },
  { key: 'kort', label: 'Din rute', render: (t) => <KortScene t={t} />, ms: 6900 },
  { key: 'bilkaliste', label: 'Første stop: Bilka', render: (t) => <BilkaListScene t={t} />, ms: BILKA_MS },
  { key: 'appikon', label: 'Altid Hjem', render: () => <AppIconClose />, ms: APP_ICON_MS, opener: true },
]

export default function ProblemIndkoebPlus() {
  return (
    <QuestionSection
      mirror
      question="Hvor handler vi billigst ind?"
      answer="Altid Mad finder automatisk de billigste varer på tværs af de butikker, du selv vælger. Du får en færdig indkøbsliste med de laveste priser, uden at du løfter en finger. Til sidst samler Altid Mad det hele til én indkøbstur, butik for butik."
      chips={['Automatisk indkøbsliste', 'Ugens tilbud på et sølvfad']}
      flow={{
        scenes: SCENES,
        sceneMs: SCENE_MS,
        screenTitle: 'Indkøbsliste',
        tab: 'mad',
        still: <KortScene t={Number.MAX_SAFE_INTEGER} />,
      }}
    />
  )
}
