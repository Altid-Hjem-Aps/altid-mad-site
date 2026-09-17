import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import * as amplitude from '@amplitude/analytics-browser'
import Nav from '@/components/Nav'

// Amplitude is a browser SDK with network side effects — mock it.
vi.mock('@amplitude/analytics-browser', () => ({ track: vi.fn() }))
vi.mock('@/components/Logo', () => ({ Logo: () => null, MadLogo: () => null }))

// Nav navigates via the App Router off the front page — capture push calls.
// usePathname (active-link highlighting) follows the stubbed window.location.
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => window.location.pathname,
}))

const realLocation = window.location

// jsdom's window.location throws "Not implemented: navigation" on href
// assignment — replace it with a plain object so the test can observe paths.
function stubLocation(pathname: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname, href: `https://altidhjem.dk${pathname}`, hash: '' } as unknown as Location,
  })
}

beforeEach(() => {
  // jsdom does not implement matchMedia, which Nav's scroll effect reads.
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: realLocation,
  })
  vi.clearAllMocks()
})

describe('Nav CTA', () => {
  it('on the front page: tracks the click and expands the waitlist form in place', () => {
    stubLocation('/')
    const expandListener = vi.fn()
    window.addEventListener('expand-waitlist', expandListener)

    render(<Nav />)
    fireEvent.click(screen.getByRole('button', { name: /ventelisten/i }))

    expect(amplitude.track).toHaveBeenCalledWith('Waitlist CTA Clicked', { source: 'nav' })
    expect(expandListener).toHaveBeenCalledTimes(1)
    // Stayed on the page — no navigation.
    expect(push).not.toHaveBeenCalled()

    window.removeEventListener('expand-waitlist', expandListener)
  })

  it('off the front page: client-navigates home with the auto-expand hash', () => {
    stubLocation('/slet-konto')
    const expandListener = vi.fn()
    window.addEventListener('expand-waitlist', expandListener)

    render(<Nav />)
    fireEvent.click(screen.getByRole('button', { name: /ventelisten/i }))

    expect(amplitude.track).toHaveBeenCalledWith('Waitlist CTA Clicked', { source: 'nav' })
    // router.push (not a full page load) so the tracked event isn't dropped,
    // with #venteliste so the hero form expands on arrival.
    expect(push).toHaveBeenCalledWith('/#venteliste')
    expect(expandListener).not.toHaveBeenCalled()

    window.removeEventListener('expand-waitlist', expandListener)
  })
})

describe('Spiir banner', () => {
  it('is ABSENT by default — the front page must render without campaign content', () => {
    stubLocation('/')
    render(<Nav />)
    expect(screen.queryByText(/Spiir/)).toBeNull()
    // Only the nav's own controls: the waitlist CTA and the burger toggle.
    expect(screen.getByRole('button', { name: /ventelisten/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Åbn menu' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('burger menu opens with the nav links and closes when a link is clicked', () => {
    stubLocation('/')
    render(<Nav />)
    const burger = screen.getByRole('button', { name: 'Åbn menu' })
    fireEvent.click(burger)
    expect(screen.getByRole('button', { name: 'Luk menu' })).toHaveAttribute('aria-expanded', 'true')
    // Panel + desktop menu both render the links; the panel adds a second set.
    // "Kommer snart" services are inactive text, so Alarm renders no link —
    // Mad (home), Energi and Forsikring are the clickable ones on this site.
    expect(screen.queryAllByRole('link', { name: /Alarm/ })).toHaveLength(0)
    expect(screen.getAllByRole('link', { name: 'Energi' }).length).toBeGreaterThan(1)
    expect(screen.getAllByRole("link", { name: "Forsikring" }).length).toBeGreaterThan(1)
    expect(screen.getAllByRole("link", { name: "Forsikring" })[0]).toHaveAttribute("href", "https://altidforsikring.dk")
    fireEvent.click(screen.getAllByRole('link', { name: 'Energi' })[1])
    expect(screen.getByRole('button', { name: 'Åbn menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders above the nav when spiirBanner is set', () => {
    stubLocation('/spiir-alternativ')
    render(<Nav spiirBanner />)
    expect(screen.getByText(/Brugte du Spiir\?/)).toBeInTheDocument()
  })

  it('scrolls to the on-page form when one exists, so the signup keeps its source tag', () => {
    stubLocation('/spiir-alternativ')
    // /spiir-alternativ has BottomCta's form on the page (id venteliste2).
    const onPageForm = document.createElement('div')
    onPageForm.id = 'venteliste2'
    onPageForm.scrollIntoView = vi.fn()
    document.body.appendChild(onPageForm)

    render(<Nav spiirBanner />)
    fireEvent.click(screen.getByText(/Brugte du Spiir\?/).closest('button') as HTMLElement)

    expect(amplitude.track).toHaveBeenCalledWith('Waitlist CTA Clicked', { source: 'spiir-banner' })
    expect(onPageForm.scrollIntoView).toHaveBeenCalled()
    // Crucially: NO navigation to the front page, whose form tags 'forside'.
    expect(push).not.toHaveBeenCalled()

    onPageForm.remove()
  })

  it('falls back to navigating home if the page has no form of its own', () => {
    stubLocation('/spiir-alternativ')
    render(<Nav spiirBanner />)
    fireEvent.click(screen.getByText(/Brugte du Spiir\?/).closest('button') as HTMLElement)

    expect(push).toHaveBeenCalledWith('/#venteliste')
  })
})
