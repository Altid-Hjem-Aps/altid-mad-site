import { describe, expect, it } from 'vitest'
import { fluid } from '@/lib/fluid'

describe('fluid', () => {
  it('equals the design px at the 1920 frame and scales as vw', () => {
    expect(fluid(192)).toBe('clamp(1rem, 10.000vw, 12rem)')
  })

  it('never produces an inverted clamp when px is below the default 16px floor', () => {
    const [min, max] = fluid(14)
      .match(/[\d.]+(?=rem)/g)!
      .map(Number)
    expect(min).toBeLessThanOrEqual(max)
  })
})
