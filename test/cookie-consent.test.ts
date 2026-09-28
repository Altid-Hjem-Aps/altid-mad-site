import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COOKIE_CONSENT_CHANGED,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_MAX_AGE_MS,
  readCookieChoice,
  saveCookieChoice,
} from '@/lib/cookie-consent'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('cookie choice storage', () => {
  it('has no answer until the visitor chooses', () => {
    expect(readCookieChoice()).toBeNull()
  })

  it('remembers each answer', () => {
    saveCookieChoice('all', 1000)
    expect(readCookieChoice(1000)).toBe('all')
    saveCookieChoice('necessary', 2000)
    expect(readCookieChoice(2000)).toBe('necessary')
  })

  it('forgets the answer after 12 months, so the banner asks again', () => {
    saveCookieChoice('all', 0)
    expect(readCookieChoice(COOKIE_CONSENT_MAX_AGE_MS)).toBe('all')
    expect(readCookieChoice(COOKIE_CONSENT_MAX_AGE_MS + 1)).toBeNull()
  })

  it('treats a malformed stored value as no answer', () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'yes')
    expect(readCookieChoice()).toBeNull()
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ choice: 'maybe', at: 1 }))
    expect(readCookieChoice()).toBeNull()
  })

  it('treats blocked storage as no answer, never as consent', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(readCookieChoice()).toBeNull()
  })

  it('announces the answer even when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const heard = vi.fn()
    window.addEventListener(COOKIE_CONSENT_CHANGED, heard)
    saveCookieChoice('necessary')
    window.removeEventListener(COOKIE_CONSENT_CHANGED, heard)
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toBe('necessary')
  })
})
