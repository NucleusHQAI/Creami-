import { describe, expect, it } from 'vitest'
import { describeBaseLine, describeRecipeLine } from '@/features/recipes/ingredient-display'
import type { BaseIngredient, Ingredient, RecipeIngredient } from '@/types/domain'

const milk = { id: 'ing-1', name: 'Skimmed milk' } as Ingredient

function recipeLine(
  overrides: Partial<RecipeIngredient> = {},
  ingredient: Ingredient | null = milk,
): RecipeIngredient & { ingredient: Ingredient | null } {
  return {
    id: 'line-1',
    recipe_id: 'recipe-1',
    ingredient_id: 'ing-1',
    role: 'addition',
    quantity: 5,
    unit: 'g',
    display: '1 tsp vanilla',
    optional: false,
    free_text: null,
    sort_order: 0,
    ingredient,
    ...overrides,
  }
}

describe('describeRecipeLine', () => {
  it('scales the quantity rather than trusting the stored display text', () => {
    const line = recipeLine({ quantity: 10, unit: 'g' })
    expect(describeRecipeLine(line, 0.5)).toMatchObject({ label: 'Skimmed milk', quantity: '5g' })
  })

  it('renders free-text lines with no quantity', () => {
    const line = recipeLine(
      {
        ingredient_id: null,
        quantity: null,
        unit: null,
        free_text: 'a squeeze of whatever citrus is about',
      },
      null,
    )
    expect(describeRecipeLine(line, 1)).toEqual({
      id: 'line-1',
      label: 'a squeeze of whatever citrus is about',
      quantity: null,
      isFreeText: true,
      optional: false,
    })
  })

  it('carries the optional flag through', () => {
    const line = recipeLine({ optional: true })
    expect(describeRecipeLine(line, 1).optional).toBe(true)
  })
})

describe('describeBaseLine', () => {
  it('scales base ingredient quantities', () => {
    const line = {
      id: 'base-line-1',
      base_id: 'base-1',
      ingredient_id: 'ing-1',
      quantity: 100,
      unit: 'ml',
      sort_order: 0,
      note: null,
      ingredient: milk,
    } as BaseIngredient & { ingredient: Ingredient }
    expect(describeBaseLine(line, 2)).toMatchObject({ label: 'Skimmed milk', quantity: '200ml' })
  })
})
