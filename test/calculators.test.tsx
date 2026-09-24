import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { parseDanishNumber } from '@/components/seo/mockupKit'
import MadbudgetSammenligningMockup from '@/components/MadbudgetSammenligningMockup'

describe('parseDanishNumber', () => {
  it('parses a decimal comma', () => {
    expect(parseDanishNumber('17,69', 5, 50)).toBeCloseTo(17.69)
  })

  it('parses a thousands separator', () => {
    expect(parseDanishNumber('1.500', 100, 100_000)).toBe(1500)
  })

  it('parses combined thousands + decimals', () => {
    expect(parseDanishNumber('2.000,50', 100, 100_000)).toBeCloseTo(2000.5)
  })

  it('keeps a plain decimal point that is not a thousands group', () => {
    expect(parseDanishNumber('17.5', 5, 50)).toBeCloseTo(17.5)
  })

  it('rejects out-of-range, zero, negative and garbage input', () => {
    expect(parseDanishNumber('999999999', 100, 100_000)).toBeNaN()
    expect(parseDanishNumber('0', 1, 100)).toBeNaN()
    expect(parseDanishNumber('-5', 1, 100)).toBeNaN()
    expect(parseDanishNumber('abc', 1, 100)).toBeNaN()
    expect(parseDanishNumber('', 1, 100)).toBeNaN()
  })
})

/* The calculator that used to live on /beregn-dit-madbudget was replaced by an
 * animated mockup. These pin the numbers the mockup asserts, which are the
 * only verified ones: the DST FU13 2024 average for 2 adults with children and
 * the Q3 basket gap. A number drifting here is a compliance problem, not a
 * cosmetic one. */
describe('MadbudgetSammenligningMockup', () => {
  // Under reduced motion the card pins its finished state, so every figure is
  // present at once. That is both the a11y contract and the only way to assert
  // the later rows without driving the phase timer.
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
  })

  it('renders the verified DST average and the example household', () => {
    render(<MadbudgetSammenligningMockup />)
    expect(screen.getByText('5.481 kr./md.')).toBeInTheDocument()
    expect(screen.getByText('2 voksne, 2 børn')).toBeInTheDocument()
  })

  it('labels the household spend as an example, never as a measured figure', () => {
    render(<MadbudgetSammenligningMockup />)
    expect(screen.getByText(/eksempel/i)).toBeInTheDocument()
  })

  it('states the saving as "op til" with its condition, never a promised amount', () => {
    render(<MadbudgetSammenligningMockup />)
    expect(screen.getByText(/Op til/)).toBeInTheDocument()
    expect(screen.getByText('40,4 pct.')).toBeInTheDocument()
    expect(screen.getByText(/Hvis jeres indkøb ligner testkurven/)).toBeInTheDocument()
  })

  it('describes the whole card to assistive tech as an example', () => {
    render(<MadbudgetSammenligningMockup />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/^Eksempel: /)
  })
})
