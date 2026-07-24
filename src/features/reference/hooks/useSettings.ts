import { useQuery } from '@tanstack/react-query'
import { fetchSettings } from '@/lib/api/settings'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: fetchSettings,
    staleTime: REFERENCE_STALE_TIME,
  })
}
