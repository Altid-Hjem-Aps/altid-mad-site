import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import StoreBadges from '@/components/StoreBadges'
import BottomCta from '@/components/sections/BottomCta'
import Hero from '@/components/Hero'

vi.mock('@/components/IPhoneMockup', () => ({ default: () => null }))
vi.mock('@/components/HeroStatCounter', () => ({ default: () => null }))
vi.mock('@/components/sections/PressStrip', () => ({ default: () => null }))

// Literal on purpose: ALT-895's campaign links, not built from lib/store-links.
const APP_STORE = 'https://apps.apple.com/dk/app/altid-hjem/id6794330094?pt=129212732&ct=ah_1_altidmad_dk&mt=8'
const PLAY =
  'https://play.google.com/store/apps/details?id=dk.altidhjem.app&referrer=utm_source%3Daltidmad_dk%26utm_campaign%3Dah_1_altidmad_dk'

function expectBothBadges(scope: ReturnType<typeof within>) {
  expect(scope.getByRole('link', { name: 'Hent i App Store' })).toHaveAttribute('href', APP_STORE)
  expect(scope.getByRole('link', { name: 'Hent i Google Play' })).toHaveAttribute('href', PLAY)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('store badges', () => {
  it('link to the exact store URLs under ALT-895’s labels', () => {
    render(<StoreBadges position="hero" />)
    expectBothBadges(within(document.body))
  })

  it('count a click with a beacon and let the navigation go ahead', () => {
    const sendBeacon = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    render(<StoreBadges position="bottom" />)
    const link = screen.getByRole('link', { name: 'Hent i Google Play' })
    let prevented = true
    // jsdom cannot follow the link: read the default state, then stop it.
    window.addEventListener('click', (e) => {
      prevented = e.defaultPrevented
      e.preventDefault()
    }, { once: true })
    fireEvent.click(link)
    expect(prevented).toBe(false)
    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const [url, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob]
    expect(url).toBe('/api/store-click')
    expect(blob.type).toBe('application/json')
  })
})

describe('hero', () => {
  it('says ALT-895’s words, has both badges on the #hent-appen anchor and no form', () => {
    const { container } = render(<Hero />)
    expect(screen.getByRole('heading', { level: 1, name: 'Altid Mad er klar.' })).toBeInTheDocument()
    expect(
      screen.getByText('Madplan og indkøbsliste, der finder de billigste varer i dine butikker. Du finder Altid Mad i appen Altid Hjem.'),
    ).toBeInTheDocument()
    expectBothBadges(within(container.querySelector('#hent-appen') as HTMLElement))
    expect(container.querySelector('form')).toBeNull()
  })
})

describe('bottom of every page', () => {
  it('has both badges with the newsletter form after them', () => {
    const { container } = render(<BottomCta />)
    expectBothBadges(within(container))
    const badge = screen.getByRole('link', { name: 'Hent i App Store' })
    const form = container.querySelector('form') as HTMLFormElement
    expect(badge.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('page metadata', () => {
  it('uses ALT-895’s title and description', async () => {
    vi.doMock('next/font/google', () => ({ Onest: () => ({ variable: '' }), Afacad: () => ({ variable: '' }) }))
    const { metadata } = await import('@/app/layout')
    expect(metadata.title).toBe('Altid Mad: madplan og indkøbsliste i Altid Hjem-appen')
    expect(metadata.description).toBe('Hent Altid Hjem, og få ugens madplan og en indkøbsliste, der viser, hvor varerne er billigst.')
    expect(metadata.openGraph?.title).toBe(metadata.title)
  })
})
