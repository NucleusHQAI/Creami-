import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  countIngredientUsage,
  deleteIngredient,
  fetchIngredients,
  upsertIngredient,
  type IngredientInput,
} from '@/lib/api/ingredients'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60 // Ingredients, bases and categories change perhaps monthly.

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients.all,
    queryFn: fetchIngredients,
    staleTime: REFERENCE_STALE_TIME,
  })
}

/** Recipes and bases referencing an ingredient — powers the delete guard in the editor sheet. */
export function useIngredientUsage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ingredients.usage(id ?? 'none'),
    queryFn: () => countIngredientUsage(id as string),
    enabled: Boolean(id),
  })
}

/**
 * Creates a new ingredient (no `id` on the input) or updates an existing
 * one. Every recipe and base's macros are derived live from the ingredient
 * library, so invalidating `ingredients.all` is enough to ripple the change
 * through the whole app — no recipe or base data itself needs to change.
 */
export function useUpsertIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: IngredientInput & { id?: string }) => upsertIngredient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all })
    },
  })
}
