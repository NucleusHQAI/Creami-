import { useMemo } from 'react'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useBases } from '@/features/reference/hooks/useBases'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { computeRecipeMacros } from '@/features/recipes/hooks/useRecipeMacros'
import type { MacroResult } from '@/lib/macros/types'
import type { RecipeWithLines } from '@/types/domain'

/**
 * Computes per-tub macros for a whole set of recipes at once — the recipe
 * list needs kcal/protein for every card, and recipe_list_view deliberately
 * excludes macros (they depend on live settings, not stored data). Reuses
 * the same engine binding as `useRecipeMacros`, just applied per recipe
 * inside one memo instead of one hook call per card.
 */
export function useRecipeListMacros(
  recipes: RecipeWithLines[] | undefined,
): Map<string, MacroResult> {
  const { data: ingredients } = useIngredients()
  const { data: bases } = useBases()
  const { data: settings } = useSettings()

  return useMemo(() => {
    const results = new Map<string, MacroResult>()
    if (!recipes || !ingredients || !bases || !settings) {
      return results
    }
    for (const recipe of recipes) {
      const result = computeRecipeMacros(recipe, ingredients, bases, settings)
      if (result) {
        results.set(recipe.id, result)
      }
    }
    return results
  }, [recipes, ingredients, bases, settings])
}
