'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Defers a below-fold section's JS until the visitor nears it: children only
 * mount (so their dynamic() chunk only downloads) once the wrapper is within
 * `rootMargin` of the viewport. The host passes the SAME placeholder element
 * here (pre-mount) and as the dynamic() `loading` fallback (while the chunk
 * streams) — the height reservation must never lapse in between, or the page
 * shrinks, the next section slides into the observer window and every
 * section cascade-mounts on load. The margin is generous enough that the
 * real section is mounted before it scrolls into view — its own entrance
 * animations still trigger on visibility as before.
 * No IntersectionObserver (jsdom, ancient browsers) → mount immediately.
 */
export default function LazySection({
  children,
  placeholder,
}: {
  children: ReactNode
  placeholder: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '1500px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return <div ref={ref}>{show ? children : placeholder}</div>
}
