import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Privatlivspolitik from '@/app/privatlivspolitik/page'

vi.mock('@/components/Nav', () => ({ default: () => null }))

describe('/privatlivspolitik cookies section', () => {
  it('lists every cookie and storage key the site sets, and lets the visitor change the choice', () => {
    render(<Privatlivspolitik />)
    const h2s = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2s).toContain('10. Cookies')
    expect(h2s[h2s.length - 1]).toBe('11. Ændringer')
    const section = document.getElementById('cookies') as HTMLElement
    for (const name of ['ah-cookie-consent:', 'am_confirm:', 'ah-waitlist-joined:', 'ah-exit-intent-shown:', 'AMP_* (Amplitude):']) {
      expect(section).toHaveTextContent(name)
    }
    expect(within(section).getByRole('button', { name: 'Cookieindstillinger' })).toBeInTheDocument()
  })
})
