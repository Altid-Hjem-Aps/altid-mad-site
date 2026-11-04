import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import sharp from 'sharp'
import HeroPhones from '@/components/HeroPhones'
import MadplanMockup from '@/components/MadplanMockup'
import HowItWorks from '@/components/sections/HowItWorks'
import ProblemIndkoebPlus from '@/components/sections/ProblemIndkoebPlus'
import ProblemMadplan from '@/components/sections/ProblemMadplan'
import ScreenTour from '@/components/ScreenTour'
import {
  HERO_SCENES,
  HERO_STILLS,
  INDKOEB_SCENES,
  MADPLAN_SCENES,
  SAMPLE_DATA_CAPTION,
  SCREENS,
  type Scene,
  type ScreenId,
} from '@/lib/screen-captures'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const TOURS = [
  ['hero', HERO_SCENES],
  ['madplan', MADPLAN_SCENES],
  ['indkoeb', INDKOEB_SCENES],
] as const

const kb = (bytes: number) => bytes / 1024

describe('the pictures on the site', () => {
  afterEach(() => vi.unstubAllGlobals())

  // A picture of a screen is invisible to the copy tests, so a frame reaches the
  // site only by being looked at and added here. The frames left out, and why they
  // are, are listed in lib/screen-captures.ts. Wrong behaviour this catches: a
  // refresh that adds mad.savings or mad.flow.14_done, whose savings are not documented.
  it('holds only frames somebody has looked at', () => {
    expect(Object.keys(SCREENS).sort()).toEqual([
      'mad.flow.1_tastes',
      'mad.flow.4_household',
      'mad.flow.5_cooking_time',
      'mad.flow.7_stores',
      'mad.flow.9_week_plan',
      'mad.home',
      'mad.meal_plan',
      'mad.recipe',
      'mad.shopping_list',
      'mad.trip',
      'mad.trip.in_progress',
    ])
  })

  it.each(Object.entries(SCREENS))('%s is on disk at its stated size and within budget', async (_id, screenData) => {
    const path = join(process.cwd(), 'public', screenData.file)
    expect(existsSync(path)).toBe(true)
    const meta = await sharp(path).metadata()
    expect([meta.width, meta.height]).toEqual([screenData.width, screenData.height])
    expect(kb(statSync(path).size)).toBeLessThanOrEqual(150)
  })

  it.each(TOURS)('the %s tour stays inside its limits and its images', (_name, scenes) => {
    expect(scenes.length).toBeLessThanOrEqual(3)
    expect(scenes.filter((s) => s.lift).length).toBeLessThanOrEqual(1)
    const weight = scenes.reduce((sum, s) => sum + statSync(join(process.cwd(), 'public', SCREENS[s.id].file)).size, 0)
    expect(kb(weight)).toBeLessThanOrEqual(1024)
    for (const scene of scenes) {
      const frame = SCREENS[scene.id]
      // A crop still in the air when the finger leaves the screen would cover the tap.
      if (scene.lift) expect(scene.holdMs - 1150, scene.id).toBeGreaterThan(scene.lift.tapped ? 800 : 550)
      for (const region of [...(scene.tap ?? []), ...(scene.lift ? [scene.lift] : [])]) {
        expect(region.x, scene.id).toBeGreaterThanOrEqual(0)
        expect(region.y, scene.id).toBeGreaterThanOrEqual(0)
        expect(region.x + region.w, scene.id).toBeLessThanOrEqual(frame.width)
        expect(region.y + region.h, scene.id).toBeLessThanOrEqual(frame.height)
      }
    }
  })

  it('renders only manifest images inside the phones, and the frames the tours name', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const files = new Set<string>(Object.values(SCREENS).map((s) => s.file))
    const { container } = render(
      <>
        <HeroPhones />
        <ProblemMadplan />
        <ProblemIndkoebPlus />
        <HowItWorks />
        <MadplanMockup />
      </>,
    )
    const rendered = [...container.querySelectorAll('[data-phone-screen] img')].map((img) => img.getAttribute('src') ?? '')
    for (const src of rendered) expect(files.has(src), `${src} is not in the manifest`).toBe(true)
    const named: ScreenId[] = [
      ...HERO_SCENES.map((s) => s.id),
      ...HERO_STILLS,
      ...MADPLAN_SCENES.map((s) => s.id),
      ...INDKOEB_SCENES.map((s) => s.id),
      'mad.flow.1_tastes',
      'mad.flow.9_week_plan',
      'mad.shopping_list',
      'mad.trip.in_progress',
      'mad.meal_plan',
    ]
    expect(rendered.slice().sort()).toEqual(named.map((id) => SCREENS[id].file).sort())
  })

  // Sample data in a picture of the app must not read as a claim about a real household.
  it.each([
    ['the front page', <HeroPhones key="hero" />],
    ['the madplan guide', <MadplanMockup key="guide" />],
    // Real chains with staged prices, far down the page from the hero's caption.
    ['the shopping tour', <ProblemIndkoebPlus key="indkoeb" />],
  ])('%s says the screens hold sample data', (_page, element) => {
    render(element)
    expect(screen.getAllByText(SAMPLE_DATA_CAPTION)).toHaveLength(1)
  })
})

const SCENES: Scene[] = [
  { id: 'mad.home', alt: 'Første', holdMs: 1000, tap: [{ x: 10, y: 10, w: 20, h: 20 }] },
  { id: 'mad.meal_plan', alt: 'Anden', holdMs: 1000 },
  { id: 'mad.shopping_list', alt: 'Tredje', holdMs: 1000 },
]
const LOOP_MS = 3000
const LABEL = 'Altid Mad i appen'

let intersect: (visible: boolean) => void

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: () => {}, removeEventListener: () => {} }))
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
/** The frame the visitor sees: the one image exposed to assistive technology. */
const shown = () => screen.getByRole('img', { name: LABEL }).getAttribute('src')
const playButton = () => screen.getByRole('button', { name: 'Afspil animationen' })

describe('ScreenTour', () => {
  const decode = vi.fn(() => Promise.resolve())

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
    const [play] = screen.queryAllByRole('button', { name: 'Afspil animationen' })
    if (play) fireEvent.click(play)
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('stays still until it is on screen, then moves through its frames with one stable label', async () => {
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)

    intersect(true)
    await advance(1000)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
    expect(screen.getAllByRole('img', { name: LABEL })).toHaveLength(1)
  })

  it('stops when it leaves the screen and when the page is hidden', async () => {
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    intersect(false)
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)

    intersect(true)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)
  })

  it('stops after two full loops on the first frame and offers play', async () => {
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    // One step at a time: each hold starts when the frame before it has landed.
    for (let i = 0; i < 4; i++) await advance(1000)
    // Past the first wrap and still going, so one loop is not enough to stop it.
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
    expect(screen.queryByRole('button', { name: 'Afspil animationen' })).toBeNull()

    for (let i = 0; i < 2; i++) await advance(1000)
    expect(shown()).toBe(SCREENS['mad.home'].file)
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)

    // Play gives it two whole loops again.
    fireEvent.click(playButton())
    for (let i = 0; i < 4; i++) await advance(1000)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
  })

  it('keeps the current frame, logs and offers play when the next one will not load, and play recovers', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    decode.mockRejectedValueOnce(new Error('broken image'))
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    await advance(1000)
    expect(shown()).toBe(SCREENS['mad.home'].file)
    expect(error).toHaveBeenCalledOnce()
    expect(String(error.mock.calls[0][0])).toContain('mad.meal_plan')

    // The network is back: Play has to ask for the frame again, not re-read the failure.
    const failed = document.querySelector(`img[src="${SCREENS['mad.meal_plan'].file}"]`) as HTMLImageElement
    vi.spyOn(failed, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(failed, 'naturalWidth', 'get').mockReturnValue(0)
    let asked = 0
    Object.defineProperty(failed, 'src', {
      configurable: true,
      get: () => SCREENS['mad.meal_plan'].file,
      set: () => {
        asked += 1
      },
    })
    fireEvent.click(playButton())
    expect(asked).toBe(1)
    await advance(1000)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
  })

  it('gives up on a frame that never arrives instead of looking as if it still plays', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    decode.mockReturnValueOnce(new Promise<void>(() => {}))
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    await advance(1000)
    expect(screen.queryByRole('button', { name: 'Afspil animationen' })).toBeNull()
    await advance(10_000)
    expect(shown()).toBe(SCREENS['mad.home'].file)
    expect(playButton()).toBeTruthy()
    expect(error).toHaveBeenCalledOnce()
  })

  it('ignores a frame that lands after the tour has been paused', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let fail: (reason: Error) => void = () => {}
    let land = () => {}
    decode.mockReturnValueOnce(new Promise<void>((resolve) => (land = resolve)))
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    await advance(1000)
    fireEvent.click(screen.getByRole('button', { name: 'Sæt animationen på pause' }))
    land()
    await advance(0)
    expect(shown()).toBe(SCREENS['mad.home'].file)

    // The same for a failure: it says nothing about a tour that has moved on.
    fireEvent.click(playButton())
    decode.mockReturnValueOnce(new Promise<void>((_, reject) => (fail = reject)))
    await advance(1000)
    fireEvent.click(screen.getByRole('button', { name: 'Sæt animationen på pause' }))
    fail(new Error('too late'))
    await advance(0)
    expect(error).not.toHaveBeenCalled()
  })

  it('needs one click on play when the tour has both stopped and been paused', async () => {
    render(
      <>
        <div data-testid="a">
          <ScreenTour scenes={SCENES} label={LABEL} />
        </div>
        <div data-testid="b">
          <ScreenTour scenes={SCENES} label="En anden tur" />
        </div>
      </>,
    )
    intersect(true)
    for (let i = 0; i < 6; i++) await advance(1000)
    fireEvent.click(screen.getAllByRole('button', { name: 'Afspil animationen' })[1])
    fireEvent.click(within(screen.getByTestId('b')).getByRole('button', { name: 'Sæt animationen på pause' }))

    fireEvent.click(within(screen.getByTestId('a')).getByRole('button', { name: 'Afspil animationen' }))
    await advance(1000)
    expect(screen.getByRole('img', { name: LABEL }).getAttribute('src')).toBe(SCREENS['mad.meal_plan'].file)
  })

  it('shows the dot on a tapped lift, then the tap that leaves the frame', async () => {
    const scenes: Scene[] = [
      {
        id: 'mad.home',
        alt: 'Første',
        holdMs: 2000,
        lift: { x: 100, y: 100, w: 100, h: 100, r: 50, scale: 1.2, tapped: true },
        tap: [{ x: 400, y: 400, w: 100, h: 100 }],
      },
      { id: 'mad.meal_plan', alt: 'Anden', holdMs: 1000 },
    ]
    render(<ScreenTour scenes={scenes} label={LABEL} />)
    intersect(true)
    const dotLeft = () => document.querySelector<HTMLElement>('.screen-tour-tap')?.style.left
    await advance(600)
    const onLift = dotLeft()
    expect(onLift).toBeTruthy()
    await advance(1200)
    expect(dotLeft()).toBeTruthy()
    expect(dotLeft()).not.toBe(onLift)
    await advance(200)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
    expect(dotLeft()).toBeUndefined()
  })

  it('still plays and pauses every tour when the browser blocks storage', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      clear: () => {},
    })
    vi.resetModules()
    const { default: Fresh } = await import('@/components/ScreenTour')
    render(
      <>
        <Fresh scenes={SCENES} label={LABEL} />
        <Fresh scenes={SCENES} label="En anden tur" />
      </>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Sæt animationen på pause' })[0])
    expect(screen.getAllByRole('button', { name: 'Afspil animationen' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Afspil animationen' })[0])
    vi.unstubAllGlobals()
  })

  it('pauses every tour on the page with one button and remembers it', async () => {
    render(
      <>
        <div data-testid="a">
          <ScreenTour scenes={SCENES} label={LABEL} />
        </div>
        <div data-testid="b">
          <ScreenTour scenes={SCENES} label="En anden tur" />
        </div>
      </>,
    )
    intersect(true)
    fireEvent.click(within(screen.getByTestId('a')).getByRole('button', { name: 'Sæt animationen på pause' }))
    expect(window.localStorage.getItem('altid-tours-paused')).toBe('1')
    expect(within(screen.getByTestId('b')).getByRole('button', { name: 'Afspil animationen' })).toBeTruthy()

    await advance(LOOP_MS)
    expect(screen.getByRole('img', { name: LABEL }).getAttribute('src')).toBe(SCREENS['mad.home'].file)
    expect(screen.getByRole('img', { name: 'En anden tur' }).getAttribute('src')).toBe(SCREENS['mad.home'].file)

    fireEvent.click(within(screen.getByTestId('a')).getByRole('button', { name: 'Afspil animationen' }))
    expect(window.localStorage.getItem('altid-tours-paused')).toBe('0')
  })

  it('starts paused on a later visit', async () => {
    window.localStorage.setItem('altid-tours-paused', '1')
    vi.resetModules()
    const { default: Fresh } = await import('@/components/ScreenTour')
    render(<Fresh scenes={SCENES} label={LABEL} />)
    expect(playButton()).toBeTruthy()
    intersect(true)
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)
    fireEvent.click(playButton())
  })

  it('under reduced motion stays on the first frame and steps by hand', async () => {
    stubReducedMotion(true)
    render(<ScreenTour scenes={SCENES} label={LABEL} />)
    intersect(true)
    await advance(LOOP_MS)
    expect(shown()).toBe(SCREENS['mad.home'].file)
    expect(document.querySelector('.screen-tour-tap')).toBeNull()

    const second = screen.getByRole('button', { name: 'Skærm 2 af 3: Anden' })
    expect(second.getAttribute('aria-current')).toBeNull()
    fireEvent.click(second)
    await advance(0)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
    expect(second.getAttribute('aria-current')).toBe('true')

    // A frame that will not load: stay on the one that is there.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    decode.mockRejectedValueOnce(new Error('broken image'))
    fireEvent.click(screen.getByRole('button', { name: 'Skærm 3 af 3: Tredje' }))
    await advance(0)
    expect(shown()).toBe(SCREENS['mad.meal_plan'].file)
    expect(error).toHaveBeenCalledOnce()
  })
})
