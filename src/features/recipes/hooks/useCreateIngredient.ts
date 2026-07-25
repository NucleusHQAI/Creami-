import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createIngredient } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'

/**
 * The minimal "create a new ingredient" mutation used by the recipe editor's
 * ingredient picker when nothing in the library matches (docs/05 § The
 * ingredient line editor). Task 40 owns the canonical ingredient editor —
 * this just keeps the recipe editor moving in the meantime.
 */
export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all })
    },
  })
}
