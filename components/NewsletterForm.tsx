'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  NEWSLETTER_BUTTON,
  NEWSLETTER_BUTTON_PENDING,
  NEWSLETTER_CONSENT,
  NEWSLETTER_EMAIL_LABEL,
  NEWSLETTER_ERROR_CONSENT,
  NEWSLETTER_ERROR_EMAIL,
  NEWSLETTER_ERROR_NETWORK,
  NEWSLETTER_ERROR_RATE_LIMITED,
  NEWSLETTER_ERROR_RETRY,
  NEWSLETTER_HEADING,
  NEWSLETTER_SUCCESS,
} from '@/lib/copy'
import { FINE_PRINT } from '@/lib/typography'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Sits under the store badges on the dark BottomCta, deliberately quieter than
// them. Validates on submit, keeps what was typed on every failure, and is
// replaced by the success line, which takes focus so a screen reader lands on it.
export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [consentError, setConsentError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)
  const successRef = useRef<HTMLParagraphElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  // The button was disabled while the request ran, which drops focus to the
  // page. Give it back after a failure, so the retry is one key press away.
  useEffect(() => {
    if (status) buttonRef.current?.focus()
  }, [status])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setConsentError('')
    setStatus('')
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(NEWSLETTER_ERROR_EMAIL)
      emailRef.current?.focus()
      return
    }
    if (!consent) {
      setConsentError(NEWSLETTER_ERROR_CONSENT)
      consentRef.current?.focus()
      return
    }
    setPending(true)
    let res: Response
    try {
      res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'newsletter', scope: 'mad', email: email.trim(), consent: true }),
      })
    } catch {
      setPending(false)
      setStatus(NEWSLETTER_ERROR_NETWORK)
      return
    }
    setPending(false)
    if (res.ok) {
      setDone(true)
      return
    }
    setStatus(res.status === 429 ? NEWSLETTER_ERROR_RATE_LIMITED : NEWSLETTER_ERROR_RETRY)
  }

  if (done) {
    return (
      <p ref={successRef} tabIndex={-1} className="text-[17px] text-white outline-none">
        {NEWSLETTER_SUCCESS}
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <h3 className="text-[17px] font-normal text-white">{NEWSLETTER_HEADING}</h3>
      <label htmlFor={`${id}-email`} className="block mt-4 mb-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
        {NEWSLETTER_EMAIL_LABEL}
      </label>
      <input
        ref={emailRef}
        id={`${id}-email`}
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={emailError ? true : undefined}
        aria-describedby={emailError ? `${id}-email-error` : undefined}
        className="block w-full h-12 rounded-[14px] px-4 text-[16px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.5)', fontFamily: 'var(--font-onest)' }}
      />
      {emailError && (
        <p id={`${id}-email-error`} className="mt-2 text-[14px]" style={{ color: '#ffc2c2' }}>
          {emailError}
        </p>
      )}
      <label className="mt-3 flex items-start gap-3 py-1.5 cursor-pointer">
        <input
          ref={consentRef}
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={consentError ? true : undefined}
          aria-describedby={consentError ? `${id}-consent-error` : undefined}
          className="mt-[3px] w-[18px] h-[18px] shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ accentColor: '#DCD799' }}
        />
        <span className="text-[14px] leading-[1.45]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          {NEWSLETTER_CONSENT}
        </span>
      </label>
      {consentError && (
        <p id={`${id}-consent-error`} className="mt-1 text-[14px]" style={{ color: '#ffc2c2' }}>
          {consentError}
        </p>
      )}
      <button
        ref={buttonRef}
        type="submit"
        disabled={pending}
        className="mt-3 w-full sm:w-auto h-12 rounded-[14px] px-8 text-[16px] font-medium text-white disabled:opacity-60 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.55)' }}
      >
        {pending ? NEWSLETTER_BUTTON_PENDING : NEWSLETTER_BUTTON}
      </button>
      <p role="status" aria-live="polite" className={status ? 'mt-2 text-[14px]' : 'sr-only'} style={status ? { color: '#ffc2c2' } : undefined}>
        {status}
      </p>
      <p className={`${FINE_PRINT} mt-3`} style={{ color: 'rgba(255,255,255,0.62)' }}>
        <a href="/privatlivspolitik" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
          Privatlivspolitik
        </a>
      </p>
    </form>
  )
}
