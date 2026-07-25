import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertRecipe, type RecipeInput } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'

/**
 * Saves a recipe (create or edit — `input.id` decides which). On success,
 * invalidates the list, the search/macro source, and this recipe's detail
 * cache, per docs/05 § Saving.
 */
export function useSaveRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RecipeInput) => upsertRecipe(input),
    onSuccess: (recipe) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.withLines })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.slug) })
    },
  })
}
