import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markFinished } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

export function useMarkFinished() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markFinished(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
