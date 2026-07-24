import { useQuery } from '@tanstack/react-query'
import { fetchActiveBatches } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

/**
 * Freezing, ready-derived-from-freezing, and spun batches. Overrides the app
 * default of `refetchOnWindowFocus: false` — a stale "nothing ready" answer
 * is actively misleading here, so somebody opening the app in the morning
 * should be told immediately.
 */
export function useActiveBatches() {
  return useQuery({
    queryKey: queryKeys.batches.active,
    queryFn: fetchActiveBatches,
    refetchOnWindowFocus: true,
  })
}
