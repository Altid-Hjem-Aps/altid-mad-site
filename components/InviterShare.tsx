'use client'

import * as amplitude from '@amplitude/analytics-browser'
import { useEffect, useState } from 'react'
import { buildShareLinks } from '@/lib/share-links'

// Mad-flavoured port of the Hjem site's InviterShare: same copy/native/channel
// share mechanics and the same Amplitude funnel events, but the personal link
// points at altidmad.dk and the CTA colours follow the Mad CVI (mint, not
// signal green).

// Brand glyphs (simple-icons) + two generic Material icons (sms, email).
const ICON_PATHS: Record<string, string> = {
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  messenger:
    'M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z',
  facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  sms: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  email:
    'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
}

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'messenger', label: 'Messenger' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'sms', label: 'SMS' },
  { key: 'email', label: 'Email' },
] as const

function Glyph({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

export default function InviterShare({ code }: { code: string }) {
  const inviteUrl = code
    ? `https://altidmad.dk/?ref=${encodeURIComponent(code)}`
    : 'https://altidmad.dk/'
  const links = buildShareLinks(inviteUrl)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      // Fallback for contexts where the async Clipboard API is unavailable
      // (older browsers, non-secure origins): select a temp field and copy.
      const ta = document.createElement('textarea')
      ta.value = inviteUrl
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    // Same event the signup success card fires, so both copy actions feed the
    // referral funnel in Amplitude.
    amplitude.track('Referral Link Copied', { source: 'inviter-page', channel: 'copy' })
    // Stays in the "Kopieret!" confirmed state — a one-time action.
    setCopied(true)
  }

  // Every share counts toward the same funnel as a copy (Referral Link Copied),
  // plus a per-channel Referral Link Shared event so the platform mix can be
  // segmented and optimised later.
  function trackShare(channel: string) {
    amplitude.track('Referral Link Copied', { source: 'inviter-page', channel })
    amplitude.track('Referral Link Shared', { source: 'inviter-page', channel })
  }

  async function nativeShare() {
    trackShare('native')
    // AbortError is thrown when the user dismisses the sheet; that is not a failure.
    try {
      await navigator.share({
        title: 'Altid Mad',
        text: 'Kom med på Altid Mad. Tilmeld dig med mit link:',
        url: inviteUrl,
      })
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') throw err
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 style={{ color: '#163223' }} className="text-3xl font-normal leading-tight sm:text-4xl">
        Inviter dine venner
      </h1>
      <p style={{ color: '#6f6a61' }} className="mt-3 text-base leading-relaxed">
        Jo flere der tilmelder sig med dit link, jo hurtigere kommer du frem i køen.
      </p>

      {/* Personal link + copy — matches the email's link block */}
      <div
        className="mt-8 rounded-2xl p-5"
        style={{ background: '#fdfaf4', border: `1.5px solid ${copied ? 'transparent' : '#bfe6e0'}` }}
      >
        <p
          style={{ color: '#163223', letterSpacing: '0.1em' }}
          className="text-[11px] font-semibold uppercase"
        >
          Dit personlige link
        </p>
        <p style={{ color: '#163223' }} className="mt-1.5 break-all text-sm font-semibold">
          {inviteUrl}
        </p>
        <button
          type="button"
          onClick={copyLink}
          disabled={copied}
          style={copied ? { color: '#163223' } : { background: '#bfe6e0', color: '#163223' }}
          className={`mt-4 w-full rounded-[20px] py-3.5 text-center text-base font-medium transition-colors ${copied ? 'cursor-default' : 'hover:opacity-90'}`}
        >
          {copied ? 'Kopieret!' : 'Kopiér link'}
        </button>
      </div>

      {/* Native share (mobile only) */}
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          style={{ borderColor: '#163223', color: '#163223' }}
          className="mt-3 w-full rounded-[20px] border py-3.5 text-center text-base font-medium transition-colors hover:bg-[#163223]/5"
        >
          Del dit link
        </button>
      )}

      {/* Per-channel buttons — mint-washed cards per the Mad frame */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {CHANNELS.map((c) => (
          <a
            key={c.key}
            href={links[c.key]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(c.key)}
            style={{ background: 'rgba(191,230,224,0.35)', color: '#163223' }}
            className="flex flex-col items-center gap-2 rounded-2xl py-4 transition-opacity hover:opacity-80"
          >
            <Glyph name={c.key} />
            <span className="text-xs font-medium">{c.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
