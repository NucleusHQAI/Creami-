import { useEffect, useMemo, useState } from 'react'
import {
  FEATURED_RECIPE_ROTATION_MS,
  getFeaturedRecipePeriod,
  selectFeaturedRecipe,
} from '@/features/recipes/featured-recipe'
import type { RecipeListItem } from '@/features/recipes/hooks/useRecipes'

export function useRotatingFeaturedRecipe(
  items: readonly RecipeListItem[] | undefined,
): RecipeListItem | undefined {
  const [period, setPeriod] = useState(getFeaturedRecipePeriod)

  useEffect(() => {
    const nextRotation = (period + 1) * FEATURED_RECIPE_ROTATION_MS
    const timeout = window.setTimeout(
      () => setPeriod(getFeaturedRecipePeriod()),
      Math.max(0, nextRotation - Date.now() + 100),
    )

    return () => window.clearTimeout(timeout)
  }, [period])

  return useMemo(() => selectFeaturedRecipe(items, period), [items, period])
}
