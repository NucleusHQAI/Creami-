import { useQuery } from '@tanstack/react-query'
import { fetchAdaptationRules } from '@/lib/api/recipe-import'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useAdaptationRules(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adaptationRules.all,
    queryFn: fetchAdaptationRules,
    staleTime: REFERENCE_STALE_TIME,
    enabled,
  })
}
