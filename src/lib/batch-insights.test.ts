import { describe, expect, it } from 'vitest'
import { computeMedian, computeMode, hasEnoughData } from '@/lib/batch-insights'

describe('computeMode', () => {
  it('returns null for no data', () => {
    expect(computeMode([])).toBeNull()
  })

  it('returns the most frequent value', () => {
    expect(computeMode([1, 1, 0, 2])).toBe(1)
  })

  it('breaks ties by the smaller value, for a deterministic result', () => {
    expect(computeMode([0, 1, 0, 1])).toBe(0)
  })

  it('handles a single value', () => {
    expect(computeMode([2, 2, 2])).toBe(2)
  })
})

describe('computeMedian', () => {
  it('returns null for no data', () => {
    expect(computeMedian([])).toBeNull()
  })

  it('returns the middle value for an odd count', () => {
    expect(computeMedian([30, 10, 20])).toBe(20)
  })

  it('averages the two middle values for an even count', () => {
    expect(computeMedian([10, 20, 30, 40])).toBe(25)
  })

  it('matches the documented example — typically 20ml of milk', () => {
    expect(computeMedian([15, 20, 25])).toBe(20)
  })
})

describe('hasEnoughData', () => {
  it('is false below the threshold of three', () => {
    expect(hasEnoughData(0)).toBe(false)
    expect(hasEnoughData(2)).toBe(false)
  })

  it('is true at three and above', () => {
    expect(hasEnoughData(3)).toBe(true)
    expect(hasEnoughData(4)).toBe(true)
  })
})
