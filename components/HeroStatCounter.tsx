'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

// The hero's "+15.000 kr." stat counts up on load — the altidhjem.dk counter
// minus the burst: it climbs, lands exactly on 15.000 and stops. An invisible
// sizer keeps the box at its final width so nothing around it shifts while
// the number grows. Reduced motion (and no-JS/SSR) shows the final value.
const TARGET = 15000

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
    const controls = animate(0, 1, {
      duration: 1.9,
      delay: 0.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setProg(v),
    })
    return () => controls.stop()
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
