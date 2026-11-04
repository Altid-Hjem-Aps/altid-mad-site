import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import sharp from 'sharp'
import AppScreenFigure from '@/components/AppScreenFigure'
import IPhoneMockup from '@/components/IPhoneMockup'
import HowItWorks from '@/components/sections/HowItWorks'
import ProblemIndkoebPlus from '@/components/sections/ProblemIndkoebPlus'
import ProblemMadplan from '@/components/sections/ProblemMadplan'
import {
  GUIDE_SCREENS,
  HERO_FRAMES,
  HERO_LABEL,
  INDKOEB_SCENES,
  MADPLAN_SCENES,
  SCREENS,
  type Region,
  type ScreenId,
} from '@/lib/screen-captures'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const STORIES = [
  ['madplan', MADPLAN_SCENES],
  ['indkoeb', INDKOEB_SCENES],
] as const

const beats = [...MADPLAN_SCENES, ...INDKOEB_SCENES].flatMap((scene) => scene.beats)
const file = (id: ScreenId) => SCREENS[id].file
const pathOf = (img: Element | null | undefined) => (img ? new URL(img.getAttribute('src') ?? '', 'http://x').pathname : null)

function regionsOnFrames(): [string, ScreenId, Region][] {
  const reveals = beats.flatMap((b) => (b.reveals ?? []).flatMap((r): [string, ScreenId, Region][] => [
    ['reveal', b.frame, r.region],
    ['reveal source', r.from, r.region],
  ]))
  const presses = beats.flatMap((b): [string, ScreenId, Region][] => (b.press ? [['press', b.frame, b.press.region]] : []))
  const crops = Object.values(GUIDE_SCREENS).flatMap((g): [string, ScreenId, Region][] => ('crop' in g ? [['crop', g.id, g.crop]] : []))
  return [...reveals, ...presses, ...crops]
}

function stubReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduce,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

describe('the pictures on the site', () => {
  // A picture of a screen is invisible to the copy tests, so a frame reaches the site
  // only by being looked at and added here. Wrong behaviour this catches: a refresh
  // that adds mad.savings, whose figures are seeded, or any Hjem or Energi frame.
  it('holds only frames somebody has looked at against the board', () => {
    expect(Object.keys(SCREENS).sort()).toEqual([
      'mad.flow.11b_others',
      'mad.flow.12b_cheapest',
      'mad.flow.13_combinations',
      'mad.flow.14_done',
      'mad.flow.1_tastes',
      'mad.flow.2_avoid',
      'mad.flow.4_household',
      'mad.flow.6_budget',
      'mad.flow.6_budget.3000',
      'mad.flow.8_building',
      'mad.flow.9_week_plan',
      'mad.home',
      'mad.meal_plan',
      'mad.meal_plan.scrolled',
      'mad.meal_plan.swap_picker',
      'mad.shopping_list',
      'mad.trip',
      'mad.trip.in_progress',
      'mad.trip.replace_sheet',
      'mad.welcome.1',
      'mad.welcome.3',
      'mad.welcome.4',
    ])
  })

  it.each(Object.entries(SCREENS))('%s is on disk at its stated size and within budget', async (_id, data) => {
    const path = join(process.cwd(), 'public', data.file)
    const meta = await sharp(path).metadata()
    expect([meta.width, meta.height]).toEqual([data.width, data.height])
    expect(statSync(path).size / 1024).toBeLessThanOrEqual(150)
  })

  it.each(STORIES)('the %s story stays within a megabyte', (_name, scenes) => {
    const frames = new Set(scenes.flatMap((s) => s.beats.flatMap((b) => [b.frame, ...(b.reveals ?? []).map((r) => r.from)])))
    const bytes = [...frames].reduce((sum, id) => sum + statSync(join(process.cwd(), 'public', SCREENS[id].file)).size, 0)
    expect(bytes / 1024).toBeLessThanOrEqual(1024)
  })

  // Wrong behaviour this catches: a region typed in capture pixels instead of frame
  // pixels, so a tick or a crop lands outside the picture.
  it.each(regionsOnFrames())('a %s on %s lies inside the picture', (_kind, id, region) => {
    const { width, height } = SCREENS[id]
    expect(region.x).toBeGreaterThanOrEqual(0)
    expect(region.y).toBeGreaterThanOrEqual(0)
    expect(region.x + region.w).toBeLessThanOrEqual(width)
    expect(region.y + region.h).toBeLessThanOrEqual(height)
  })

  it('renders only manifest images in the phones and figures, and leaves no frame unused', () => {
    HTMLImageElement.prototype.decode = vi.fn(() => Promise.resolve())
    stubReducedMotion(true)
    const { container } = render(
      <>
        <IPhoneMockup />
        <ProblemMadplan />
        <ProblemIndkoebPlus />
        {Object.keys(GUIDE_SCREENS).map((guide) => (
          <AppScreenFigure key={guide} guide={guide as keyof typeof GUIDE_SCREENS} />
        ))}
      </>,
    )
    const known = Object.values(SCREENS).map((s) => s.file) as string[]
    const rendered = [...container.querySelectorAll('img')].map(pathOf).filter((src) => src?.startsWith('/app-screens/'))
    expect(rendered.length).toBeGreaterThan(0)
    for (const src of rendered) expect(known).toContain(src)

    const used = new Set<ScreenId>([
      ...HERO_FRAMES,
      ...beats.flatMap((b) => [b.frame, ...(b.reveals ?? []).map((r) => r.from)]),
      ...Object.values(GUIDE_SCREENS).map((g) => g.id),
    ])
    expect([...used].sort()).toEqual(Object.keys(SCREENS).sort())
  })

  // The board's limits, by frame: mad.savings stays out, and so does the one-budget
  // run's enemy, a frame from another staged household where a household shows.
  it('keeps the two staged households apart in the Madplan story', () => {
    const frames = MADPLAN_SCENES.flatMap((s) => s.beats.map((b) => b.frame))
    for (const other of ['mad.home', 'mad.meal_plan', 'mad.meal_plan.scrolled', 'mad.shopping_list', 'mad.trip'] as ScreenId[]) {
      expect(frames).not.toContain(other)
    }
  })

  it('gives the how-it-works section back its four text cards, with no phone', () => {
    stubReducedMotion(true)
    const { container } = render(<HowItWorks />)
    expect(screen.getByText('Fortæl os om din familie')).toBeInTheDocument()
    expect(screen.getByText('Spar penge. Hver uge. Altid.')).toBeInTheDocument()
    expect(container.querySelector('[data-phone-screen]')).toBeNull()
    expect(container.querySelector('img[src^="/app-screens/"]')).toBeNull()
  })

  it('shows a guide page its picture with the sample-data caption and no phone around it', () => {
    const { container } = render(<AppScreenFigure guide="tilbud" />)
    expect(pathOf(screen.getByRole('img', { name: GUIDE_SCREENS.tilbud.alt }))).toBe(file('mad.welcome.4'))
    expect(screen.getByText('Skærmbilleder fra appen med eksempeldata.')).toBeInTheDocument()
    expect(container.querySelector('[data-phone-screen]')).toBeNull()
  })

  // These figures stood on the card this page used to have, pinned as verified: the
  // DST FU13 2024 average and the Q3 basket gap, a saving only as "op til". A number
  // drifting here is a compliance problem, not a cosmetic one.
  it('keeps the verified figures in the /beregn-dit-madbudget article', () => {
    const page = readFileSync(join(process.cwd(), 'app/beregn-dit-madbudget/page.tsx'), 'utf8')
    expect(page).toContain('5.481 kr.')
    expect(page).toContain('40,4 pct.')
    expect(page).toMatch(/op til/)
  })
})

describe('the phone stories', () => {
  const decode = vi.fn(() => Promise.resolve())
  let intersect: (visible: boolean) => void

  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
  const shownFrame = (container: HTMLElement) =>
    pathOf(container.querySelector('[data-phone-screen] > div:not([aria-hidden]) img:not([aria-hidden])'))
  const madplanMs = (key: string) => {
    let at = 0
    for (const scene of MADPLAN_SCENES) {
      if (scene.key === key) return at
      at += scene.ms
    }
    throw new Error(key)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    decode.mockReset().mockResolvedValue(undefined)
    HTMLImageElement.prototype.decode = decode
    stubReducedMotion(false)
    const observers: ((visible: boolean) => void)[] = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly callback: IntersectionObserverCallback) {
          observers.push((visible) =>
            this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver),
          )
        }
        observe() {}
        disconnect() {}
      },
    )
    intersect = (visible) => act(() => observers.forEach((notify) => notify(visible)))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('has one dot per step and none for the app icon', () => {
    render(<ProblemMadplan />)
    expect(screen.getAllByRole('button', { name: /^Gå til / })).toHaveLength(MADPLAN_SCENES.length - 2)
    expect(screen.getByRole('slider', { name: /^Jeres smag/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gå til Altid Hjem' })).toBeNull()
  })

  it('stays on the first frame until it is on screen, then plays its steps in order', async () => {
    const { container } = render(<ProblemMadplan />)
    await advance(10_000)
    expect(shownFrame(container)).toBe(file('mad.flow.1_tastes'))

    intersect(true)
    await advance(madplanMs('family') + 200)
    expect(shownFrame(container)).toBe(file('mad.flow.4_household'))
    await advance(madplanMs('hensyn') - madplanMs('family'))
    expect(shownFrame(container)).toBe(file('mad.flow.2_avoid'))
  })

  it('stops when it leaves the screen and on a hidden tab', async () => {
    const { container } = render(<ProblemMadplan />)
    intersect(true)
    intersect(false)
    await advance(10_000)
    expect(shownFrame(container)).toBe(file('mad.flow.1_tastes'))

    intersect(true)
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await advance(10_000)
    expect(shownFrame(container)).toBe(file('mad.flow.1_tastes'))
  })

  it('steps to a dot by hand, also while paused', async () => {
    const { container } = render(<ProblemMadplan />)
    intersect(true)
    fireEvent.click(screen.getByRole('button', { name: 'Sæt animationen på pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gå til Din madplan for ugen' }))
    await advance(1000)
    expect(shownFrame(container)).toBe(file('mad.flow.9_week_plan'))
    await advance(10_000)
    expect(shownFrame(container)).toBe(file('mad.flow.9_week_plan'))
  })

  // The law: a savings figure in a frame carries its source in the same section.
  it('shows the report footnote exactly while the 11.207 kr. frame is up', async () => {
    const { container } = render(<ProblemMadplan />)
    const link = () => screen.getByText('Læs Altid Mad-rapporten')
    expect(link().closest('p')).toHaveStyle({ visibility: 'hidden' })

    intersect(true)
    fireEvent.click(screen.getByRole('button', { name: 'Gå til Budget' }))
    await advance(1000)
    expect(shownFrame(container)).toBe(file('mad.flow.6_budget'))
    expect(link().closest('p')).toHaveStyle({ visibility: 'hidden' })

    await advance(5000)
    expect(shownFrame(container)).toBe(file('mad.welcome.1'))
    expect(link().closest('p')).toHaveStyle({ visibility: 'visible' })
    expect(link()).toHaveAttribute('href', '/altid-mad-kvartalsrapport-q3.pdf')

    await advance(6000)
    expect(shownFrame(container)).toBe(file('mad.flow.8_building'))
    expect(link().closest('p')).toHaveStyle({ visibility: 'hidden' })
  })

  it('closes on the app icon with no phone, then opens on the first step again', async () => {
    const { container } = render(<ProblemMadplan />)
    intersect(true)
    fireEvent.click(screen.getByRole('button', { name: 'Gå til Jeres indkøbsliste er klar' }))
    await advance(1000)
    expect(screen.queryByText('Altid Mad finder du i Altid Hjem appen')).toBeNull()
    await advance(3400)
    expect(screen.getByText('Altid Mad finder du i Altid Hjem appen')).toBeInTheDocument()
    await advance(3800)
    expect(shownFrame(container)).toBe(file('mad.flow.1_tastes'))
  })

  it('lands the ticks on the real frame in order', async () => {
    const { container } = render(<ProblemIndkoebPlus />)
    const on = () => container.querySelectorAll('[data-reveal="on"]').length
    intersect(true)
    fireEvent.click(screen.getByRole('button', { name: 'Gå til Første stop: Bilka' }))
    await advance(600)
    expect(shownFrame(container)).toBe(file('mad.trip'))
    expect(on()).toBe(0)
    await advance(1000)
    expect(on()).toBe(1)
    await advance(1400)
    expect(on()).toBe(5)
  })

  it('keeps the current frame and logs when the next one will not load', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    decode.mockRejectedValue(new Error('offline'))
    const { container } = render(<ProblemMadplan />)
    intersect(true)
    await advance(madplanMs('family') + 400)
    expect(shownFrame(container)).toBe(file('mad.flow.1_tastes'))
    expect(error.mock.calls.flat().join(' ')).toContain('mad.flow.4_household')
  })

  it('under reduced motion rests on the end state, does not move, and steps by hand', async () => {
    stubReducedMotion(true)
    const { container } = render(<ProblemMadplan />)
    expect(shownFrame(container)).toBe(file('mad.flow.14_done'))
    expect(screen.queryByRole('button', { name: /animationen/ })).toBeNull()
    intersect(true)
    await advance(20_000)
    expect(shownFrame(container)).toBe(file('mad.flow.14_done'))

    fireEvent.click(screen.getByRole('button', { name: 'Gå til Hvem spiser med?' }))
    await advance(0)
    expect(shownFrame(container)).toBe(file('mad.flow.4_household'))
  })
})

describe('the hero phones', () => {
  const decode = vi.fn(() => Promise.resolve())

  beforeEach(() => {
    vi.useFakeTimers()
    decode.mockReset().mockResolvedValue(undefined)
    HTMLImageElement.prototype.decode = decode
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const track = (container: HTMLElement) => container.querySelector<HTMLElement>('[style*="width: 300%"]')

  it('shows the board frames in the three-phone fan and in the carousel', () => {
    const { container } = render(<IPhoneMockup />)
    expect(screen.getAllByRole('img', { name: HERO_LABEL })).toHaveLength(2)
    const sources = [...container.querySelectorAll('[data-phone-screen] img')].map(pathOf)
    // Three in the fan, three in the carousel.
    expect(sources).toHaveLength(6)
    expect(new Set(sources)).toEqual(new Set(HERO_FRAMES.map(file)))
  })

  it('moves the carousel with its dots, and stays put when the frame will not load', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<IPhoneMockup />)
    const carousel = () => track(container)?.style.transform

    fireEvent.click(screen.getByRole('button', { name: 'Skærm 2' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(carousel()).toContain('-33.3')

    decode.mockRejectedValue(new Error('offline'))
    fireEvent.click(screen.getByRole('button', { name: 'Skærm 3' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(carousel()).toContain('-33.3')
    expect(error).toHaveBeenCalled()
  })
})
