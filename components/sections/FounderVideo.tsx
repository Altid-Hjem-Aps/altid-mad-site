'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as amplitude from '@amplitude/analytics-browser'
import dynamic from 'next/dynamic'
import { fluid } from '@/lib/fluid'
import { H2, EYEBROW, BODY } from '@/lib/typography'

// The Altid Mad founder video exists as two Mux assets: a 16:9 master for
// the sm+ frames and a dedicated 1:1 cut for the phone frame, so phones get
// the real square edit instead of a centre-crop of the wide one.
const PLAYBACK_ID_WIDE = '28UsvvvDAS7Z8fJ8FnFlCIWhJogZE2GGXGFujAnvBcw'
const PLAYBACK_ID_SQUARE = 't6YOkbyrk00eFAW9asaC5ruGCUi1THVJHpyHlRE7UywQ'
// Exact complement of Tailwind's `sm` (min-width: 640px), which drives the
// frame aspect and the skeleton's poster pick. Querying min-width (not
// max-width: 639px) keeps fractional viewport widths like 639.5px — desktop
// zoom, iPadOS split view — in the same bucket as the CSS.
const WIDE_QUERY = '(min-width: 640px)'
const POSTER_TIME = 8
const posterUrl = (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=${POSTER_TIME}&fit_mode=preserve`

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  ssr: false,
  loading: () => <PlayerSkeleton />,
})

// Skeleton renders the real Mux posters as plain <img>s so users see the
// founder while @mux/mux-player-react's chunk loads (or if it fails entirely).
// Both ratios are in the markup with CSS picking one — the skeleton is also
// server-rendered, where the viewport is unknown.
function PlayerSkeleton() {
  return (
    <div className="absolute inset-0" style={{ background: 'rgba(15,55,30,0.06)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterUrl(PLAYBACK_ID_SQUARE)}
        alt="Werner Valeur"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover sm:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterUrl(PLAYBACK_ID_WIDE)}
        alt="Werner Valeur"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover hidden sm:block"
      />
    </div>
  )
}


type PlayerEl = HTMLElement & {
  muted?: boolean
  paused?: boolean
  currentTime?: number
  play?: () => Promise<void>
  pause?: () => void
  media?: { nativeEl?: HTMLVideoElement & { webkitEnterFullscreen?: () => void } }
}

export default function FounderVideo() {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Serve the asset matching the frame the player sits in (square below
  // Tailwind's sm breakpoint). Ambient mode follows the live viewport — a
  // muted looping restart on the rare breakpoint cross is invisible. Sound
  // mode never swaps sources (that would restart playback mid-watch); its
  // one dangerous leftover — a square asset in a frame that has since gone
  // wide, where cover-fit would crop away the bottom-anchored burned-in
  // subtitles — falls back to contain instead (squareInWideFrame). The wide
  // asset in a square frame keeps cover: that trims the sides, subtitles
  // are centred, same as the old single-asset behaviour. SSR and
  // matchMedia-less environments default to the wide master (the player is
  // ssr:false; the server-rendered skeleton carries both posters,
  // CSS-picked).
  const [playbackId, setPlaybackId] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia(WIDE_QUERY).matches
      ? PLAYBACK_ID_SQUARE
      : PLAYBACK_ID_WIDE
  )
  const [squareInWideFrame, setSquareInWideFrame] = useState(false)
  const playbackIdRef = useRef(playbackId)
  playbackIdRef.current = playbackId

  // Two modes: ambient (muted autoplay when scrolled into view) and sound mode
  // — pressing the video restarts it from 0:00 with sound on. After that the
  // observer only pauses off-screen and resumes on return; it never re-mutes
  // or restarts a video the user chose to hear.
  const [soundMode, setSoundMode] = useState(false)
  const soundModeRef = useRef(false)

  // Touch devices get tap-controlled chrome in sound mode: while the chrome
  // is hidden, a tap layer covers the picture (tap = show, double-tap =
  // fullscreen); while the chrome is VISIBLE the layer is gone, so every Mux
  // control — including the centre play/pause — is directly tappable. The
  // chrome auto-hides after ~2.5s of no touches, but never while paused.
  // Desktop keeps the native hover behaviour.
  const [isTouch, setIsTouch] = useState(false)
  const isTouchRef = useRef(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(hover: none) and (pointer: coarse)')
    const sync = () => { isTouchRef.current = mql.matches; setIsTouch(mql.matches) }
    sync()
    mql.addEventListener('change', sync)
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      mql.removeEventListener('change', sync)
      document.removeEventListener('fullscreenchange', onFs)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    }
  }, [])

  // Keep the served asset in step with the viewport (see the playbackId
  // comment above for the ambient-vs-sound-mode rules).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(WIDE_QUERY)
    const sync = () => {
      if (soundModeRef.current) {
        setSquareInWideFrame(playbackIdRef.current === PLAYBACK_ID_SQUARE && mql.matches)
      } else {
        setPlaybackId(mql.matches ? PLAYBACK_ID_WIDE : PLAYBACK_ID_SQUARE)
        setSquareInWideFrame(false)
      }
    }
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  const getPlayer = () => wrapperRef.current?.querySelector('mux-player') as PlayerEl | null

  function scheduleHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      // Standard player behaviour: the chrome stays up while paused — the
      // 'play' listener below re-arms the hide when playback resumes.
      if (getPlayer()?.paused) return
      setControlsVisible(false)
    }, 2600)
  }

  function showControlsBriefly() {
    setControlsVisible(true)
    scheduleHide()
  }

  function toggleFullscreen() {
    const p = getPlayer()
    if (!p) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
      return
    }
    // iOS Safari only allows fullscreen on the native <video>, exposed by
    // mux-player as media.nativeEl (verified in the live shadow DOM).
    const nativeVideo = p.media?.nativeEl
    if (p.requestFullscreen) {
      p.requestFullscreen().catch(() => nativeVideo?.webkitEnterFullscreen?.())
    } else {
      nativeVideo?.webkitEnterFullscreen?.()
    }
  }

  // Single tap toggles the chrome; two taps within 280ms go fullscreen.
  function handleSoundModeTap() {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current)
      tapTimerRef.current = null
      toggleFullscreen()
      return
    }
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null
      // Functional update: the auto-hide can fire inside this 280ms window,
      // so decide on the CURRENT visibility, not the tap-time closure value.
      setControlsVisible(v => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        if (v) return false
        scheduleHide()
        return true
      })
    }, 280)
  }

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (typeof IntersectionObserver !== 'function') return // no ambient autoplay without it
    // Reduced motion: no ambient autoplay — the poster + controls (and the
    // "Se med lyd" press) still work on demand.
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let inView = false
    let tracked = false
    let pausedByUs = false

    const sync = () => {
      const p = getPlayer()
      if (!p) return
      if (inView) {
        if (soundModeRef.current) {
          // Only resume what WE paused — respect a manual pause via the controls.
          if (pausedByUs) { pausedByUs = false; p.play?.().catch(() => {}) }
        } else if (!reduced) {
          p.muted = true
          p.play?.()
            .then(() => { if (!tracked) { tracked = true; amplitude.track('Founder Video Autoplayed') } })
            .catch(() => {})
        }
      } else {
        if (p.paused === false) pausedByUs = true
        p.pause?.()
      }
    }

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync() }, { threshold: 0.4 })
    io.observe(wrapper)
    // iPhone Safari has no element Fullscreen API — webkitEnterFullscreen()
    // fires webkitbegin/endfullscreen on the native <video> instead of
    // document fullscreenchange, so mirror those into isFullscreen too.
    let fsVideo: HTMLVideoElement | null = null
    let hookedPlayer: PlayerEl | null = null
    const touchSound = () => isTouchRef.current && soundModeRef.current
    const onFsBegin = () => setIsFullscreen(true)
    const onFsEnd = () => {
      setIsFullscreen(false)
      // iOS pauses the video when leaving native fullscreen — surface the
      // chrome so play is one tap away (it stays up while paused).
      if (touchSound()) { setControlsVisible(true); scheduleHide() }
    }
    // Chrome follows playback state on touch: stays up while paused,
    // re-arms the auto-hide when playback resumes.
    const onPause = () => { if (touchSound()) setControlsVisible(true) }
    const onPlay = () => { if (touchSound()) scheduleHide() }
    const hookNative = () => {
      const pl = getPlayer()
      const v = pl?.media?.nativeEl
      if (pl && !hookedPlayer) {
        hookedPlayer = pl
        pl.addEventListener('pause', onPause)
        pl.addEventListener('play', onPlay)
      }
      if (!v || fsVideo) return
      fsVideo = v
      v.addEventListener('webkitbeginfullscreen', onFsBegin)
      v.addEventListener('webkitendfullscreen', onFsEnd)
    }
    // The player is lazy-loaded — poll until it exists, then sync and stop.
    const poll = setInterval(() => { if (getPlayer()) { clearInterval(poll); hookNative(); sync() } }, 250)
    const stopPoll = setTimeout(() => clearInterval(poll), 8000)
    return () => {
      io.disconnect()
      clearInterval(poll)
      clearTimeout(stopPoll)
      if (fsVideo) {
        fsVideo.removeEventListener('webkitbeginfullscreen', onFsBegin)
        fsVideo.removeEventListener('webkitendfullscreen', onFsEnd)
      }
      if (hookedPlayer) {
        hookedPlayer.removeEventListener('pause', onPause)
        hookedPlayer.removeEventListener('play', onPlay)
      }
    }
  }, [])

  // Press on the video (ambient mode): restart from the beginning with sound.
  // Runs in the click's gesture context, so unmuted play() is allowed.
  function handleWatchWithSound() {
    const p = getPlayer()
    if (!p) return
    soundModeRef.current = true
    setSoundMode(true)
    p.currentTime = 0
    p.muted = false
    p.play?.().catch(() => {})
    if (isTouch) showControlsBriefly()
    amplitude.track('Founder Video Sound On')
  }

  // Same signup flow as nav/hero: scroll to the bottom form, otherwise expand
  // the hero form, otherwise navigate home with #venteliste.
  function handleCTA() {
    amplitude.track('Waitlist CTA Clicked', { source: 'founder' })
    const onPageForm = document.getElementById('venteliste2')
    if (onPageForm) { onPageForm.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (window.location.pathname !== '/') { router.push('/#venteliste'); return }
    window.dispatchEvent(new CustomEvent('expand-waitlist'))
  }

  return (
    <section className="relative overflow-hidden" style={{ background: '#3E6924' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">

        {/* Left: text + CTA */}
        <div
          className="flex flex-col justify-center py-16 lg:py-20 pr-6 sm:pr-10 lg:pr-14 max-w-[880px]"
          style={{ paddingLeft: fluid(140, 32) }}
        >
          <p className={EYEBROW} style={{ color: '#DCD799' }}>
            Mød grundlæggeren
          </p>

          {/* Hanging quote mark: text-indent pulls the opening " into the
              margin so the first words align with the subtext + button. Fixed
              line breaks match the Figma frame. */}
          <h2
            className={`mt-6 ${H2} text-white`}
            style={{ textIndent: '-0.42em' }}
          >
            &ldquo;Spar op til <span style={{ color: '#DCD799' }}>15.000 kr.</span><br />
            på familiens indkøb.&rdquo;
          </h2>

          <p className={`mt-7 max-w-[520px] ${BODY} text-white`}>
            Altid Mad hjælper familien med at spare penge på dagligvarer ved at finde tilbud, planlægge måltider og samle indkøbslisten automatisk.
          </p>

          <button
            type="button"
            onClick={handleCTA}
            className="mt-9 inline-flex w-fit items-center justify-center font-medium rounded-[20px] px-8 py-[18px] xl:px-0 xl:py-[23px] xl:w-[clamp(200px,15.83vw,304px)] text-[16px] transition-opacity hover:opacity-90"
            style={{ background: '#DCD799', color: '#163223', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            Skriv dig på ventelisten
          </button>
        </div>

        {/* Right: video, fills the entire right half (cover) */}
        <div
          ref={wrapperRef}
          onTouchStart={() => {
            // Any touch while the chrome is visible re-arms the auto-hide, so
            // it can't vanish mid-scrub or mid-interaction.
            if (soundModeRef.current && controlsVisible) scheduleHide()
          }}
          onDoubleClick={(e) => {
            // Desktop: double-click on the picture toggles fullscreen (touch
            // devices get this via the tap layer's double-tap instead).
            // Control-bar double-clicks (bottom strip) stay with the player.
            if (isTouchRef.current || !soundModeRef.current) return
            const r = e.currentTarget.getBoundingClientRect()
            if (e.clientY > r.bottom - 60) return
            toggleFullscreen()
          }}
          // Phones get a 1:1 frame fed by the square asset; tablets show the
          // full 16:9; desktop fills the right half as before.
          className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:h-full lg:min-h-[460px] self-stretch"
        >
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            accentColor="#DCD799"
            poster={posterUrl(playbackId)}
            playsInline
            loop
            muted
            // metadata only: the section is below the fold and the poster <img>
            // covers first paint — preload="auto" would buffer HLS segments for
            // every visitor, including those who never scroll here.
            preload="metadata"
            metadata={{
              video_title: 'Altid Mad — Werner Valeur',
              // Ratio-specific id so Mux Data separates phone (1:1) from
              // desktop (16:9) plays.
              video_id: playbackId === PLAYBACK_ID_SQUARE ? 'founder-mad-1x1' : 'founder-mad-16x9',
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              '--media-object-fit': squareInWideFrame ? 'contain' : 'cover',
              display: 'block',
              // Touch + sound mode: chrome only while "controlsVisible" (tap
              // toggled, auto-hides) — never inside fullscreen.
              '--controls': soundMode && isTouch && !controlsVisible && !isFullscreen ? 'none' : undefined,
            }}
          />

          {/* Sound mode on touch, chrome hidden: full-area tap target —
              single tap shows the chrome, double tap toggles fullscreen.
              While the chrome is visible the layer unmounts entirely, so
              every Mux control (incl. the CENTRE play/pause, which on mobile
              sits mid-picture) is directly tappable; the wrapper's touch
              handler keeps the chrome alive during interaction. */}
          {soundMode && isTouch && !isFullscreen && !controlsVisible && (
            <button
              type="button"
              onClick={handleSoundModeTap}
              aria-label="Vis afspillerknapper — dobbelttryk for fuld skærm"
              className="absolute inset-0 z-10 cursor-pointer"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: 'transparent' }}
            />
          )}

          {/* Ambient mode: pressing the video restarts it with sound. The
              overlay stops above the Mux control bar (~56px) so the native
              controls stay usable; it unmounts once sound mode is on. */}
          {!soundMode && (
            <button
              type="button"
              onClick={handleWatchWithSound}
              aria-label="Se med lyd — afspil videoen forfra"
              // Pill sits top-left below lg — on the narrow crops the burned-in
              // subtitles own the bottom of the frame; desktop has room at the
              // bottom-left.
              className="absolute inset-x-0 top-0 bottom-14 z-10 flex items-start lg:items-end justify-start p-5 cursor-pointer"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                  <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Se med lyd
              </span>
            </button>
          )}
        </div>

      </div>
    </section>
  )
}
