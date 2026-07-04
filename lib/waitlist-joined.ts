// Once this browser has a confirmed waitlist signup (or the API answered
// "already signed up"), the exit-intent popup stops pitching. Tiny module on
// purpose: the popup trigger lives in the root layout and must not drag
// component code into every page's bundle for one flag.
//
// localStorage ACCESS throws with blocked cookies / sandboxed iframes; a
// missing flag only means one extra popup, so every failure degrades to no-op.
const WAITLIST_JOINED_KEY = 'ah-waitlist-joined'

export function markWaitlistJoined() {
  try {
    window.localStorage.setItem(WAITLIST_JOINED_KEY, '1')
  } catch {}
}

export function hasJoinedWaitlist(): boolean {
  try {
    return window.localStorage.getItem(WAITLIST_JOINED_KEY) === '1'
  } catch {
    return false
  }
}

/** QA reset only — forget that this browser joined. */
export function clearWaitlistJoined() {
  try {
    window.localStorage.removeItem(WAITLIST_JOINED_KEY)
  } catch {}
}
