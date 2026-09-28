import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import CookieBanner from '@/components/CookieBanner'
import CookieSettingsLink from '@/components/CookieSettingsLink'
import { readCookieChoice, saveCookieChoice } from '@/lib/cookie-consent'

const analytics = vi.hoisted(() => ({ startAnalytics: vi.fn(), stopAnalytics: vi.fn() }))
vi.mock('@/lib/analytics', () => analytics)

beforeEach(() => {
  window.localStorage.clear()
  analytics.startAnalytics.mockClear()
  analytics.stopAnalytics.mockClear()
})
afterEach(() => window.localStorage.clear())

describe('cookie banner', () => {
  it('asks a first-time visitor and starts nothing before an answer', () => {
    render(<CookieBanner />)
    expect(screen.getByRole('dialog', { name: 'Må vi bruge cookies?' })).toBeInTheDocument()
    expect(analytics.startAnalytics).not.toHaveBeenCalled()
  })

  it('offers both answers with identical styling', () => {
    render(<CookieBanner />)
    const no = screen.getByRole('button', { name: 'Kun nødvendige' })
    const yes = screen.getByRole('button', { name: 'Accepter alle' })
    expect(no.className).toBe(yes.className)
    expect(no.getAttribute('style')).toBe(yes.getAttribute('style'))
  })

  it('"Accepter alle" saves the answer, starts statistics and closes', () => {
    render(<CookieBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Accepter alle' }))
    expect(readCookieChoice()).toBe('all')
    expect(analytics.startAnalytics).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Kun nødvendige" saves the answer, never starts statistics and closes', () => {
    render(<CookieBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Kun nødvendige' }))
    expect(readCookieChoice()).toBe('necessary')
    expect(analytics.startAnalytics).not.toHaveBeenCalled()
    expect(analytics.stopAnalytics).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays closed for a visitor who already answered', () => {
    saveCookieChoice('necessary')
    render(<CookieBanner />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reopens from Cookieindstillinger, and a withdrawn yes stops statistics', () => {
    saveCookieChoice('all')
    render(
      <>
        <CookieBanner />
        <CookieSettingsLink />
      </>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cookieindstillinger' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kun nødvendige' }))
    expect(readCookieChoice()).toBe('necessary')
    expect(analytics.stopAnalytics).toHaveBeenCalledTimes(1)
  })

  it('links to the cookie section of the privacy policy', () => {
    render(<CookieBanner />)
    expect(screen.getByRole('link', { name: 'privatlivspolitik' })).toHaveAttribute('href', '/privatlivspolitik#cookies')
  })

  it('ignores answers given while unmounted', () => {
    const { unmount } = render(<CookieBanner />)
    unmount()
    act(() => saveCookieChoice('all'))
    expect(analytics.startAnalytics).not.toHaveBeenCalled()
  })
})
