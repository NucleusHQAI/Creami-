import { useQuery } from '@tanstack/react-query'
import { fetchBatches } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

/** Finished batches, most recent first, for the freezer screen's collapsed History section. */
export function useBatchHistory(enabled = true) {
  return useQuery({
    queryKey: queryKeys.batches.history,
    queryFn: () => fetchBatches(['finished']),
    enabled,
  })
}
