import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as amplitude from '@amplitude/analytics-browser'
import ExitIntentDialog from '@/components/ExitIntentDialog'

// The dialog's worst failure mode is leaving document.body.style.overflow =
// 'hidden' after close — that bricks scrolling for the rest of the visit.
// These tests pin the dismissal/cleanup contract and the analytics split
// between dismissed and converted closes.

vi.mock('@amplitude/analytics-browser', () => ({ track: vi.fn() }))

// The animation stage needs ResizeObserver/IntersectionObserver and a real
// layout box — irrelevant to the dialog contract under test.
vi.mock('@/components/sections/why/EtHjemStage', () => ({ default: () => null }))

beforeEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  // The html element is the EFFECTIVE lock (body overflow doesn't propagate
  // past globals.css's html{overflow-x:clip}) — reset it too so one failing
  // test can't strand a lock for the rest of the file.
  document.documentElement.style.overflowY = ''
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('ExitIntentDialog dismissal & cleanup', () => {
  it('locks page scroll while open and restores it on Escape, tracking the dismissal', () => {
    const onClose = vi.fn()
    const { unmount } = render(<ExitIntentDialog onClose={onClose} />)
    // The html element is the effective lock: globals.css sets
    // html{overflow-x:clip}, which stops body overflow from propagating to
    // the viewport — body-only locking left the page scrollable.
    expect(document.documentElement.style.overflowY).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    expect(amplitude.track).toHaveBeenCalledWith('Exit Intent Dismissed', { path: '/' })

    // The host unmounts the dialog on close — that must release the lock.
    unmount()
    expect(document.documentElement.style.overflowY).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('restores PRE-EXISTING inline overflow values instead of blanking them', () => {
    document.documentElement.style.overflowY = 'scroll'
    document.body.style.overflow = 'auto'
    const { unmount } = render(<ExitIntentDialog onClose={vi.fn()} />)
    expect(document.documentElement.style.overflowY).toBe('hidden')
    unmount()
    expect(document.documentElement.style.overflowY).toBe('scroll')
    expect(document.body.style.overflow).toBe('auto')
    document.documentElement.style.overflowY = ''
    document.body.style.overflow = ''
  })

  it('does not close on Escape delivered to an open native <select>', () => {
    const onClose = vi.fn()
    render(<ExitIntentDialog onClose={onClose} />)
    const select = document.createElement('select')
    document.body.appendChild(select)
    fireEvent.keyDown(select, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    select.remove()
  })

  it('closes on a clean backdrop click, but NOT when the press started inside the panel', () => {
    const onClose = vi.fn()
    render(<ExitIntentDialog onClose={onClose} />)
    const overlay = screen.getByRole('dialog').parentElement!

    // Drag that starts in the form and releases on the overlay (text
    // selection) must not close.
    fireEvent.pointerDown(screen.getByRole('dialog'))
    fireEvent.click(overlay)
    expect(onClose).not.toHaveBeenCalled()

    // A real backdrop click (press + release on the overlay) closes.
    fireEvent.pointerDown(overlay)
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('tracks Converted instead of Dismissed when the visitor signed up before closing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'abc', surveyToken: 'tok' }),
      }),
    )
    const onClose = vi.fn()
    render(<ExitIntentDialog onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('Dit fulde navn'), { target: { value: 'Test Testesen' } })
    fireEvent.change(screen.getByPlaceholderText('din@email.dk'), { target: { value: 'test@test.dk' } })
    fireEvent.change(screen.getByPlaceholderText('12 34 56 78'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: /skriv mig på ventelisten/i }))
    await waitFor(() => expect(screen.getByText('Fortæl os lidt om dig.')).toBeInTheDocument())
    expect(amplitude.track).toHaveBeenCalledWith('Exit Intent Converted', { path: '/' })

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    expect(amplitude.track).not.toHaveBeenCalledWith('Exit Intent Dismissed', expect.anything())
  })
})
