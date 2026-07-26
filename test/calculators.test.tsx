import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { parseDanishNumber } from '@/components/seo/mockupKit'
import BudgetCalculator from '@/components/BudgetCalculator'

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

describe('BudgetCalculator', () => {
  it('shows the DST benchmark for the default household (2 adults + kids)', () => {
    render(<BudgetCalculator />)
    expect(screen.getByText(/5\.481 kr\. om måneden/)).toBeInTheDocument()
  })

  it('computes the savings estimate from the user number (21,3 pct.)', () => {
    render(<BudgetCalculator />)
    fireEvent.change(screen.getByPlaceholderText('F.eks. 5.000'), { target: { value: '5.000' } })
    // 5000 * 21,3% = 1065/md, 12780/yr; 5000 vs benchmark 5481 = 481 under
    expect(screen.getByText(/1\.065 kr\./)).toBeInTheDocument()
    expect(screen.getByText(/12\.780 kr\. om året/)).toBeInTheDocument()
    expect(screen.getByText(/481 kr\. under gennemsnittet/)).toBeInTheDocument()
  })

  it('parses Danish decimals without inflating the amount', () => {
    render(<BudgetCalculator />)
    fireEvent.change(screen.getByPlaceholderText('F.eks. 5.000'), { target: { value: '5.000,50' } })
    // 5000,50 must NOT become 500050 — estimate stays ~1.065
    expect(screen.getByText(/1\.065 kr\./)).toBeInTheDocument()
  })

  it('keeps the estimate gated for garbage and implausible input', () => {
    render(<BudgetCalculator />)
    const input = screen.getByPlaceholderText('F.eks. 5.000')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(screen.getByText(/Indtast et beløb mellem 100 og 100\.000 kr\./)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '999999999' } })
    expect(screen.getByText(/Indtast et beløb mellem 100 og 100\.000 kr\./)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText(/Indtast jeres månedsforbrug/)).toBeInTheDocument()
  })

  it('switches benchmark when the household changes', () => {
    render(<BudgetCalculator />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '1' } })
    fireEvent.change(selects[1], { target: { value: '0' } })
    expect(screen.getByText(/1\.811 kr\. om måneden/)).toBeInTheDocument()
  })
})
