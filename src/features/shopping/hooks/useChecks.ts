import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/ToastProvider'
import { clearChecks, fetchChecks, setCheck } from '@/lib/api/shopping'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useChecks() {
  return useQuery({
    queryKey: queryKeys.shopping.checks,
    queryFn: fetchChecks,
  })
}

/**
 * Ticking must feel instant — standing in a shop on bad signal, a checkbox
 * that waits for a round trip is broken. Flip locally, write in the
 * background, roll back and toast on failure.
 */
export function useSetCheck() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationKey: mutationKeys.setCheck,
    mutationFn: ({ ingredientId, next }: { ingredientId: string; next: boolean }) =>
      setCheck(ingredientId, next),
    onMutate: async ({ ingredientId, next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shopping.checks })
      const previous = queryClient.getQueryData<Record<string, boolean>>(queryKeys.shopping.checks)
      queryClient.setQueryData<Record<string, boolean>>(queryKeys.shopping.checks, (old) => ({
        ...old,
        [ingredientId]: next,
      }))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.shopping.checks, context?.previous)
      showToast('Could not save that tick — try again.', { variant: 'error' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.checks }),
  })
}

export function useClearChecks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearChecks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopping.checks })
      queryClient.invalidateQueries({ queryKey: queryKeys.shopping.extras })
    },
  })
}
