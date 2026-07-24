import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBatch } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

export function useCreateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
