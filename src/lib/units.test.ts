import { describe, expect, it } from 'vitest'
import { formatQuantity, toGrams, toMillilitres } from '@/lib/units'

const water = { density_g_per_ml: 1, grams_per_item: null }
const oil = { density_g_per_ml: 0.92, grams_per_item: null }
const biscuit = { density_g_per_ml: 1, grams_per_item: 14 }

describe('toGrams', () => {
  it('passes grams through unchanged', () => {
    expect(toGrams(50, 'g', water)).toBe(50)
  })

  it('converts millilitres using density', () => {
    expect(toGrams(100, 'ml', oil)).toBeCloseTo(92, 5)
  })

  it('converts items using grams per item', () => {
    expect(toGrams(2, 'item', biscuit)).toBe(28)
  })

  it('treats a missing grams_per_item as zero', () => {
    expect(toGrams(3, 'item', water)).toBe(0)
  })
})

describe('toMillilitres', () => {
  it('divides grams by density', () => {
    expect(toMillilitres(92, 'g', oil)).toBeCloseTo(100, 5)
  })
})

describe('formatQuantity', () => {
  it('shows a pinch under half a gram, never a bare 0', () => {
    expect(formatQuantity(0, 'g')).toBe('a pinch')
    expect(formatQuantity(0.2, 'g')).toBe('a pinch')
    expect(formatQuantity(0.49, 'ml')).toBe('a pinch')
  })

  it('keeps one decimal place under 10g/ml', () => {
    expect(formatQuantity(0.5, 'g')).toBe('0.5g')
    expect(formatQuantity(7.46, 'ml')).toBe('7.5ml')
    expect(formatQuantity(9.94, 'g')).toBe('9.9g')
  })

  it('rounds to whole numbers at 10 and above', () => {
    expect(formatQuantity(10, 'g')).toBe('10g')
    expect(formatQuantity(393.4, 'ml')).toBe('393ml')
    expect(formatQuantity(196.7, 'ml')).toBe('197ml')
  })

  it('renders clean item fractions as glyphs', () => {
    expect(formatQuantity(0.5, 'item')).toBe('½')
    expect(formatQuantity(1.5, 'item')).toBe('1½')
    expect(formatQuantity(0.25, 'item')).toBe('¼')
    expect(formatQuantity(2, 'item')).toBe('2')
  })

  it('falls back to one decimal for item quantities with no clean glyph', () => {
    expect(formatQuantity(1.1, 'item')).toBe('1.1')
  })
})
