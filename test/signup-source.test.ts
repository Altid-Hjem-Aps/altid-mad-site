import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SIGNUP_SOURCE, normalizeSignupSource, SIGNUP_SOURCES } from '@/lib/signup-source'

// Allowlisten er forsvarslinjen mellem klientens frie `source`-felt og
// DB/Resend/Amplitude — ukendte værdier må aldrig slippe igennem.
describe('normalizeSignupSource', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts every registered source verbatim', () => {
    for (const source of SIGNUP_SOURCES) {
      expect(normalizeSignupSource(source)).toBe(source)
    }
  })

  it('pins every source a shipped component emits', () => {
    // Iterating SIGNUP_SOURCES alone would stay green if an entry were
    // removed while a live component still sends it (silently becoming
    // the default in the data). Pin them explicitly: the site default
    // (WaitlistForm) and the exit-intent dialog's source.
    for (const source of ['altid-mad', 'altid-mad-exit']) {
      expect(SIGNUP_SOURCES).toContain(source)
    }
  })

  it('falls back to forside for unknown strings and logs a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeSignupSource('evil-source')).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(warn).toHaveBeenCalledOnce()
  })

  it('falls back silently when the field is simply absent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeSignupSource(undefined)).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(normalizeSignupSource(null)).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(normalizeSignupSource('')).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(warn).not.toHaveBeenCalled()
  })

  it('never lets non-string payloads through (objects, numbers, arrays)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeSignupSource({ hack: true })).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(normalizeSignupSource(42)).toBe(DEFAULT_SIGNUP_SOURCE)
    expect(normalizeSignupSource(['spiir-alternativ'])).toBe(DEFAULT_SIGNUP_SOURCE)
  })
})
