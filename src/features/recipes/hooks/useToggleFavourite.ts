import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleFavourite } from '@/lib/api/recipes'
import { mutationKeys, queryKeys } from '@/lib/query-keys'
import { useToast } from '@/app/ToastProvider'
import type { RecipeListRow, RecipeWithLines } from '@/types/domain'

interface ToggleFavouriteVars {
  id: string
  next: boolean
}

/**
 * Optimistic favourite toggle, exactly the pattern in docs/05 § Favouriting:
 * cancel in-flight fetches, snapshot, patch the cache immediately so the
 * heart flips with no perceptible delay, roll back and toast on failure,
 * settle with an invalidate either way.
 */
export function useToggleFavourite() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationKey: mutationKeys.toggleFavourite,
    mutationFn: ({ id, next }: ToggleFavouriteVars) => toggleFavourite(id, next),
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recipes.all })
      const previous = queryClient.getQueryData<RecipeListRow[]>(queryKeys.recipes.all)
      const previousDetails = queryClient.getQueriesData<RecipeWithLines>({
        predicate: (query) =>
          query.queryKey[0] === queryKeys.recipes.all[0] &&
          query.queryKey[1] === queryKeys.recipes.detail('')[1],
      })
      queryClient.setQueryData<RecipeListRow[]>(queryKeys.recipes.all, (old) =>
        old?.map((recipe) => (recipe.id === id ? { ...recipe, is_favourite: next } : recipe)),
      )
      queryClient.setQueriesData<RecipeWithLines>(
        {
          predicate: (query) =>
            query.queryKey[0] === queryKeys.recipes.all[0] &&
            query.queryKey[1] === queryKeys.recipes.detail('')[1],
        },
        (old) => (old?.id === id ? { ...old, is_favourite: next } : old),
      )
      return { previous, previousDetails }
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKeys.recipes.all, context?.previous)
      for (const [queryKey, recipe] of context?.previousDetails ?? []) {
        queryClient.setQueryData(queryKey, recipe)
      }
      showToast("Couldn't update favourite — try again", { variant: 'error' })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}
