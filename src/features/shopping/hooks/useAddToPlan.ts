import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/ToastProvider'
import { addToPlan } from '@/lib/api/shopping'
import { queryKeys } from '@/lib/query-keys'

/**
 * Adds a recipe to the shopping plan. This is the seam a recipe detail
 * page's "Add to shopping list" overflow item calls — `mutate(recipeId)`.
 * Also used by the shopping page's own "Add recipes" sheet, so there's one
 * place this behaviour lives.
 */
export function useAddToPlan() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (recipeId: string) => addToPlan(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopping.plan })
      showToast('Added to your shopping list')
    },
    onError: () => {
      showToast('Could not add that to your shopping list', { variant: 'error' })
    },
  })
}
