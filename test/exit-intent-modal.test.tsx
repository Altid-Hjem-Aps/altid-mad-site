import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import * as amplitude from '@amplitude/analytics-browser'
import ExitIntentModal from '@/components/ExitIntentModal'

// The trigger's guards are conversion-critical: a regression either kills the
// dialog silently (lost signups) or fires it on every mouseout (spams every
// visitor) — and the suite would stay green either way without these tests.

vi.mock('@amplitude/analytics-browser', () => ({ track: vi.fn() }))

const nav = vi.hoisted(() => ({ path: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.path }))

// The dialog body is code-split behind next/dynamic; the trigger contract is
// "renders the dialog on fire", so a stub keeps framer-motion out of jsdom.
vi.mock('next/dynamic', async () => {
  const React = await import('react')
  return {
    default: (loader: () => Promise<{ default: React.ComponentType<{ onClose: () => void }> }>) => {
      const Lazy = React.lazy(loader)
      return function DynamicStub(props: { onClose: () => void }) {
        return React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props))
      }
    },
  }
})
vi.mock('@/components/ExitIntentDialog', async () => {
  const React = await import('react')
  return {
    default: ({ onClose }: { onClose: () => void }) =>
      React.createElement(
        'div',
        { role: 'dialog' },
        React.createElement('button', { 'aria-label': 'Luk', onClick: onClose })
      ),
  }
})

function exitTop(clientY = 10, relatedTarget: EventTarget | null = null) {
  const e = new MouseEvent('mouseout', { bubbles: true, clientY })
  Object.defineProperty(e, 'relatedTarget', { value: relatedTarget })
  document.dispatchEvent(e)
}

function stubPointer(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }))
}

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
  nav.path = '/'
  stubPointer(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function arm() {
  await act(async () => {
    vi.advanceTimersByTime(3000)
  })
}

async function findDialog() {
  // The lazy chunk resolves on a microtask; flush it under fake timers.
  await act(async () => {
    await Promise.resolve()
  })
  return screen.queryByRole('dialog')
}

describe('ExitIntentModal trigger guards', () => {
  it('does NOT open before the 3s arm delay', async () => {
    render(<ExitIntentModal />)
    act(() => exitTop())
    expect(await findDialog()).toBeNull()
  })

  it('opens on a top-edge exit after arming, marks the browser, tracks Shown', async () => {
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop(10))
    expect(await findDialog()).toBeInTheDocument()
    expect(window.localStorage.getItem('ah-exit-intent-shown')).toBe('1')
    expect(amplitude.track).toHaveBeenCalledWith('Exit Intent Shown', { path: '/' })
  })

  it('ignores exits below the top zone and exits into another element', async () => {
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop(51))
    act(() => exitTop(10, document.body))
    expect(await findDialog()).toBeNull()
  })

  it('fires on a fast upward flick even when the last sample is below the zone', async () => {
    render(<ExitIntentModal />)
    await arm()
    // Cursor sampled at y=300, then the exit reports y=180 — travelling up.
    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientY: 300 }))
      exitTop(180)
    })
    expect(await findDialog()).toBeInTheDocument()
  })

  it('does NOT fire on a downward exit below the zone', async () => {
    render(<ExitIntentModal />)
    await arm()
    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientY: 100 }))
      exitTop(400)
    })
    expect(await findDialog()).toBeNull()
  })

  it('fires via mouseleave on the root element (Safari path)', async () => {
    render(<ExitIntentModal />)
    await arm()
    act(() => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { clientY: 10 }))
    })
    expect(await findDialog()).toBeInTheDocument()
  })

  it('?exit-intent=reset clears both guards but still requires the gesture', async () => {
    window.localStorage.setItem('ah-exit-intent-shown', '1')
    window.localStorage.setItem('ah-waitlist-joined', '1')
    window.history.replaceState(null, '', '/?exit-intent=reset')
    render(<ExitIntentModal />)
    // No gesture yet — clearing the flags must not open anything by itself.
    expect(await findDialog()).toBeNull()
    await arm()
    act(() => exitTop(10))
    expect(await findDialog()).toBeInTheDocument()
  })

  it('never binds on touch devices', async () => {
    stubPointer(false)
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeNull()
  })

  it('never fires again on a browser that already saw it (persistent)', async () => {
    window.localStorage.setItem('ah-exit-intent-shown', '1')
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeNull()
  })

  it('opens at most once — a second exit after closing does not reopen it', async () => {
    const { rerender } = render(<ExitIntentModal />)
    await arm()
    act(() => exitTop(10))
    const dialog = await findDialog()
    expect(dialog).toBeInTheDocument()
    // Close it (the dialog stub exposes the Luk button wired to onClose).
    act(() => screen.getByRole('button', { name: 'Luk' }).click())
    expect(await findDialog()).toBeNull()
    // Re-arm and try to exit again — the persistent flag must keep it shut.
    rerender(<ExitIntentModal />)
    await arm()
    act(() => exitTop(10))
    expect(await findDialog()).toBeNull()
  })

  it('with ?exit-intent=reset it still opens only once, not on every close', async () => {
    window.history.replaceState(null, '', '/?exit-intent=reset')
    const { rerender } = render(<ExitIntentModal />)
    await arm()
    act(() => exitTop(10))
    expect(await findDialog()).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'Luk' }).click())
    expect(await findDialog()).toBeNull()
    // The reset only runs on mount, so closing must NOT re-clear the flag and
    // let the popup reappear on the next exit gesture.
    rerender(<ExitIntentModal />)
    await arm()
    act(() => exitTop(10))
    expect(await findDialog()).toBeNull()
  })

  it('never pitches a browser that already joined the waitlist', async () => {
    window.localStorage.setItem('ah-waitlist-joined', '1')
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeNull()
  })

  it('stays away from excluded utility pages, but not from prefix look-alikes', async () => {
    nav.path = '/slet-konto'
    const { unmount } = render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeNull()
    unmount()

    // /kontakt is excluded; a hypothetical /kontakt-os style route is NOT —
    // exclusion matches whole path segments only.
    nav.path = '/kontaktperson'
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeInTheDocument()
  })

  it('does not fire while a fullscreen element is active (video)', async () => {
    render(<ExitIntentModal />)
    await arm()
    const video = document.createElement('video')
    Object.defineProperty(document, 'fullscreenElement', { value: video, configurable: true })
    try {
      act(() => exitTop())
      expect(await findDialog()).toBeNull()
    } finally {
      // try/finally: a failing assertion must not leak the stubbed property
      // into the rest of the file (jsdom's document is shared per file).
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    }
  })

  it('does NOT fire on a sideways exit with only a tiny upward drift', async () => {
    render(<ExitIntentModal />)
    await arm()
    act(() => {
      // Cursor at mid-page drifting up 3px while exiting through a side edge
      // — must not spend the once-per-browser showing.
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientY: 403 }))
      exitTop(400)
    })
    expect(await findDialog()).toBeNull()
  })

  it('does NOT re-pitch someone who joined the waitlist after the listeners were armed', async () => {
    render(<ExitIntentModal />)
    await arm()
    // Signing up via the hero form sets the flag WITHOUT re-rendering the
    // root-layout trigger — the fire-time guard must catch it.
    window.localStorage.setItem('ah-waitlist-joined', '1')
    act(() => exitTop(10))
    expect(await findDialog()).toBeNull()
  })

  it('survives a localStorage that throws (blocked cookies) without crashing', async () => {
    const throwing = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('denied', 'SecurityError')
      },
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError')
      },
    }
    vi.stubGlobal('localStorage', throwing)
    render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    // No throw = the site did not blank; the dialog still shows (no guard).
    expect(await findDialog()).toBeInTheDocument()
  })

  it('closes when the pathname changes under the open dialog', async () => {
    const { rerender } = render(<ExitIntentModal />)
    await arm()
    act(() => exitTop())
    expect(await findDialog()).toBeInTheDocument()
    nav.path = '/privatlivspolitik'
    rerender(<ExitIntentModal />)
    expect(await findDialog()).toBeNull()
  })
})
