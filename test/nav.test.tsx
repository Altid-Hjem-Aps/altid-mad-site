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

function placeBadges() {
  const badges = document.createElement('div')
  badges.id = 'hent-appen'
  badges.scrollIntoView = vi.fn()
  document.body.appendChild(badges)
  return badges
}

describe('Nav CTA', () => {
  it('on a page with the store badges: tracks the click and scrolls to them', () => {
    stubLocation('/')
    const badges = placeBadges()

    render(<Nav />)
    fireEvent.click(screen.getByRole('button', { name: 'Hent appen' }))

    expect(amplitude.track).toHaveBeenCalledWith('App CTA Clicked', { source: 'nav' })
    expect(badges.scrollIntoView).toHaveBeenCalled()
    // Stayed on the page: no navigation.
    expect(push).not.toHaveBeenCalled()

    badges.remove()
  })

  it('on a page without badges: client-navigates to the front page’s', () => {
    stubLocation('/slet-konto')

    render(<Nav />)
    fireEvent.click(screen.getByRole('button', { name: 'Hent appen' }))

    expect(amplitude.track).toHaveBeenCalledWith('App CTA Clicked', { source: 'nav' })
    // router.push (not a full page load) so the tracked event isn't dropped.
    expect(push).toHaveBeenCalledWith('/#hent-appen')
  })
})

describe('Nav links', () => {
  it('promises no service that is not in the app', () => {
    stubLocation('/')
    render(<Nav />)
    fireEvent.click(screen.getByRole('button', { name: 'Åbn menu' }))
    expect(screen.queryByText(/Kommer snart/i)).toBeNull()
    for (const name of ['Alarm', 'Opladning', 'Mobil']) expect(screen.queryByText(name)).toBeNull()
  })

  it('burger menu opens with the nav links and closes when a link is clicked', () => {
    stubLocation('/')
    render(<Nav />)
    const burger = screen.getByRole('button', { name: 'Åbn menu' })
    fireEvent.click(burger)
    expect(screen.getByRole('button', { name: 'Luk menu' })).toHaveAttribute('aria-expanded', 'true')
    // Panel + desktop menu both render the links; the panel adds a second set.
    expect(screen.getAllByRole('link', { name: 'Energi' }).length).toBeGreaterThan(1)
    expect(screen.getAllByRole("link", { name: "Forsikring" }).length).toBeGreaterThan(1)
    expect(screen.getAllByRole("link", { name: "Forsikring" })[0]).toHaveAttribute("href", "https://altidforsikring.dk")
    fireEvent.click(screen.getAllByRole('link', { name: 'Energi' })[1])
    expect(screen.getByRole('button', { name: 'Åbn menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Spiir banner', () => {
  it('is ABSENT by default: the front page must render without campaign content', () => {
    stubLocation('/')
    render(<Nav />)
    expect(screen.queryByText(/Spiir/)).toBeNull()
    // Only the nav's own controls: the CTA and the burger toggle.
    expect(screen.getByRole('button', { name: 'Hent appen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Åbn menu' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('renders above the nav when spiirBanner is set', () => {
    stubLocation('/spiir-alternativ')
    render(<Nav spiirBanner />)
    expect(screen.getByText(/Brugte du Spiir\?/)).toBeInTheDocument()
  })

  it('scrolls to the store badges on the page when clicked', () => {
    stubLocation('/spiir-alternativ')
    const badges = placeBadges()

    render(<Nav spiirBanner />)
    fireEvent.click(screen.getByText(/Brugte du Spiir\?/).closest('button') as HTMLElement)

    expect(amplitude.track).toHaveBeenCalledWith('App CTA Clicked', { source: 'spiir-banner' })
    expect(badges.scrollIntoView).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()

    badges.remove()
  })

  it('goes to the front page’s badges if the page has none', () => {
    stubLocation('/spiir-alternativ')
    render(<Nav spiirBanner />)
    fireEvent.click(screen.getByText(/Brugte du Spiir\?/).closest('button') as HTMLElement)

    expect(push).toHaveBeenCalledWith('/#hent-appen')
  })
})
