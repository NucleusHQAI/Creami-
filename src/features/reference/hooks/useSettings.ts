import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from '@/lib/api/settings'
import { queryKeys } from '@/lib/query-keys'
import type { AppSettings } from '@/types/domain'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: fetchSettings,
    staleTime: REFERENCE_STALE_TIME,
  })
}

/**
 * Every macro figure in the app depends on settings — MAX FILL and the
 * default milk are read live by the macro engine, and freeze hours feeds the
 * batch-ready trigger. Saving invalidates settings itself plus every recipe
 * query, so nothing in the app is left showing a stale calculation.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<AppSettings>) => updateSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      // `recipes.all` is the shared prefix ['recipes'] — invalidating it also
      // invalidates every `recipes.detail(id)` and `recipes.list(filters)`
      // query, since TanStack Query matches by key prefix.
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}
