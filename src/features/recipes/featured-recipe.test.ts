import { describe, expect, it } from 'vitest'
import {
  FEATURED_RECIPE_ROTATION_MS,
  getFeaturedRecipePeriod,
  selectFeaturedRecipe,
} from '@/features/recipes/featured-recipe'
import type { RecipeListItem } from '@/features/recipes/hooks/useRecipes'

function recipe(id: string, slug: string): RecipeListItem {
  return {
    recipe: {
      id,
      slug,
    },
    kcal: null,
    proteinG: null,
  } as RecipeListItem
}

const recipes = [recipe('3', 'vanilla'), recipe('1', 'chocolate'), recipe('2', 'strawberry')]

describe('featured recipe rotation', () => {
  it('keeps the same period for three days', () => {
    expect(getFeaturedRecipePeriod(0)).toBe(0)
    expect(getFeaturedRecipePeriod(FEATURED_RECIPE_ROTATION_MS - 1)).toBe(0)
    expect(getFeaturedRecipePeriod(FEATURED_RECIPE_ROTATION_MS)).toBe(1)
  })

  it('advances to the next recipe in each period', () => {
    expect(selectFeaturedRecipe(recipes, 0)?.recipe.slug).toBe('chocolate')
    expect(selectFeaturedRecipe(recipes, 1)?.recipe.slug).toBe('strawberry')
    expect(selectFeaturedRecipe(recipes, 2)?.recipe.slug).toBe('vanilla')
    expect(selectFeaturedRecipe(recipes, 3)?.recipe.slug).toBe('chocolate')
  })

  it('does not depend on the current display order', () => {
    expect(selectFeaturedRecipe(recipes, 1)?.recipe.id).toBe(
      selectFeaturedRecipe([...recipes].reverse(), 1)?.recipe.id,
    )
  })

  it('handles a list with no recipes', () => {
    expect(selectFeaturedRecipe([], 0)).toBeUndefined()
  })
})
