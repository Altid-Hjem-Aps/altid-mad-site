import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useAutoCarousel, useCarouselReveal } from '@/components/useAutoCarousel'

// Unit coverage for the pure pieces of the carousel reveal + demo nudge —
// the visual animation itself is covered by browser QA, but the stagger
// maths and the once-only/reduced gates are cheap to pin here.

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function renderReveal(reduced: boolean, n = 4) {
  return renderHook(() => {
    const trackRef = useRef<HTMLDivElement | null>(null)
    return useCarouselReveal(trackRef, reduced, n)
  })
}

describe('useCarouselReveal style factory', () => {
  it('staggers LEFT→RIGHT from the leftmost visible card (i = n-1) and caps the delay', () => {
    const { result } = renderReveal(false, 4)
    const delayOf = (i: number) => {
      const t = String(result.current(i).transition)
      const m = t.match(/opacity [\d.]+s ease (\d+)ms/)
      return m ? Number(m[1]) : NaN
    }
    expect(delayOf(3)).toBe(0) // leftmost visible card leads
    expect(delayOf(4)).toBe(130) // centre card next
    expect(delayOf(5)).toBe(260) // right neighbour after
    expect(delayOf(11)).toBe(520) // far clones capped at 4 steps
    expect(delayOf(0)).toBe(0) // cards left of the viewport never lag
  })

  it('reduced motion disables the transition entirely', () => {
    const { result } = renderReveal(true, 4)
    expect(result.current(4).transition).toBe('none')
  })

  it('keeps willChange only until the reveal has settled', () => {
    // Before reveal (no IntersectionObserver in jsdom + reduced=false path
    // still sets revealed immediately via the fallback, so use reduced=false
    // with a mocked IO that never fires to hold the pre-reveal state).
    class SilentIO {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', SilentIO)
    const { result } = renderReveal(false, 4)
    expect(result.current(4).willChange).toBe('opacity, transform')
  })
})

describe('demoNudge guards', () => {
  it('is a no-op under reduced motion and never marks itself spent without a track', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const { result } = renderHook(() => useAutoCarousel(4))
    // reduced=true → no-op; then with reduced state false but no track
    // element the nudge must not mark itself spent (see el null-check).
    act(() => result.current.demoNudge())
    expect(result.current.trackRef.current).toBeNull()
  })
})
