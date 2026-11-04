import { describe, expect, it } from 'vitest'
import { parseDanishNumber } from '@/components/seo/mockupKit'

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
