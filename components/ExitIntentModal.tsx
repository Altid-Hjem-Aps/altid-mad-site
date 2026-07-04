'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import * as amplitude from '@amplitude/analytics-browser'
import { hasJoinedWaitlist, clearWaitlistJoined } from '@/lib/waitlist-joined'

// Exit-intent trigger (pattern from altidenergi.dk): when the cursor leaves
// the viewport through the top edge — headed for the tab bar / URL field —
// offer the waitlist one last time before the visitor is gone.
//
// This component is deliberately TINY: it lives in the root layout, so it
// must not pull framer-motion or the animation stage into every page's
// initial JS. The dialog body (ExitIntentDialog) is code-split and only
// loads when exit intent actually fires (prefetched on idle once armed).
const ExitIntentDialog = dynamic(() => import('@/components/ExitIntentDialog'), { ssr: false })

// Utility pages where a signup pitch would be wrong (account deletion, legal,
// the referral share page). New SEO pages get the dialog automatically.
// Matched on exact path or path segment, so /kontakt-os would NOT be excluded.
const EXCLUDED_PATHS = ['/slet-konto', '/privatlivspolitik', '/inviter', '/kontakt', '/preview']

// Ignore exit intent right after load: a cursor passing through the viewport
// while the page is still settling is navigation noise, not an exit.
const ARM_DELAY_MS = 3000

// Browsers sample the pointer, so a fast move toward the tab bar reports the
// exit several px INSIDE the viewport — a strict 0 misses most real exits.
// relatedTarget is already null (the cursor truly left the document), so this
// only decides whether the exit counts as "through the top".
const EXIT_TOP_ZONE_PX = 50

// localStorage (NOT sessionStorage): the dialog shows at most ONCE per
// browser, ever — not once per tab. A new tab or a later visit won't re-pitch
// someone who already saw it.
const SHOWN_KEY = 'ah-exit-intent-shown'

// localStorage ACCESS throws SecurityError when cookies are blocked or the
// page runs in a sandboxed iframe — and an uncaught throw in a root-layout
// effect unmounts the whole tree. Degrade to "no guard" instead.
function safeLocalGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeLocalSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Guard unavailable — the dialog may show again next page load. Harmless.
  }
}
function safeLocalRemove(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {}
}

// A sideways exit (second monitor, dock, another window) must not burn the
// dialog's single per-browser showing: outside the top zone we require the
// exit to happen in the upper part of the page AND with clear upward motion
// since the last sample — not a 1px drift.
const EXIT_UPPER_FRACTION = 0.4
const EXIT_MIN_UPWARD_PX = 10

export default function ExitIntentModal() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const excluded = EXCLUDED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Client-side navigation must not carry an open dialog onto the next page
  // (Back can land on an excluded page with the scroll lock still held).
  const prevPathname = useRef(pathname)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      setOpen(false)
    }
  }, [pathname])

  // QA/testing escape hatch: ?exit-intent=reset clears both guards so the
  // popup can be re-tested without DevTools (console paste is blocked by
  // default in Chrome/Safari). Runs ONCE per page load — NOT on every effect
  // re-run — so closing the dialog can't re-clear the "shown" flag and let it
  // reappear. It only CLEARS state; opening still requires a real exit gesture.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('exit-intent') === 'reset') {
      safeLocalRemove(SHOWN_KEY)
      clearWaitlistJoined()
    }
  }, [])

  useEffect(() => {
    if (excluded || open) return
    // Mouse-driven devices only — there is no exit intent to read on touch.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    // Already shown once on this browser (persistent) — never pitch again.
    if (safeLocalGet(SHOWN_KEY)) return
    // Already on the waitlist (this browser signed up, or the API said "du
    // er allerede skrevet op") — never pitch the popup again.
    if (hasJoinedWaitlist()) return

    let armed = false
    const armTimer = setTimeout(() => {
      armed = true
      // The visitor qualifies (desktop, not shown yet) — warm the dialog
      // chunk off the critical path so the letter intro is instant on fire.
      const warm = () => { import('@/components/ExitIntentDialog') }
      if ('requestIdleCallback' in window) window.requestIdleCallback(warm)
      else setTimeout(warm, 2000)
    }, ARM_DELAY_MS)

    // Mouse positions are SAMPLED: a fast flick toward the tab bar can report
    // its last position hundreds of px into the page, so the top zone alone
    // misses real exits. Track the previous sample and also accept any exit
    // where the cursor was travelling upward. Starts at -Infinity so that
    // BEFORE any sample exists only the top zone can trigger.
    let lastMoveY = -Infinity
    function onMouseMove(e: MouseEvent) {
      lastMoveY = e.clientY
    }

    function maybeFire(e: MouseEvent) {
      if (!armed) return
      // Exit through the top zone, OR a fast upward flick whose sampled exit
      // point landed deeper in the page (upper 40% + clear upward motion) —
      // both read as "headed for the tab bar / URL field". Anything else
      // (sideways exits, downward drift) must not spend the one showing.
      const inTopZone = e.clientY <= EXIT_TOP_ZONE_PX
      const upwardFlick =
        e.clientY < window.innerHeight * EXIT_UPPER_FRACTION &&
        lastMoveY - e.clientY > EXIT_MIN_UPWARD_PX
      if (!inTopZone && !upwardFlick) return
      // In fullscreen (e.g. the founder video) the dialog would render
      // invisibly behind the fullscreen element and burn its one showing.
      if (document.fullscreenElement) return
      if (safeLocalGet(SHOWN_KEY)) return
      // Re-check at FIRE time, not just at listener setup: signing up via the
      // hero form sets the joined flag without re-rendering this component,
      // and the popup must never pitch the waitlist to someone already on it.
      if (hasJoinedWaitlist()) return
      safeLocalSet(SHOWN_KEY, '1')
      teardown()
      setOpen(true)
      amplitude.track('Exit Intent Shown', { path: window.location.pathname })
    }

    // relatedTarget is null when the cursor truly leaves the document.
    function onMouseOut(e: MouseEvent) {
      if (e.relatedTarget) return
      maybeFire(e)
    }
    // Safari is unreliable with document mouseout on window exit — mouseleave
    // on the root element covers it (fires only when leaving the document, so
    // no relatedTarget check needed). Firing both is safe: the SHOWN_KEY
    // check makes the second call a no-op.
    function onMouseLeave(e: MouseEvent) {
      maybeFire(e)
    }

    function teardown() {
      document.removeEventListener('mouseout', onMouseOut)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mousemove', onMouseMove)
    }

    document.addEventListener('mouseout', onMouseOut)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      clearTimeout(armTimer)
      teardown()
    }
  }, [excluded, open])

  if (!open) return null

  return <ExitIntentDialog onClose={() => setOpen(false)} />
}
