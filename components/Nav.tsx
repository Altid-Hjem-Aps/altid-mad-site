'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import * as amplitude from '@amplitude/analytics-browser'
import { MadLogo } from '@/components/Logo'

const HIDE_THRESHOLD = 80
// The campaign banner is hidden at the top and only slides in once the user
// starts scrolling (≈ a small distance down, so it doesn't flicker).
const BANNER_REVEAL = 8
// Larger delta on touch UAs absorbs the iOS Safari URL-bar collapse jump,
// which can fire ~30px of phantom scrollY without a real user gesture.
const SCROLL_DELTA_DESKTOP = 6
const SCROLL_DELTA_TOUCH = 30

// The CVI navigation on the Mad site: Mad is the active item (marker dot);
// Hjem and Energi link to their live sites; the rest are muted until their
// sites launch and point at the Hjem services section meanwhile.
type LinkTone = 'home' | 'live' | 'soon'
interface NavLink {
  label: string
  href: string
  tone: LinkTone
}
const NAV_LINKS: NavLink[] = [
  { label: 'Hjem', href: 'https://altidhjem.dk', tone: 'live' },
  { label: 'Mad', href: '/', tone: 'home' },
  { label: 'Energi', href: 'https://altidenergi.dk', tone: 'live' },
  { label: 'Forsikring', href: 'https://altidforsikring.dk', tone: 'live' },
  // 'soon' services are muted with a "Kommer snart" sublabel (Figma 26:105)
  // and rendered inactive (no link) until their site launches.
  { label: 'Alarm', href: '#', tone: 'soon' },
  { label: 'Opladning', href: '#', tone: 'soon' },
  { label: 'Mobil', href: '#', tone: 'soon' },
]

interface BannerConfig {
  /** Long lead-in — only shown from md (768px), where it fits on one line. */
  longPrefix: string
  /** Short lead-in for narrow screens. */
  shortPrefix: string
  /** Amplitude source for banner clicks, e.g. 'spiir-banner'. */
  source: string
  /** Banner CTA text — falls back to the default waitlist label. */
  cta?: string
}

interface NavProps {
  /** Show the Spiir campaign banner above the menu (only on /spiir-alternativ). */
  spiirBanner?: boolean
  /** Generic campaign banner above the menu — same look as the Spiir banner. */
  banner?: BannerConfig
}

const SPIIR_BANNER: BannerConfig = {
  longPrefix: 'Spiir er lukket — mist ikke overblikket over dine faste udgifter. ',
  shortPrefix: 'Brugte du Spiir? ',
  source: 'spiir-banner',
}

// Colours from the Mad CVI frame (node 44:1060): CTAs and the active-item dot
// use the Mad mint instead of Hjem's signal green.
const FOREST = '#163223'
const MINT = '#DCD799'
// Deliberately low-contrast: these links are INACTIVE until each service's
// site launches (WCAG 1.4.3 exempts inactive components); they flip to
// 'live'/white when switched on.
const MUTED = '#6f6a61'

export default function Nav({ spiirBanner = false, banner }: NavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastY = useRef(0)

  // Close the burger menu on page navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    lastY.current = window.scrollY
    setScrolled(window.scrollY > BANNER_REVEAL)
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const delta = isTouch ? SCROLL_DELTA_TOUCH : SCROLL_DELTA_DESKTOP

    function onScroll() {
      const y = window.scrollY
      const dy = y - lastY.current

      // The banner reveal must not wait for the delta gate — it has to react
      // to the very first scrolled pixel.
      setScrolled(y > BANNER_REVEAL)

      if (Math.abs(dy) < delta) return

      if (y < HIDE_THRESHOLD) {
        setHidden(false)
      } else if (dy > 0) {
        setHidden(true)
      } else {
        setHidden(false)
      }

      lastY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleCTA(source: string) {
    amplitude.track('Waitlist CTA Clicked', { source })
    // If the page has its own signup form (e.g. /spiir-alternativ's BottomCta,
    // id 'venteliste2'), scroll to it — that preserves the page's signup_source.
    // Otherwise: the homepage hero form (the 'expand-waitlist' listener only
    // exists on '/'; everywhere else navigate home with the #venteliste hash).
    const onPageForm = document.getElementById('venteliste2')
    if (onPageForm) {
      onPageForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (window.location.pathname !== '/') {
      router.push('/#venteliste')
      return
    }
    window.dispatchEvent(new CustomEvent('expand-waitlist'))
  }

  function linkColor(tone: LinkTone, active = false) {
    // The active item matches its marker dot — mint label over the mint dot.
    if (active) return MINT
    if (tone === 'home' || tone === 'live') return '#fff'
    return MUTED
  }

  // Marks the current section for assistive tech: the exact page on the front
  // page, otherwise "current item in this set" (a subpage is inside Mad,
  // but is not itself the Mad link's target).
  const homeAriaCurrent = pathname === '/' ? 'page' : 'true'

  // Right-aligned desktop menu: links + CTA in ONE flex with a shared gap, so
  // the spacing between the words = the spacing between the last link and the
  // CTA button (per Figma). The whole group is right-aligned (logo on the
  // left, generous space in between).
  const desktopMenu = (
    <div className="hidden xl:flex items-center gap-[clamp(56px,5.5vw,105px)]">
      {NAV_LINKS.map(({ label, href, tone }) => {
        // Mad is the current site: its nav item is active on every altidmad.dk page.
        const active = tone === 'home'
        const external = href.startsWith('http')
        return (
          <span key={label} className="relative" style={tone === 'soon' ? { opacity: 0.6 } : undefined}>
            {tone === 'soon' ? (
              // Not a link: "Kommer snart" services are inactive until launch.
              <span className="text-[16px] font-medium whitespace-nowrap cursor-default select-none" style={{ color: linkColor(tone) }}>
                {label}
              </span>
            ) : (
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                aria-current={active ? homeAriaCurrent : undefined}
                className="text-[16px] font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
                style={{ color: linkColor(tone, active) }}
              >
                {label}
              </a>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-[7px] h-[7px] rounded-full"
                style={{ background: MINT }}
              />
            )}
            {tone === 'soon' && (
              <span
                className="absolute left-1/2 -translate-x-1/2 top-full mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em] whitespace-nowrap"
                style={{ color: MUTED }}
              >
                Kommer snart
              </span>
            )}
          </span>
        )
      })}
      <button
        type="button"
        onClick={() => handleCTA('nav')}
        className="inline-flex items-center justify-center font-medium rounded-[20px] transition-opacity hover:opacity-90 whitespace-nowrap text-[16px] leading-tight w-[clamp(200px,15.83vw,304px)] py-[23px]"
        style={{
          background: MINT,
          color: FOREST,
          transform: 'translateZ(0)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        Skriv dig på ventelisten
      </button>
    </div>
  )

  // Burger button — only below the xl breakpoint. Toggles between hamburger and cross.
  const burger = (
    <button
      type="button"
      aria-label={menuOpen ? 'Luk menu' : 'Åbn menu'}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(o => !o)}
      className="xl:hidden shrink-0 flex items-center justify-center w-10 h-10 -mr-1"
      style={{ color: '#fff', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {menuOpen ? (
          <>
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </>
        ) : (
          <>
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17" x2="21" y2="17" />
          </>
        )}
      </svg>
    </button>
  )

  // Drop-down panel with all links — shown while the burger is open (below xl only).
  const mobilePanel = menuOpen && (
    <div
      className="xl:hidden absolute top-full left-0 right-0 overflow-hidden"
      style={{
        background: FOREST,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
        animation: 'slide-down-fade 0.2s ease',
      }}
    >
      <ul className="flex flex-col px-5 sm:px-8 pt-2">
        {NAV_LINKS.map(({ label, href, tone }) => {
          // Mad is the current site: its nav item is active on every altidmad.dk page.
          const active = tone === 'home'
          const external = href.startsWith('http')
          const inner = (
            <>
              {label}
              {active && <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: MINT }} />}
              {tone === 'soon' && (
                <span className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                  Kommer snart
                </span>
              )}
            </>
          )
          const rowClass = 'flex items-center gap-2 py-3.5 text-[17px] font-medium'
          const rowStyle = { color: linkColor(tone, active), borderBottom: '1px solid rgba(255,255,255,0.06)' }
          return (
            <li key={label}>
              {tone === 'soon' ? (
                // Inactive until launch — rendered as plain text, not a link.
                <span className={`${rowClass} cursor-default select-none`} style={{ ...rowStyle, opacity: 0.6 }}>
                  {inner}
                </span>
              ) : (
                <a
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  aria-current={active ? homeAriaCurrent : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={rowClass}
                  style={rowStyle}
                >
                  {inner}
                </a>
              )}
            </li>
          )
        })}
      </ul>
      <div className="px-5 sm:px-8 py-4">
        <button
          type="button"
          onClick={() => { setMenuOpen(false); handleCTA('nav') }}
          className="w-full text-base font-medium py-3.5 rounded-[20px]"
          style={{ background: MINT, color: FOREST, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          Skriv dig på ventelisten
        </button>
      </div>
    </div>
  )

  const navInner = (
    <>
      <a href="/" aria-label="Altid Mad – forside" className="shrink-0">
        <MadLogo className="h-11 w-auto" />
      </a>
      {desktopMenu}
      {burger}
      {mobilePanel}
    </>
  )

  // The Spiir banner is just a fixed configuration of the generic banner.
  const bannerConfig = banner ?? (spiirBanner ? SPIIR_BANNER : null)

  // Without a banner: fixed forest bar that hides on scroll down and returns
  // on scroll up.
  if (!bannerConfig) {
    return (
      <nav
        className="fixed top-0 left-0 right-0 z-[100] px-5 sm:px-8 lg:px-9 py-5"
        style={{
          background: FOREST,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 300ms ease',
          willChange: 'transform',
        }}
      >
        <div className="max-w-[1848px] mx-auto flex items-center justify-between gap-6">
          {navInner}
        </div>
      </nav>
    )
  }

  // With a banner: the nav "morphs" into the slim beige banner strip as soon
  // as the user leaves the top — the full nav slides up behind the banner and
  // the banner slides in. The nav only returns once back at the very top.
  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {/* Campaign banner (~36px — if the height changes, the pages' pt-32 must
          follow). Hidden at the top (maxHeight 0), slides in on scroll and
          stays pinned. Higher z than the nav so the nav can hide behind it.
          The long text only from md (768px) — on narrower screens it would
          wrap to two lines and push content under the page's pt-32. */}
      <div
        className="relative z-10"
        style={{
          overflow: 'hidden',
          maxHeight: scrolled ? '60px' : '0',
          opacity: scrolled ? 1 : 0,
          transition: 'max-height 300ms ease, opacity 300ms ease',
        }}
      >
        <button
          type="button"
          onClick={() => handleCTA(bannerConfig.source)}
          tabIndex={scrolled ? 0 : -1}
          aria-hidden={!scrolled}
          className="block w-full text-center px-4 py-2 text-[12.5px] sm:text-[13px] font-medium"
          style={{
            background: 'var(--cream)',
            color: FOREST,
            borderBottom: '1px solid rgba(26,61,34,0.10)',
            transform: 'translateZ(0)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          <span className="hidden md:inline align-middle">{bannerConfig.longPrefix}</span>
          <span className="md:hidden align-middle">{bannerConfig.shortPrefix}</span>
          <span
            className="inline-block align-middle ml-2 px-3 py-1 rounded-full font-medium"
            style={{ background: MINT, color: FOREST }}
          >
            {(bannerConfig.cta ?? 'Skriv dig på ventelisten').replace(/\s*→\s*$/, '')}
          </span>
        </button>
      </div>
      <nav
        className="relative z-0 px-5 sm:px-8 lg:px-9 py-5"
        style={{
          background: FOREST,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transform: scrolled ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 300ms ease',
          willChange: 'transform',
        }}
      >
        <div className="max-w-[1848px] mx-auto flex items-center justify-between gap-6">
          {navInner}
        </div>
      </nav>
    </div>
  )
}
