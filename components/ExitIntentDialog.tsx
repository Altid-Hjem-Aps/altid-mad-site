'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'
import * as amplitude from '@amplitude/analytics-browser'
import WaitlistForm from '@/components/WaitlistForm'
import { SAVINGS_DISCLAIMER } from '@/lib/copy'
import PhoneShell from '@/components/iphone/PhoneShell'
import MealPlanScreen from '@/components/iphone/MealPlanScreen'

// The exit-intent dialog BODY — code-split from the trigger
// (ExitIntentModal.tsx) so framer-motion stays out of every page's initial
// JS. Two columns on desktop: headline + bare form left, the Mad meal-plan
// phone (the hero mockup's foreground screen) right.

const FOREST = '#163223'

export default function ExitIntentDialog({ onClose }: { onClose: () => void }) {
  const prefersReducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  // Signed up inside the dialog — closing afterwards is not a dismissal.
  const converted = useRef(false)
  // Overlay clicks only close when the press STARTED on the overlay too —
  // a text-selection drag that ends outside the panel must not nuke the form.
  const pressOnOverlay = useRef(false)

  // Capture where focus was when the dialog was delivered.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null
  }, [])

  // Entrance on one 0→1 clock: the panel scales and slides in. (The Hjem
  // site delivers the dialog in an animated letter; Mad has no envelope
  // scenery, so the panel enters on its own.)
  const intro = useMotionValue(0)
  const panelScale = useTransform(intro, [0, 1], [0.86, 1])
  const panelY = useTransform(intro, [0, 1], [46, 0])
  const panelOpacity = useTransform(intro, [0, 0.55], [0, 1])

  useEffect(() => {
    if (prefersReducedMotion) {
      intro.set(1)
      return
    }
    intro.set(0)
    const anim = animate(intro, 1, { duration: 0.55, ease: 'easeOut' })
    return () => anim.stop()
  }, [prefersReducedMotion, intro])

  const close = useCallback(() => {
    if (!converted.current) {
      amplitude.track('Exit Intent Dismissed', { path: window.location.pathname })
    }
    onClose()
    restoreFocusRef.current?.focus?.()
  }, [onClose])

  // Scroll lock + focus while open.
  useEffect(() => {
    // body{overflow:hidden} alone does NOT reach the viewport here: CSS only
    // propagates body overflow when html's overflow is `visible`, and
    // globals.css sets html{overflow-x:clip} (iOS rubber-band guard) — so the
    // page kept scrolling behind the dialog. Lock the html element itself.
    const prevHtmlOverflowY = document.documentElement.style.overflowY
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyPaddingRight = document.body.style.paddingRight
    // Classic (non-overlay) scrollbars — Windows/Linux desktops, exactly the
    // mouse-driven visitors this dialog targets — disappear when the lock
    // lands, reflowing the page ~15px wider behind the overlay. Compensate
    // with padding so the background doesn't jump on open/close.
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarGap > 0) document.body.style.paddingRight = `${scrollbarGap}px`
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflow = 'hidden'
    // Focus the panel, not the close button — autofocusing a button draws
    // the browser's focus ring on open; Tab still reaches the close first.
    panelRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // On Windows, Escape closing an open native <select> can also reach
        // the document — that must not close the dialog mid-survey.
        if ((e.target as HTMLElement | null)?.tagName === 'SELECT') return
        close()
        return
      }
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      // Focus fell outside the panel (e.g. the focused submit button was
      // removed on a view swap) — pull the trap shut instead of letting Tab
      // wander into the page behind the overlay.
      if (!active || !panelRef.current.contains(active)) {
        e.preventDefault()
        first.focus()
        return
      }
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflowY
      document.body.style.overflow = prevBodyOverflow
      document.body.style.paddingRight = prevBodyPaddingRight
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [close])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(10, 25, 16, 0.55)', animation: 'modal-fade-in 0.25s ease' }}
      onPointerDown={e => { pressOnOverlay.current = e.target === e.currentTarget }}
      onClick={e => {
        if (e.target === e.currentTarget && pressOnOverlay.current) close()
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-heading"
        tabIndex={-1}
        className="relative w-full max-w-[560px] lg:max-w-[1120px] max-h-[92vh] overflow-y-auto rounded-[24px] outline-none"
        style={{ background: FOREST, opacity: panelOpacity, scale: panelScale, y: panelY }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Luk"
          onClick={close}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-11 h-11 rounded-full transition-opacity hover:opacity-70 text-white lg:text-[#163223]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_560px]">
          <div className="p-6 pt-12 sm:p-10 sm:pt-12">
            <h2 id="exit-intent-heading" className="text-[clamp(24px,3vw,32px)] font-normal leading-[1.15] text-white mb-4 max-lg:pr-10">
              Gå ikke glip af besparelser på madbudgettet
            </h2>
            <p className="text-[16px] font-semibold text-white mb-2">
              Gør som over 1.000 andre danskere
            </p>
            <p className="text-[16px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Skriv dig på ventelisten til Altid Mad, og få madplan, tilbud og indkøbsliste samlet ét sted – så familien sparer penge på dagligvarer.
            </p>

            <WaitlistForm
              variant="dark"
              source="altid-mad-exit"
              embedded
              onSignup={() => {
                converted.current = true
                amplitude.track('Exit Intent Converted', { path: window.location.pathname })
              }}
            />
          </div>

          {/* The Mad meal-plan phone (the hero mockup's foreground screen) on
              a soft paper-white (deliberately between the homepage's pure
              white and the cream tokens — pure white glares next to the
              forest panel). Desktop only: below lg the column would push the
              form below the fold. */}
          <div aria-hidden className="hidden lg:block relative overflow-hidden pointer-events-none" style={{ background: '#fbf9f3', borderLeft: '1px solid rgba(255,255,255,0.07)', minHeight: 620 }}>
            {/* Same legal fine print as the WhatIs section — rendered BEFORE
                the stage so the phone paints over it, and small enough for
                two lines. Panel and stage keep their exact size/placement. */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 text-center">
              <p className="text-[8px] font-normal leading-relaxed" style={{ color: '#6f6a61' }}>
                {SAVINGS_DISCLAIMER}
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <PhoneShell hovered softShadow>
                <MealPlanScreen hovered />
              </PhoneShell>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
