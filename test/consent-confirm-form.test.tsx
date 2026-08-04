import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import ConsentConfirmForm from '@/components/ConsentConfirmForm'
import {
  CONFIRM_PAGE_BUTTON,
  CONFIRM_PAGE_BUTTON_PENDING,
  CONFIRM_PICK_ONE,
  SIGNUP_CONSENT_MAD,
} from '@/lib/copy'

// The double-submit guard IS this component's reason to exist after the 4 Aug
// incident: two queued server actions made a successful consent end on the
// "link no longer works" screen. These tests pin the pending mechanics.

const ALLOWED = [{ key: 'mad' as const, text: SIGNUP_CONSENT_MAD }]

afterEach(() => {
  vi.clearAllMocks()
})

describe('ConsentConfirmForm double-submit guard', () => {
  it('fires the action once; the button disables and swaps label while pending', async () => {
    // An action that never settles keeps the form pending for the whole test.
    const action = vi.fn(() => new Promise<void>(() => {}))
    render(<ConsentConfirmForm allowed={ALLOWED} action={action} />)

    fireEvent.click(screen.getByRole('checkbox'))
    const button = screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON })
    fireEvent.click(button)

    // Pending state lands: label swaps, button disables, fieldset freezes.
    await waitFor(() => expect(screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON_PENDING })).toBeDisabled())
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true')

    // The double-click: a second activation while pending must not queue a
    // second action.
    fireEvent.click(screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON_PENDING }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('two back-to-back clicks before the pending re-render still fire the action once', async () => {
    // The real 4 Aug incident: two clicks milliseconds apart, the second one
    // racing the disable re-render rather than politely waiting for it.
    const action = vi.fn(() => new Promise<void>(() => {}))
    render(<ConsentConfirmForm allowed={ALLOWED} action={action} />)
    fireEvent.click(screen.getByRole('checkbox'))
    const button = screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON })
    fireEvent.click(button)
    fireEvent.click(button) // no waitFor between: the same-tick race
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
  })

  it('keeps full opacity while pending — dimming means "nothing ticked", not "working"', async () => {
    const action = vi.fn(() => new Promise<void>(() => {}))
    render(<ConsentConfirmForm allowed={ALLOWED} action={action} />)

    // Nothing ticked after hydration: dimmed and disabled.
    const idle = screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON })
    await waitFor(() => expect(idle).toBeDisabled())
    expect(idle.style.opacity).toBe('0.4')

    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON }))
    await waitFor(() => {
      const pending = screen.getByRole('button', { name: CONFIRM_PAGE_BUTTON_PENDING })
      expect(pending.style.opacity).toBe('1')
    })
  })

  it('ships an ENABLED button in server-rendered HTML — the no-JS path must be able to submit', () => {
    // Regression guard from the component's own history: a controlled version
    // once shipped a permanently disabled button to every no-JS reader, which
    // made consent impossible to give at all.
    const html = renderToStaticMarkup(
      <ConsentConfirmForm allowed={ALLOWED} action={() => {}} />,
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const button = doc.querySelector('button[type="submit"]')
    expect(button).toBeTruthy()
    expect(button!.hasAttribute('disabled')).toBe(false)
  })

  it('renders the pick-one error as role=alert when passed', () => {
    render(<ConsentConfirmForm allowed={ALLOWED} action={() => {}} error={CONFIRM_PICK_ONE} />)
    expect(screen.getByRole('alert')).toHaveTextContent(CONFIRM_PICK_ONE)
  })

  it('renders no alert when there is no error', () => {
    render(<ConsentConfirmForm allowed={ALLOWED} action={() => {}} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
