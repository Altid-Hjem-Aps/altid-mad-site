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

describe('duplicateSignupMessage', () => {
  it('keeps the plain message for signups made on the Mad site', async () => {
    const { duplicateSignupMessage } = await import('@/lib/copy')
    expect(duplicateSignupMessage('altid-mad')).toBe('Du er allerede skrevet op!')
    expect(duplicateSignupMessage('altid-mad-exit')).toBe('Du er allerede skrevet op!')
  })

  it('tells Hjem signups they are on the shared list, incl. Altid Mad', async () => {
    const { duplicateSignupMessage } = await import('@/lib/copy')
    const covered = 'Du er allerede skrevet op til Altid Hjem og dermed også til Altid Mad.'
    expect(duplicateSignupMessage('forside')).toBe(covered)
    expect(duplicateSignupMessage('exit-intent')).toBe(covered)
  })

  it('treats unknown history (no mirror row / null source) as a Hjem signup', async () => {
    const { duplicateSignupMessage } = await import('@/lib/copy')
    const covered = 'Du er allerede skrevet op til Altid Hjem og dermed også til Altid Mad.'
    expect(duplicateSignupMessage(null)).toBe(covered)
    expect(duplicateSignupMessage(undefined)).toBe(covered)
  })
})
