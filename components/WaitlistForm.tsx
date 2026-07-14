'use client'

import { useState, useEffect } from 'react'
import * as amplitude from '@amplitude/analytics-browser'
import { DEFAULT_SIGNUP_SOURCE } from '@/lib/signup-source'
import { DUPLICATE_SIGNUP_HEADING, SIGNUP_CONSENT_MAD, SIGNUP_CONSENT_GROUP, SIGNUP_LAUNCH_NOTICE, CONSENT_VERSION } from '@/lib/copy'
import { markWaitlistJoined } from '@/lib/waitlist-joined'
import { BUTTON_PRIMARY, FINE_PRINT } from '@/lib/typography'

type View = 'form' | 'questions' | 'success'

const DK_ELECTRICITY_PROVIDERS = [
  'Aal El-Net',
  'Andel Energi',
  '★ Altid Energi',
  'AURA Energi',
  'Clever',
  'Energi Fyn',
  'Energi Viborg',
  'EWII',
  'Forsyning Helsingør',
  'Gasel',
  'Goenergi',
  'Jysk Energi',
  'Modstrøm',
  'Natur-Energi',
  'Nord Energi',
  'Norlys',
  'NRGi',
  'OK',
  'Ravdex',
  'Scanenergi',
  'SEAS-NVE',
  'SE (Stofa Energi)',
  'Strøm Fyn',
  'TREFOR El',
  'Velkommen',
  'Verdo',
  'Vindstød',
  'Ørsted',
  'Andet',
]

// When the API sends a longer duplicate message than the shared heading
// (e.g. "already covered via Altid Hjem"), it becomes the card body under
// the heading instead.
const DUPLICATE_HEADING = DUPLICATE_SIGNUP_HEADING

// The launch notice plus two active, non-pre-checked, OPTIONAL marketing-consent
// checkboxes. Signing up is itself the specific markedsføringslov §10 consent to
// the one Altid Mad launch mail (SIGNUP_LAUNCH_NOTICE states that purpose above
// the button), so the boxes below are purely for ONGOING marketing and are never
// a condition for joining. Adapts colour to the dark/light form variant.
function ConsentCheckboxes({ dark, mad, group, onMad, onGroup }: {
  dark: boolean
  mad: boolean
  group: boolean
  onMad: (v: boolean) => void
  onGroup: (v: boolean) => void
}) {
  const color = dark ? 'rgba(255,255,255,0.7)' : '#6f6a61'
  const noticeColor = dark ? 'rgba(255,255,255,0.6)' : '#6f6a61'
  const boxStyle: React.CSSProperties = { width: 17, height: 17, marginTop: 2, flexShrink: 0, accentColor: dark ? '#DCD799' : '#3E6924', cursor: 'pointer' }
  return (
    <div className="flex flex-col gap-2.5 mt-4 mb-1 text-left">
      <p className={FINE_PRINT} style={{ color: noticeColor, lineHeight: 1.45 }}>{SIGNUP_LAUNCH_NOTICE}</p>
      <label className={`flex gap-2.5 items-start ${FINE_PRINT} cursor-pointer`} style={{ color, lineHeight: 1.45 }}>
        <input type="checkbox" checked={mad} onChange={e => onMad(e.target.checked)} style={boxStyle} />
        <span>{SIGNUP_CONSENT_MAD}</span>
      </label>
      <label className={`flex gap-2.5 items-start ${FINE_PRINT} cursor-pointer`} style={{ color, lineHeight: 1.45 }}>
        <input type="checkbox" checked={group} onChange={e => onGroup(e.target.checked)} style={boxStyle} />
        <span>{SIGNUP_CONSENT_GROUP}</span>
      </label>
    </div>
  )
}

interface Props {
  variant?: 'light' | 'dark'
  id?: string
  defaultView?: View
  /** Where the signup came from (e.g. 'spiir-alternativ') — stored on the signup. */
  source?: string
  /** Dark variant only: render bare fields without the card chrome and own
   *  heading — for dialogs that supply their own headline (ExitIntentDialog). */
  embedded?: boolean
  /** Fires once when step 1 succeeds (the signup exists) — hosts use it to
   *  distinguish converted closes from dismissals. */
  onSignup?: () => void
  /** Dark variant only: submit-button colour. Defaults to Hjem's signal green
   *  (BottomCta is Hjem-branded); the Mad exit dialog passes the Mad mint. */
  ctaColor?: string
}

export default function WaitlistForm({ variant = 'light', id, defaultView = 'form', source = DEFAULT_SIGNUP_SOURCE, embedded = false, onSignup, ctaColor = '#90ff7c' }: Props) {
  const [view, setView] = useState<View>(defaultView)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupId, setSignupId] = useState('')
  const [surveyToken, setSurveyToken] = useState('')
  const [referredBy, setReferredBy] = useState('')
  // Marketing consent (Forbrugerombudsmanden): both start UNCHECKED and are
  // fully optional — consent may never be a condition for joining the waitlist
  // (GDPR art. 7(4), koblingsforbud). Ticking Mad opts into Altid Mad marketing;
  // the group box is a separate opt-in for the other brands.
  const [consentMad, setConsentMad] = useState(false)
  const [consentGroup, setConsentGroup] = useState(false)
  // Set on a 409 where the API could recover their referral link — renders the
  // share card (skipping the survey step; they already answered it once).
  const [duplicate, setDuplicate] = useState<{ body?: string; inviteUrl: string } | null>(null)

  // Capture referral code from the URL (?ref=CODE) once on mount
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setReferredBy(ref.trim())
  }, [])

  const [phone, setPhone] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [age, setAge] = useState('')
  const [household, setHousehold] = useState('')
  const [why, setWhy] = useState('')
  const [electricity, setElectricity] = useState('')

  const isDark = variant === 'dark'

  // Listen for nav CTA click to auto-expand
  useEffect(() => {
    if (isDark) return
    function handleExpand() {
      setExpanded(true)
      setTimeout(() => {
        document.getElementById('name-input-hero')?.focus()
      }, 60)
    }
    window.addEventListener('expand-waitlist', handleExpand)
    return () => window.removeEventListener('expand-waitlist', handleExpand)
  }, [isDark])

  // Nav CTA on subpages navigates to /#venteliste — auto-expand on arrival.
  useEffect(() => {
    if (isDark) return
    if (window.location.hash === '#venteliste') {
      setExpanded(true)
      setTimeout(() => {
        document.getElementById('name-input-hero')?.focus()
      }, 60)
    }
  }, [isDark])

  async function submitStep1() {
    // Only name + email are required. Mobile is optional (data minimisation —
    // the waitlist only needs an email to give notice at launch) and marketing
    // consent is optional too (it may never be a condition for joining).
    if (!email || !name) return
    setLoading(true)
    setError('')
    // A rejected fetch (offline, DNS) must not leave the button stuck on
    // "Sender..." — surface an error and let the user retry.
    let res: Response
    try {
      res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone, name, email, referredBy, source, step: 1,
          // Documented consent (wording version + the two active choices) so
          // the exact permission each person gave is provable. The backend
          // must persist these and gate marketing sends on them.
          consent: { version: CONSENT_VERSION, mad: consentMad, group: consentGroup },
        }),
      })
    } catch {
      setLoading(false)
      setError('Noget gik galt. Tjek din forbindelse og prøv igen.')
      amplitude.track('Waitlist Step 1 Failed', { error: 'network', status: 0 })
      return
    }
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      // 409 = this person is already on the list — that's a confirmed
      // signup for popup-suppression purposes too.
      if (res.status === 409) markWaitlistJoined()
      amplitude.track('Waitlist Step 1 Failed', { error: data.error ?? 'unknown', status: res.status })
      // Duplicate WITH a known referral link: show the share card instead of a
      // dead-end error, so they can still invite friends and move up the queue.
      if (res.status === 409 && data.inviteUrl) {
        setDuplicate({
          body: data.error && data.error !== DUPLICATE_HEADING ? data.error : undefined,
          inviteUrl: data.inviteUrl,
        })
        return
      }
      setError(data.error ?? 'Noget gik galt. Prøv igen.')
      return
    }
    markWaitlistJoined()
    amplitude.track('Waitlist Step 1 Submitted', { signup_source: source })
    onSignup?.()
    setSignupId(data.id)
    setSurveyToken(data.surveyToken ?? '')
    setView('questions')
  }

  async function submitStep2() {
    setLoading(true)
    // Best-effort: the signup itself already succeeded in step 1, so a failed
    // step-2 save still lands on the success screen — but don't let a rejected
    // fetch throw, and record the failure instead of a fake submit event.
    let ok = false
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signupId, surveyToken, age, household, why, electricity, step: 2 }),
      })
      ok = res.ok
    } catch {
      ok = false
    }
    setLoading(false)
    if (ok) {
      amplitude.track('Waitlist Step 2 Submitted', {
        has_age: !!age,
        has_household: !!household,
        has_why: !!why,
        electricity_provider: electricity || null,
      })
    } else {
      amplitude.track('Waitlist Step 2 Failed')
    }
    setView('success')
  }

  // ─── Dark variant (BottomCta) ──────────────────────────────────────────────

  const darkInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    outline: 'none',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    color: 'white',
    fontFamily: 'var(--font-onest)',
  }

  const darkLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
    color: 'rgba(255,255,255,0.62)',
  }

  // Card chrome shared by both dark form views — embedded hosts (the
  // exit-intent dialog) strip it and supply their own framing.
  const darkCardClass = embedded ? undefined : 'rounded-[20px] p-6 sm:p-10'
  const darkCardStyle = embedded ? undefined : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

  if (isDark) {
    if (duplicate) return <SuccessCard bare={embedded} heading={DUPLICATE_HEADING} body={duplicate.body} inviteUrl={duplicate.inviteUrl} />
    if (view === 'success') return <SuccessCard bare={embedded} inviteUrl={signupId ? `https://altidmad.dk/?ref=${signupId}` : undefined} />

    if (view === 'questions') {
      return (
        <form id={id} onSubmit={e => { e.preventDefault(); submitStep2() }} className={darkCardClass} style={darkCardStyle}>
          <h2 className="text-xl font-normal mb-1 text-white">Fortæl os lidt om dig.</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Svar på 4 korte spørgsmål.</p>
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label style={darkLabelStyle}>Alder</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Din alder" style={darkInputStyle} className="placeholder:text-white/40" />
            </div>
            <div>
              <label style={darkLabelStyle}>Antal personer i husstanden</label>
              <select value={household} onChange={e => setHousehold(e.target.value)} style={{ ...darkInputStyle, cursor: 'pointer' }} className="appearance-none">
                <option value="" disabled>Vælg antal</option>
                {['1','2','3','4','5+'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={darkLabelStyle}>Hvorfor har du skrevet dig op?</label>
              <input value={why} onChange={e => setWhy(e.target.value)} placeholder="Fortæl os kort..." style={darkInputStyle} className="placeholder:text-white/40" />
            </div>
            <div>
              <label style={darkLabelStyle}>Hvilket elselskab har du i dag?</label>
              <select value={electricity} onChange={e => setElectricity(e.target.value)} style={{ ...darkInputStyle, cursor: 'pointer' }} className="appearance-none">
                <option value="" disabled>Vælg elselskab</option>
                {DK_ELECTRICITY_PROVIDERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <button type="submit" disabled={loading} className={`w-full disabled:opacity-60 ${BUTTON_PRIMARY}`} style={{ background: ctaColor, color: '#163223' }}>
              {loading ? 'Sender...' : 'Indsend'}
            </button>
            <button type="button" onClick={() => { amplitude.track('Waitlist Step 2 Skipped'); setView('success') }} className="w-full py-3 rounded-[20px] text-sm font-normal border" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
              Ikke nu
            </button>
          </div>
          <p className={`${FINE_PRINT} text-center mt-3.5`} style={{ color: 'rgba(255,255,255,0.35)' }}>
            Dine svar bruges kun til at forbedre Altid Hjem.
          </p>
        </form>
      )
    }

    return (
      <form id={id} onSubmit={e => { e.preventDefault(); submitStep1() }} className={darkCardClass} style={darkCardStyle}>
        {!embedded && (
          <>
            <h2 className="text-2xl font-normal text-white mb-1">Skriv dig gratis på ventelisten</h2>
            {/* Same colour as the uppercase field labels (darkLabelStyle). */}
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.62)' }}>Få tidlig adgang, når appen lanceres.</p>
          </>
        )}
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label style={darkLabelStyle}>Navn</label>
            <input name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Dit fulde navn" style={darkInputStyle} className="placeholder:text-white/40" />
          </div>
          <div>
            <label style={darkLabelStyle}>E-mail</label>
            <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@email.dk" style={darkInputStyle} className="placeholder:text-white/40" />
          </div>
          <div>
            <label style={darkLabelStyle}>Mobil (valgfrit)</label>
            <div className="flex overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14 }}>
              <span className="flex items-center px-3 text-sm font-medium border-r select-none shrink-0" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.04)' }}>+45</span>
              <input type="tel" name="tel" autoComplete="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="12 34 56 78" className="flex-1 placeholder:text-white/40" style={{ padding: '14px 12px', fontSize: 15, outline: 'none', background: 'transparent', color: 'white', fontFamily: 'var(--font-onest)' }} />
            </div>
          </div>
        </div>
        {/* Consent sits just above the button, and only appears once the visitor
            has started filling in the form (name, email or phone). */}
        {(name || email || phone) && <ConsentCheckboxes dark mad={consentMad} group={consentGroup} onMad={setConsentMad} onGroup={setConsentGroup} />}
        {error && <p className="text-sm mb-3 mt-2 text-center" style={{ color: '#ff8080' }}>{error}</p>}
        <button type="submit" disabled={loading} className={`w-full mt-2 disabled:opacity-60 ${BUTTON_PRIMARY}`} style={{ background: ctaColor, color: '#163223' }}>
          {loading ? 'Sender...' : 'Skriv mig på ventelisten'}
        </button>
        <p className={`${FINE_PRINT} text-center mt-3`} style={{ color: 'rgba(255,255,255,0.62)' }}>
          Gratis. Ingen spam. <span style={{ color: '#fff' }}>Altid.</span>
        </p>
        <p className={`${FINE_PRINT} text-center mt-1`} style={{ color: 'rgba(255,255,255,0.62)' }}>
          <a href="/privatlivspolitik" className="underline underline-offset-2 hover:opacity-50 transition-opacity">Privatlivspolitik</a>
        </p>
      </form>
    )
  }

  // ─── Light variant (Hero) ─────────────────────────────────────────────────

  if (duplicate) return <SuccessCard variant="cream" heading={DUPLICATE_HEADING} body={duplicate.body} inviteUrl={duplicate.inviteUrl} />
  if (view === 'success') return <SuccessCard variant="cream" inviteUrl={signupId ? `https://altidmad.dk/?ref=${signupId}` : undefined} />

  if (view === 'questions') {
    return (
      <form id={id} onSubmit={e => { e.preventDefault(); submitStep2() }}>
        <div className="rounded-[20px] p-2 mb-3" style={{ background: '#f1ece0', border: '1px solid #e6e2d8' }}>
          <h3 className="font-normal text-xl px-3 pt-3 mb-1" style={{ color: '#163223' }}>Fortæl os lidt om dig.</h3>
          <p className="text-sm px-3 pb-2" style={{ color: '#6f6a61' }}>4 korte spørgsmål.</p>
          <div className="flex flex-col gap-1.5 px-1 pb-1">
            {[
              { label: 'Alder', el: <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Din alder" className="w-full px-4 rounded-xl text-[15px] outline-none placeholder:text-[#999] bg-white" style={{ height: 50, fontFamily: 'var(--font-onest)', color: 'var(--text-dark)' }} /> },
              { label: 'Antal personer i husstanden', el: <select value={household} onChange={e => setHousehold(e.target.value)} className="w-full px-4 rounded-xl text-[15px] outline-none appearance-none bg-white cursor-pointer" style={{ height: 50, fontFamily: 'var(--font-onest)', color: household ? 'var(--text-dark)' : '#999' }}><option value="" disabled>Vælg antal</option>{['1','2','3','4','5+'].map(o => <option key={o}>{o}</option>)}</select> },
              { label: 'Hvorfor har du skrevet dig op?', el: <input value={why} onChange={e => setWhy(e.target.value)} placeholder="Fortæl os kort..." className="w-full px-4 rounded-xl text-[15px] outline-none placeholder:text-[#999] bg-white" style={{ height: 50, fontFamily: 'var(--font-onest)', color: 'var(--text-dark)' }} /> },
              { label: 'Hvilket elselskab har du i dag?', el: <select value={electricity} onChange={e => setElectricity(e.target.value)} className="w-full px-4 rounded-xl text-[15px] outline-none appearance-none bg-white cursor-pointer" style={{ height: 50, fontFamily: 'var(--font-onest)', color: electricity ? 'var(--text-dark)' : '#999' }}><option value="" disabled>Vælg elselskab</option>{DK_ELECTRICITY_PROVIDERS.map(o => <option key={o}>{o}</option>)}</select> },
            ].map(({ label, el }) => (
              <div key={label} className="pb-0.5">
                <label className="block text-[11px] font-normal tracking-[0.08em] uppercase mb-1 px-1" style={{ color: '#6f6a61' }}>{label}</label>
                {el}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={loading} className={`w-full disabled:opacity-60 ${BUTTON_PRIMARY}`} style={{ background: '#DCD799', color: '#163223' }}>
            {loading ? 'Sender...' : 'Indsend'}
          </button>
          <button type="button" onClick={() => { amplitude.track('Waitlist Step 2 Skipped'); setView('success') }} className="w-full py-3 rounded-[20px] text-sm font-normal" style={{ color: '#6f6a61', border: '1px solid #e6e2d8' }}>
            Ikke nu
          </button>
        </div>
      </form>
    )
  }

  return (
    <form id={id} onSubmit={e => { e.preventDefault(); submitStep1() }}>

      {/* Beat 1: container grows (button drops). Beat 2: fields fade+slide in. */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          {/* Entire form card invisible during beat 1 — no clipping visible */}
          <div
            className="rounded-[20px] p-2 mb-2"
            style={{
              background: '#f1ece0',
              border: '1px solid #e6e2d8',
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'translateY(0)' : 'translateY(-6px)',
              transition: expanded
                ? 'opacity 0.2s ease 0.3s, transform 0.25s ease 0.28s'
                : 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                id="name-input-hero"
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dit fulde navn"
                className="w-full rounded-xl placeholder:text-[#bbb]"
                style={{ height: 52, padding: '0 16px', fontSize: 15, outline: 'none', background: 'white', color: 'var(--text-dark)', fontFamily: 'var(--font-onest)' }}
              />
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <input
                  id="email-input-hero"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Din e-mailadresse"
                  className="flex-1 placeholder:text-[#bbb]"
                  style={{ height: 56, padding: '0 16px', fontSize: 16, outline: 'none', background: 'transparent', color: 'var(--text-dark)', fontFamily: 'var(--font-onest)' }}
                />
              </div>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'white' }}>
                <span
                  className="flex items-center justify-center pl-4 pr-3 text-sm font-semibold select-none border-r shrink-0"
                  style={{ height: 52, color: 'var(--text-mid)', borderColor: 'rgba(62,105,36,0.1)', background: 'var(--cream)' }}
                >
                  +45
                </span>
                <input
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="Dit mobilnummer (valgfrit)"
                  className="flex-1 placeholder:text-[#bbb]"
                  style={{ height: 52, padding: '0 16px', fontSize: 15, outline: 'none', background: 'transparent', color: 'var(--text-dark)', fontFamily: 'var(--font-onest)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Single button — always visible, drops down as fields expand above it */}
      {/* Consent sits just above the button, and only appears once the visitor
          has started filling in the form (name, email or phone). */}
      {(name || email || phone) && <ConsentCheckboxes dark={false} mad={consentMad} group={consentGroup} onMad={setConsentMad} onGroup={setConsentGroup} />}
      {error && <p className="text-sm mb-2 mt-2 text-center" style={{ color: '#c6000f' }}>{error}</p>}
      <button
        type={expanded ? 'submit' : 'button'}
        onClick={!expanded ? () => { amplitude.track('Waitlist CTA Clicked', { source: 'hero' }); setExpanded(true); setTimeout(() => document.getElementById('name-input-hero')?.focus(), 60) } : undefined}
        disabled={expanded && loading}
        className={`${BUTTON_PRIMARY} disabled:opacity-60 ${
          expanded ? 'w-full px-5' : 'w-full px-5 lg:w-auto lg:px-[42px]'
        }`}
        style={{
          background: '#DCD799',
          color: '#163223',
          animation: !expanded ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        }}
      >
        {expanded ? (loading ? 'Sender...' : 'Skriv mig på ventelisten →') : (
          <>
            <span className="lg:hidden">Skriv dig gratis på ventelisten</span>
            <span className="hidden lg:inline">Skriv dig på ventelisten og få ro på madbudgettet</span>
          </>
        )}
      </button>

      {/* Microcopy — only shown once the form is expanded (collapsed text removed). */}
      {expanded && (
        <p className={`${FINE_PRINT} text-center mt-2.5`} style={{ color: '#6f6a61' }}>
          Gratis. Ingen spam. <span style={{ color: 'var(--forest)' }}>Altid.</span>
        </p>
      )}
      {expanded && (
        <p className={`${FINE_PRINT} text-center mt-1`} style={{ color: '#8a857c' }}>
          <a href="/privatlivspolitik" className="underline underline-offset-2 hover:opacity-50 transition-opacity">Privatlivspolitik</a>
        </p>
      )}

    </form>
  )
}

export function SuccessCard({ inviteUrl, variant = 'dark', bare = false, heading = 'Tak. Du er med.', body = 'Vi giver dig besked, så snart Altid Hjem åbner dørene.' }: { inviteUrl?: string; variant?: 'dark' | 'cream'; bare?: boolean; heading?: string; body?: string }) {
  const [copied, setCopied] = useState(false)
  // On the light (cream) hero the confirmation renders as a solid forest-green
  // card so the white text still works — otherwise the original translucent
  // variant for the dark sections. `bare` (embedded dialogs) drops the card
  // chrome so the confirmation matches the bare fields it replaces.
  const cardStyle: React.CSSProperties | undefined = bare
    ? undefined
    : variant === 'cream'
      ? { background: '#163223', border: '1px solid rgba(255,255,255,0.08)' }
      : { background: 'rgba(168,224,99,0.08)', border: '1px solid rgba(168,224,99,0.2)' }
  return (
    <div className={bare ? undefined : 'rounded-[20px] p-8 sm:p-10'} style={cardStyle}>
      <h3 className="text-3xl font-normal mb-3 text-white">{heading}</h3>
      <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {body}
      </p>

      {inviteUrl && (
        <div className="mt-7 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[15px] font-medium text-white mb-1">Vil du rykke frem i køen? 🚀</p>
          <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Del dit personlige link. Jo flere venner der tilmelder sig, jo hurtigere får du adgang.
          </p>
          <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <input
              readOnly
              value={inviteUrl}
              onFocus={e => e.currentTarget.select()}
              className="flex-1 bg-transparent text-sm px-3 py-2 outline-none truncate"
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-onest)' }}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(inviteUrl).catch(() => {})
                amplitude.track('Referral Link Copied')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium shrink-0"
              style={{ background: 'var(--sage)', color: 'var(--forest)' }}
            >
              {copied ? 'Kopieret ✓' : 'Kopiér'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a
          href="https://altidenergi.dk/galleri/?_gl=1*g0q8vi*_up*MQ..*_ga*NTIwMDkxNzQ4LjE3Nzc0Njc5MzQ.*_ga_ZESHL2Q0DX*czE3Nzc0Njc5MzMkbzEkZzAkdDE3Nzc0Njc5MzMkajYwJGwwJGgxNTQwNDUyNTc1"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Altid Energi hjælper danske familier med at forstå deres elregning. Tjek din egen, mens du venter.
          </p>
          <span
            className="inline-block mt-3 text-sm font-medium group-hover:opacity-70 transition-opacity"
            style={{ color: '#73d0e7', borderBottom: '1px solid rgba(115,208,231,0.4)', paddingBottom: 1 }}
          >
            altidenergi.dk
          </span>
          <div className="mt-5">
            <img src="/altidenergi-logo-stamp.svg" alt="Altid Energi" style={{ height: 26, width: 'auto', opacity: 0.95 }} />
          </div>
        </a>
      </div>
    </div>
  )
}
