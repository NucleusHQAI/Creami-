import { describe, expect, it } from 'vitest'
import { normaliseSourceLine } from '@/features/recipes/import/normalise-source-line'
import type { Ingredient } from '@/types/domain'

function ingredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: 'ingredient',
    slug: 'cocoa',
    name: 'Cocoa powder',
    category: 'flavour',
    basis: 'per_100g',
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    density_g_per_ml: 1,
    grams_per_item: null,
    grams_per_tsp: null,
    negligible: false,
    counts_toward_volume: true,
    notes: null,
    is_seed: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('normaliseSourceLine', () => {
  it.each([
    ['2 g cocoa', 2],
    ['2.5 g cocoa', 2.5],
    ['1/2 g cocoa', 0.5],
    ['1 1/2 g cocoa', 1.5],
    ['½ g cocoa', 0.5],
    ['1½ g cocoa', 1.5],
  ])('parses %s', (source, expected) => {
    expect(normaliseSourceLine(source, ingredient()).quantity).toBeCloseTo(expected)
  })

  it.each([
    ['1 kg cocoa', 1000, 'g'],
    ['2 oz cocoa', 56.699, 'g'],
    ['1 lb cocoa', 453.592, 'g'],
    ['1 l milk', 1000, 'ml'],
    ['2 fl oz milk', 59.147, 'ml'],
  ] as const)('converts %s conservatively', (source, quantity, unit) => {
    const result = normaliseSourceLine(source, ingredient({ basis: 'per_100ml' }))
    expect(result.quantity).toBeCloseTo(quantity, 2)
    expect(result.unit).toBe(unit)
  })

  it('converts liquid cups but not solid cups', () => {
    expect(
      normaliseSourceLine('1 cup milk', ingredient({ basis: 'per_100ml' })).quantity,
    ).toBeCloseTo(236.588)
    expect(normaliseSourceLine('1 cup sprinkles', ingredient()).warning).toMatch(/solid cup/i)
  })

  it('uses grams per teaspoon for solid spoon measures', () => {
    const result = normaliseSourceLine('2 tbsp cocoa', ingredient({ grams_per_tsp: 2.5 }))
    expect(result.quantity).toBe(15)
    expect(result.unit).toBe('g')
  })

  it('parses item counts and removes preparation notes', () => {
    const result = normaliseSourceLine(
      '2 items digestive biscuits (crushed), divided',
      ingredient({ basis: 'per_item', grams_per_item: 13 }),
    )
    expect(result.quantity).toBe(2)
    expect(result.unit).toBe('item')
    expect(result.ingredientText).toBe('digestive biscuits')
  })

  it('flags missing quantities and ranges for review', () => {
    expect(normaliseSourceLine('vanilla extract').warning).toMatch(/no quantity/i)
    expect(normaliseSourceLine('1-2 tbsp cocoa', ingredient()).warning).toMatch(/ranges/i)
  })
})
