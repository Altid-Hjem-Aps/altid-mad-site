'use client'

import { useEffect, useRef, useState } from 'react'
import { H2, EYEBROW } from '@/lib/typography'

// FAQ section: cream left column with a scrolling accordion
// next to a full-bleed family photo. The green bar on the left IS the scrollbar
// (native bar hidden; a custom track+thumb is positioned from scroll metrics) —
// you scroll through the questions, and expanding an answer folds out INSIDE the
// scroll area, so the section keeps the photo-driven height and never resizes.
// The green app-icon badge straddles the seam up into the Trust section above.

type Item = { q: string; a: string }

const ITEMS: Item[] = [
  {
    q: 'Hvad er Altid Hjem?',
    a: 'Altid Hjem er appen, hvor du finder Altid Mad. Den samler hjemmets faste udgifter ét sted – mad, strøm, mobil, forsikring, opladning og alarm. Du får ét overblik, ét login og én samlet regning. Altid.',
  },
  {
    q: 'Er Altid Mad en del af Altid Hjem?',
    a: 'Ja. Altid Mad er en af tjenesterne i Altid Hjem-appen. Når du skriver dig på ventelisten til Altid Mad, bliver du automatisk en del af Altid Hjem – med samme login og samme app.',
  },
  {
    q: 'Hvor meget sparer jeg med Altid Mad?',
    a: 'Baseret på data fra Spari forventer vi, at mange danske familier sparer mellem 10 og 20 % på dagligvarer – typisk 7.500-15.000 kr. om året, afhængigt af husstandens størrelse og indkøbsvaner.',
  },
  {
    q: 'Er det gratis at skrive sig på ventelisten?',
    a: 'Ja, det er helt gratis og uforpligtende. Du får besked, når appen er klar, og du kan til enhver tid afmelde dig igen.',
  },
]

const MOBILE_VISIBLE = 3

export default function Faq() {
  // The first answer ends up open, but it STARTS closed and folds out when
  // the section scrolls into view — seeing the accordion move once teaches
  // the mechanic. Reduced motion (and no-IO browsers) get it open instantly.
  const [open, setOpen] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  // "Untouched" must mean the VISITOR hasn't interacted — open===null alone
  // can't tell "never touched" from "opened and deliberately closed again",
  // and the auto-open must never fight an explicit close.
  const touchedRef = useRef(false)
  useEffect(() => {
    const openFirstIfUntouched = () => {
      if (touchedRef.current) return
      setOpen(o => (o === null ? 0 : o))
    }
    if (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      openFirstIfUntouched()
      return
    }
    const el = sectionRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      // Hold the closed state for a beat AFTER the section is comfortably in
      // view, so the visitor sees it closed first and then the fold-out reads
      // as an event — never override a question they opened themselves.
      timer = setTimeout(openFirstIfUntouched, 650)
      // 0.35, not higher: intersectionRatio can never reach 0.5 for a section
      // taller than ~2× the viewport (short landscape screens, high zoom) —
      // the fold-out would simply never fire there.
    }, { threshold: 0.35 })
    io.observe(el)
    return () => {
      io.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])
  // Mobile shows the first questions + a "Vis flere" pill (altidenergi.dk
  // pattern) instead of the desktop scroll area.
  const [showAll, setShowAll] = useState(false)

  // Custom always-visible green scrollbar (native macOS bars auto-hide). The
  // thumb is sized/positioned from the scroll metrics; when nothing overflows
  // it fills the track — reading as the static green accent line.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ top: 0, height: 1 })
  const updateThumb = () => {
    const el = scrollRef.current
    if (!el) return
    setThumb({ top: el.scrollTop / el.scrollHeight, height: el.clientHeight / el.scrollHeight })
  }
  useEffect(() => {
    updateThumb()
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateThumb)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative" style={{ background: '#fdfaf4' }}>
      {/* App-icon badge straddling the seam to the Trust section above */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-badge.png"
        alt=""
        aria-hidden
        className="hidden lg:block absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ width: 'clamp(68px,5.5vw,105px)', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — the inner wrapper is absolutely positioned on lg so its
            content NEVER contributes to the row height; the photo alone sets
            the section size and expanding answers only scroll, never resize. */}
        <div className="relative">
          <div className="lg:absolute lg:inset-0 flex flex-col px-[clamp(28px,4.6vw,92px)] pt-[clamp(52px,5.4vw,88px)] pb-[clamp(40px,4.5vw,72px)]">
            <p className={`${EYEBROW} mb-5`} style={{ color: '#6f6a61' }}>
              FAQ
            </p>
            <h2 className={`${H2} mb-8`} style={{ color: '#163223' }}>
              Ofte stillede spørgsmål
            </h2>

            {/* Scroll area with the custom green scrollbar on the LEFT edge */}
            <div className="relative flex-1 min-h-0">
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: 'rgba(22,50,35,0.1)' }} aria-hidden>
                <div
                  className="absolute left-0 w-full rounded-full"
                  style={{ background: '#90ff7c', top: `${thumb.top * 100}%`, height: `${thumb.height * 100}%` }}
                />
              </div>
              <div ref={scrollRef} onScroll={updateThumb} className="faq-scroll h-full lg:overflow-y-auto">
                <div className="lg:pl-[clamp(18px,1.8vw,32px)]">
                {ITEMS.map((item, i) => {
                  const isOpen = open === i
                  return (
                    <div
                      key={item.q}
                      className={i >= MOBILE_VISIBLE && !showAll ? 'hidden lg:block' : undefined}
                      style={{ borderBottom: '1px solid rgba(22,50,35,0.18)' }}
                    >
                      <button
                        type="button"
                        onClick={() => { touchedRef.current = true; setOpen(isOpen ? null : i) }}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${i}`}
                        className="w-full flex items-center justify-between gap-6 text-left py-[clamp(18px,1.6vw,26px)]"
                      >
                        <span className="font-normal text-[clamp(16px,1.1vw,19px)]" style={{ color: '#163223' }}>
                          {item.q}
                        </span>
                        <span
                          className="shrink-0 flex items-center justify-center rounded-full transition-transform duration-500 motion-reduce:transition-none"
                          style={{
                            width: 34,
                            height: 34,
                            background: '#90ff7c',
                            transform: isOpen ? 'rotate(45deg)' : 'none',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M7 1v12M1 7h12" stroke="#163223" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                      {/* Answer — grid-rows trick animates height without measuring.
                          aria-hidden keeps collapsed answers out of the a11y tree
                          (visually hidden by 0fr, but still "rendered" to AT). */}
                      <div
                        id={`faq-answer-${i}`}
                        aria-hidden={!isOpen}
                        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none"
                        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                      >
                        <div className="overflow-hidden">
                          <p className="font-normal text-[15px] leading-[1.8] pb-6 pr-10" style={{ color: '#6f6a61', maxWidth: 560 }}>
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            </div>

            {/* Mobile: expand/collapse the remaining questions */}
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="lg:hidden mt-7 mx-auto flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium"
              style={{ background: '#90ff7c', color: '#163223' }}
            >
              {showAll ? 'Vis færre' : 'Vis flere'}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
                className="transition-transform duration-300"
                style={{ transform: showAll ? 'rotate(180deg)' : 'none' }}
              >
                <path d="M2 4l4 4 4-4" stroke="#163223" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right — full-bleed family photo; its aspect drives the lg height */}
        <div className="relative hidden lg:block">
          <div className="lg:aspect-[1020/772]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/faq-familie.jpg"
              alt="Far med datter på skuldrene i stuen"
              loading="lazy"
              decoding="async"
              className="w-full h-64 sm:h-80 lg:h-full lg:absolute lg:inset-0 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
