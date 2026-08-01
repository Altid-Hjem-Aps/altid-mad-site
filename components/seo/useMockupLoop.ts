'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Shared animation plumbing for the page mockups: respects
 * prefers-reduced-motion and runs the loop only while the card is in the
 * viewport — `running` flips false when it scrolls away so the timeout
 * loops in the consumers pause instead of re-rendering off-screen forever.
 * A fallback timer starts the loop only when IntersectionObserver itself
 * is unavailable.
 */
export function useMockupStart() {
  const [running, setRunning] = useState(false)
  const [reduced, setReduced] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mql.matches)
    sync()
    // Safari <14 only has the deprecated addListener API.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync)
      return () => mql.removeEventListener('change', sync)
    }
    mql.addListener(sync)
    return () => mql.removeListener(sync)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (typeof IntersectionObserver !== 'function') {
      const fallback = setTimeout(() => setRunning(true), 1500)
      return () => clearTimeout(fallback)
    }
    const io = new IntersectionObserver(
      (entries) => setRunning(entries.some(e => e.isIntersecting)),
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return { ref, running, reduced }
}
