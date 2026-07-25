import type { RecipeListItem } from '@/features/recipes/hooks/useRecipes'

const DAY_MS = 24 * 60 * 60 * 1000

export const FEATURED_RECIPE_ROTATION_MS = 3 * DAY_MS

export function getFeaturedRecipePeriod(now = Date.now()): number {
  return Math.floor(now / FEATURED_RECIPE_ROTATION_MS)
}

export function selectFeaturedRecipe(
  items: readonly RecipeListItem[] | undefined,
  period: number,
): RecipeListItem | undefined {
  if (!items?.length) {
    return undefined
  }

  const candidates = [...items].sort((a, b) => {
    const slugComparison = (a.recipe.slug ?? '').localeCompare(b.recipe.slug ?? '')
    return slugComparison || (a.recipe.id ?? '').localeCompare(b.recipe.id ?? '')
  })

  const index = ((period % candidates.length) + candidates.length) % candidates.length
  return candidates[index]
}
