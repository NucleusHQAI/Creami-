import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markSpun, type MarkSpunInput } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

export function useMarkSpun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarkSpunInput }) => markSpun(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
