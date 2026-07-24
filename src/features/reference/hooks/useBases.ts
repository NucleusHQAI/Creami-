import { useQuery } from '@tanstack/react-query'
import { fetchBases } from '@/lib/api/bases'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useBases() {
  return useQuery({
    queryKey: queryKeys.bases.all,
    queryFn: fetchBases,
    staleTime: REFERENCE_STALE_TIME,
  })
}
