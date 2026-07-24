import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteBatch } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
