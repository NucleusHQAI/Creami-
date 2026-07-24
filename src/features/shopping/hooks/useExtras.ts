import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/ToastProvider'
import { addExtra, deleteExtra, fetchExtras, toggleExtra } from '@/lib/api/shopping'
import { queryKeys } from '@/lib/query-keys'
import type { ShoppingExtra } from '@/types/domain'

export function useExtras() {
  return useQuery({
    queryKey: queryKeys.shopping.extras,
    queryFn: fetchExtras,
  })
}

export function useAddExtra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ label, category }: { label: string; category?: string }) =>
      addExtra(label, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.extras }),
  })
}

export function useDeleteExtra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExtra,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.extras }),
  })
}

/**
 * Ticking an extra must feel instant — flip locally, write in the
 * background, roll back and toast on failure. Same pattern as favouriting
 * (docs/05-feature-recipes.md § Favouriting).
 */
export function useToggleExtra() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleExtra(id, next),
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shopping.extras })
      const previous = queryClient.getQueryData<ShoppingExtra[]>(queryKeys.shopping.extras)
      queryClient.setQueryData<ShoppingExtra[]>(
        queryKeys.shopping.extras,
        (old) => old?.map((extra) => (extra.id === id ? { ...extra, is_checked: next } : extra)),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.shopping.extras, context?.previous)
      showToast('Could not save that tick — try again.', { variant: 'error' })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.extras }),
  })
}
