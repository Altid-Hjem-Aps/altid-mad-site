'use client'

import { useSyncExternalStore } from 'react'

function subscribeReducedMotion(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

/** The phones show their rest state and move only by hand. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

function subscribeTabHidden(listener: () => void) {
  document.addEventListener('visibilitychange', listener)
  return () => document.removeEventListener('visibilitychange', listener)
}

/** Also true for a page opened in a background tab. */
export function useTabHidden() {
  return useSyncExternalStore(subscribeTabHidden, () => document.hidden, () => false)
}
