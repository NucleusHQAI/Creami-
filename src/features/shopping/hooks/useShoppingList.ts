import { useMemo } from 'react'
import { buildShoppingList } from '@/features/shopping/aggregate'
import type { ShoppingGroup } from '@/features/shopping/types'
import { usePlan } from '@/features/shopping/hooks/usePlan'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings } from '@/features/reference/hooks/useSettings'
import type { Ingredient } from '@/types/domain'

export interface UseShoppingListResult {
  groups: ShoppingGroup[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Derives the shopping list from the plan on every render — it is never
 * stored, so it can never go stale. Composes the plan, the ingredient
 * library and settings, all through their own query hooks, and hands them
 * to the pure aggregator.
 */
export function useShoppingList(includeOptional: boolean): UseShoppingListResult {
  const planQuery = usePlan()
  const ingredientsQuery = useIngredients()
  const settingsQuery = useSettings()

  const ingredientMap = useMemo(() => {
    const map = new Map<string, Ingredient>()
    for (const ingredient of ingredientsQuery.data ?? []) {
      map.set(ingredient.id, ingredient)
    }
    return map
  }, [ingredientsQuery.data])

  const groups = useMemo(() => {
    if (!planQuery.data || !settingsQuery.data || !ingredientsQuery.data) return []
    return buildShoppingList({
      plan: planQuery.data,
      ingredients: ingredientMap,
      settings: {
        maxFillMl: settingsQuery.data.max_fill_ml,
        servingsPerTub: settingsQuery.data.servings_per_tub,
        defaultMilkIngredientId: settingsQuery.data.default_milk_ingredient_id,
      },
      includeOptional,
    })
  }, [planQuery.data, settingsQuery.data, ingredientsQuery.data, ingredientMap, includeOptional])

  return {
    groups,
    isLoading: planQuery.isLoading || ingredientsQuery.isLoading || settingsQuery.isLoading,
    isError: planQuery.isError || ingredientsQuery.isError || settingsQuery.isError,
    refetch: () => {
      void planQuery.refetch()
      void ingredientsQuery.refetch()
      void settingsQuery.refetch()
    },
  }
}
