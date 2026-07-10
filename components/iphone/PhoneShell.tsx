'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

type ChildrenFn = (hovered: boolean) => ReactNode

export default function PhoneShell({
  children,
  variant = 'foreground',
  hovered: externalHovered,
  sheen = true,
  softShadow = false,
}: {
  children: ReactNode | ChildrenFn
  variant?: 'foreground' | 'back'
  hovered?: boolean
  /** The glass reflection overlay tints everything under it toward white —
   *  turn it off where exact brand colours matter. */
  sheen?: boolean
  /** Gentler halo — used by the hero's single-phone mobile layout. */
  softShadow?: boolean
}) {
  const isBack = variant === 'back'
  const [internalHovered, setInternalHovered] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isControlled = externalHovered !== undefined
  const hovered = isControlled ? !!externalHovered : internalHovered

  useEffect(() => {
    if (isControlled) return
    if (typeof navigator === 'undefined' || !navigator.maxTouchPoints) return
    const t1 = setTimeout(() => {
      setInternalHovered(true)
      resetTimerRef.current = setTimeout(() => setInternalHovered(false), 3200)
    }, 1800)
    return () => clearTimeout(t1)
  }, [isControlled])

  function onEnter() {
    if (!isControlled) setInternalHovered(true)
  }
  function onLeave() {
    if (!isControlled) setInternalHovered(false)
  }

  const rendered = typeof children === 'function' ? (children as ChildrenFn)(hovered) : children

  return (
    <div
      className="mx-auto select-none cursor-default"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={onEnter}
      onTouchEnd={() => {
        if (isControlled) return
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(onLeave, 2800)
      }}
    >
      <div style={{ position: 'relative', width: 270, height: 560 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 52,
            padding: 8,
            background: 'linear-gradient(150deg, #2e2e2e 0%, #141414 45%, #111111 100%)',
            // Drop-shadow halo via box-shadow instead of a blurred sibling
            // <div>. CSS `filter: blur()` is clipped by the nearest ancestor
            // with a transform (the IPhoneMockup foreground wrapper has
            // translateX(-50%)), which was cutting the halo at a hard
            // vertical line ~37px from each viewport edge. box-shadow renders
            // outside the element box and isn't subject to transform-induced
            // containing-block clipping, so the halo bleeds smoothly.
            boxShadow: [
              'inset 0 1px 0 rgba(255,255,255,0.13)',
              'inset 2px 0 0 rgba(255,255,255,0.07)',
              'inset -1px 0 0 rgba(0,0,0,0.6)',
              'inset 0 -1px 0 rgba(0,0,0,0.5)',
              isBack
                ? '0 24px 39px 4px rgba(0,0,0,0.16)'
                : softShadow
                  ? '0 18px 36px 2px rgba(0,0,0,0.13)'
                  : '0 32px 50px 6px rgba(0,0,0,0.25)',
            ].join(', '),
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 44,
              background: '#000',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              className="flex flex-col"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--cream)',
                borderRadius: 44,
                overflow: 'hidden',
              }}
            >
              <StatusBar />
              {rendered}
            </div>

            {sheen && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 44,
                  background:
                    'linear-gradient(130deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 30%, transparent 55%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 95,
                height: 28,
                background: '#000',
                borderRadius: 20,
                zIndex: 20,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBar() {
  // Live clock in Danish time (Europe/Copenhagen). Starts as the classic 9:41
  // for SSR, then syncs on the client and ticks every 30s.
  const [time, setTime] = useState('9:41')
  useEffect(() => {
    const sync = () =>
      setTime(
        new Intl.DateTimeFormat('da-DK', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Copenhagen' }).format(new Date()),
      )
    sync()
    const id = setInterval(sync, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
      <span suppressHydrationWarning className="text-[11px] font-semibold" style={{ color: 'var(--text-dark)' }}>
        {time}
      </span>
      <div className="flex items-center gap-1">
        <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
          <rect x="0" y="3" width="3" height="7" rx="1" fill="#0d2818" opacity="0.3" />
          <rect x="4" y="2" width="3" height="8" rx="1" fill="#0d2818" opacity="0.5" />
          <rect x="8" y="0.5" width="3" height="9.5" rx="1" fill="#0d2818" opacity="0.7" />
          <rect x="12" y="0" width="3" height="10" rx="1" fill="#0d2818" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#0d2818" strokeOpacity="0.35" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="#0d2818" />
          <path d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z" fill="#0d2818" opacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

export function TabBar({ active }: { active: 'hjem' | 'mad' | 'sparetips' | 'profil' }) {
  return (
    <div
      className="mt-auto shrink-0 flex items-center justify-around px-6 pt-2 pb-1"
      style={{ borderTop: '1px solid rgba(27,104,64,0.07)' }}
    >
      <Tab label="Hjem" isActive={active === 'hjem'}>
        <path d="M3 12L12 4L21 12V21H15V15H9V21H3V12Z" fill="currentColor" />
      </Tab>
      <Tab label="Mad" isActive={active === 'mad'}>
        {/* The Altid Mad bottle-and-fruit glyph from icon-mad.svg — fruit
            filled solid so the active state reads clearly, sized to match
            the other tab glyphs (18 of the 24 grid). */}
        <g transform="translate(12,12) scale(0.71) translate(-27.18,-26.58)" fill="currentColor">
          <circle cx="32.31" cy="31.71" r="7.55" />
          <path d="M32.3115 23.1006H37.7471C37.7471 21.5907 36.5392 20.3828 35.0293 20.3828C33.5194 20.3828 32.3115 21.4397 32.3115 22.9496V17.665C30.8016 17.665 29.5938 18.8729 29.5938 20.3828C29.5938 21.8927 30.8016 23.1006 32.3115 23.1006Z" />
          <path d="M23.2514 34.8778H16.155C15.853 34.8778 15.853 34.8778 15.853 34.5759V24.6107C15.853 23.8558 15.853 23.1008 16.306 22.3459L18.8728 16.7594H22.4965L25.0632 22.3459C25.3652 23.1008 25.5162 23.8558 25.5162 24.6107V25.3657C25.9692 24.9127 26.5731 24.4597 27.0261 24.1578C27.0261 23.2518 26.7241 22.4969 26.4221 21.742L24.1573 16.7594H25.2142C25.6672 16.7594 26.1202 16.3064 26.1202 15.8535V14.7965C26.1202 14.3436 25.6672 13.8906 25.2142 13.8906H16.7589C16.306 13.8906 15.853 14.3436 15.853 14.7965V15.8535C15.853 16.3064 16.306 16.7594 16.7589 16.7594H17.3629L15.0981 21.742C14.6451 22.6479 14.4941 23.5538 14.4941 24.6107V34.5759C14.4941 35.6328 15.2491 36.3877 16.306 36.3877H24.1573C24.1573 35.9348 23.7044 35.3308 23.5534 34.8778H23.4024H23.2514Z" />
        </g>
      </Tab>
      <Tab label="Sparetips" isActive={active === 'sparetips'}>
        <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 16.5L18.5 21L16.5 13.5L22 9H15L12 2Z" fill="currentColor" />
      </Tab>
      <Tab label="Profil" isActive={active === 'profil'}>
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path
          d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Tab>
    </div>
  )
}

function Tab({ label, isActive, children }: { label: string; isActive: boolean; children: ReactNode }) {
  const color = isActive ? 'var(--forest)' : 'rgba(13,40,24,0.25)'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color }}>
        {children}
      </svg>
      <span style={{ fontSize: 8, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--forest)' : 'var(--text-light)' }}>
        {label}
      </span>
    </div>
  )
}

export function HomeIndicator() {
  return (
    <div className="flex justify-center pb-2 pt-1">
      <div className="w-24 h-1 rounded-full" style={{ background: 'rgba(13,40,24,0.2)' }} />
    </div>
  )
}
