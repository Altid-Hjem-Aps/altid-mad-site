'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  COOKIE_CONSENT_CHANGED,
  OPEN_COOKIE_SETTINGS,
  hasCookieChoice,
  saveCookieChoice,
  subscribeCookieChoice,
  type CookieChoice,
} from '@/lib/cookie-consent'
import { startAnalytics, stopAnalytics } from '@/lib/analytics'

// Both answers get the same button, size and colour on purpose: Datatilsynet
// requires saying no to be as easy as saying yes, so neither may be nudged.
const BUTTON =
  'flex-1 rounded-[14px] px-5 py-3 text-[15px] font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sage)]'
const BUTTON_STYLE: React.CSSProperties = { background: 'var(--sage)', color: 'var(--forest-dark)' }

// The stored answer is external state (localStorage), read through
// useSyncExternalStore so the server render and hydration agree: the server
// snapshot counts as answered, so the banner renders nothing there.
const answeredOnServer = () => true

export default function CookieBanner() {
  const hasAnswer = useSyncExternalStore(subscribeCookieChoice, hasCookieChoice, answeredOnServer)
  const [reopened, setReopened] = useState(false)
  const open = !hasAnswer || reopened

  useEffect(() => {
    const reopen = () => setReopened(true)
    const apply = (e: Event) => {
      const choice = (e as CustomEvent<CookieChoice>).detail
      if (choice === 'all') startAnalytics()
      else stopAnalytics()
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen)
    window.addEventListener(COOKIE_CONSENT_CHANGED, apply)
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen)
      window.removeEventListener(COOKIE_CONSENT_CHANGED, apply)
    }
  }, [])

  if (!open) return null

  const choose = (choice: CookieChoice) => {
    setReopened(false)
    saveCookieChoice(choice)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[560px] rounded-[20px] p-5 sm:p-6 shadow-2xl"
      style={{ background: 'var(--forest-dark)', color: '#ffffff' }}
    >
      <h2 id="cookie-banner-title" className="text-[17px] font-medium">
        Må vi bruge cookies?
      </h2>
      <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.8)' }}>
        Vi vil gerne bruge cookies til statistik, så vi kan se, hvordan siden bliver brugt, og gøre den bedre. Det sker
        kun, hvis du siger ja. De cookies, siden skal bruge for at virke, bruger vi altid. Du kan ændre dit valg under
        Cookieindstillinger nederst på siden. Læs mere i vores{' '}
        <Link href="/privatlivspolitik#cookies" className="underline underline-offset-2" style={{ color: '#ffffff' }}>
          privatlivspolitik
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={BUTTON} style={BUTTON_STYLE} onClick={() => choose('necessary')}>
          Kun nødvendige
        </button>
        <button type="button" className={BUTTON} style={BUTTON_STYLE} onClick={() => choose('all')}>
          Accepter alle
        </button>
      </div>
    </div>
  )
}
