import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markFinished } from '@/lib/api/batches'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useMarkFinished() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: mutationKeys.markFinished,
    mutationFn: ({ id, finishedAt }: { id: string; finishedAt: string }) =>
      markFinished(id, finishedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
