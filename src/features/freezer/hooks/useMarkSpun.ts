import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markSpun, type MarkSpunInput } from '@/lib/api/batches'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useMarkSpun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: mutationKeys.markSpun,
    mutationFn: ({
      id,
      input,
      spunAt,
    }: {
      id: string
      input: MarkSpunInput
      spunAt: string
    }) => markSpun(id, input, spunAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all })
    },
  })
}
