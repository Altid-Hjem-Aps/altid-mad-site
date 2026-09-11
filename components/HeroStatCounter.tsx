'use client'

import { useEffect, useState } from 'react'

// The hero's "+36.000 kr." stat counts up on load — the altidhjem.dk counter
// minus the burst: it climbs, lands exactly on 36.000 and stops. An invisible
// sizer keeps the box at its final width so nothing around it shifts while
// the number grows. Reduced motion (and no-JS/SSR) shows the final value.
// 36.000 is the Q3-rapport's 36.248 kr./år (cheapest item per chain) rounded
// down, the same rule the Q2 figure 15.481 → 15.000 followed.
const TARGET = 36000

const fmtKr = (n: number) => {
  const s = String(Math.round(n))
  return s.length > 3 ? `${s.slice(0, -3)}.${s.slice(-3)}` : s
}

export default function HeroStatCounter() {
  const [prog, setProg] = useState(1)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate arm-then-animate reset (same pattern as Savings)
    setProg(0)
    // Hand-rolled ease-out count-up (approximates framer's [0.16,1,0.3,1])
    // so the hero doesn't pull framer-motion into the first-load bundle.
    const DURATION = 1900
    const DELAY = 350
    let raf = 0
    const start = performance.now() + DELAY
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / DURATION, 0), 1)
      setProg(t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Count in steps of 100 but land EXACTLY on the target.
  const val = TARGET - Math.round((TARGET * (1 - prog)) / 100) * 100

  return (
    <span className="relative inline-block">
      <span aria-hidden className="invisible">+{fmtKr(TARGET)} kr.</span>
      <span className="absolute inset-0">+{fmtKr(val)} kr.</span>
    </span>
  )
}
