// The visitor's cookie choice. Statistics (Amplitude) only run after an
// explicit "Accepter alle"; everything else on the site is strictly necessary
// and needs no consent (see the Cookies section of /privatlivspolitik).
//
// Stored in localStorage, which is itself necessary storage: it only remembers
// the answer. The answer expires after 12 months, then the banner asks again.
//
// localStorage ACCESS throws with blocked cookies / sandboxed iframes. Reading
// then returns "no answer", so the banner shows and statistics stay off: the
// failure mode is never "tracking without consent".
export const COOKIE_CONSENT_KEY = 'ah-cookie-consent'
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

// Fired on window when the answer changes or the footer asks to reopen the
// banner. Keeps the banner, the footer link and the analytics loader decoupled.
export const COOKIE_CONSENT_CHANGED = 'ah-cookie-consent-changed'
export const OPEN_COOKIE_SETTINGS = 'ah-open-cookie-settings'

export type CookieChoice = 'all' | 'necessary'

type Stored = { choice: CookieChoice; at: number }

export function readCookieChoice(now: number = Date.now()): CookieChoice | null {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isStored(parsed)) return null
  if (now - parsed.at > COOKIE_CONSENT_MAX_AGE_MS) return null
  return parsed.choice
}

export function saveCookieChoice(choice: CookieChoice, now: number = Date.now()) {
  const value: Stored = { choice, at: now }
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value))
  } catch {
    // Not remembered: the banner asks again next page load. Statistics still
    // follow this page's answer via the event below.
  }
  window.dispatchEvent(new CustomEvent<CookieChoice>(COOKIE_CONSENT_CHANGED, { detail: choice }))
}

// For useSyncExternalStore: re-read the stored answer whenever it changes.
export function subscribeCookieChoice(onChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_CHANGED, onChange)
  return () => window.removeEventListener(COOKIE_CONSENT_CHANGED, onChange)
}
export const hasCookieChoice = () => readCookieChoice() !== null

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))
}

function isStored(v: unknown): v is Stored {
  if (typeof v !== 'object' || v === null) return false
  const choice = (v as { choice?: unknown }).choice
  const at = (v as { at?: unknown }).at
  return (choice === 'all' || choice === 'necessary') && typeof at === 'number'
}
