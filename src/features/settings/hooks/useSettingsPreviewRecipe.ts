import { useQuery } from '@tanstack/react-query'
import { fetchSettingsPreviewRecipe } from '@/lib/api/settings'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

/** The one seeded recipe ("Vanilla Custard") used to preview MAX FILL and default-milk changes. */
export function useSettingsPreviewRecipe() {
  return useQuery({
    queryKey: queryKeys.settings.previewRecipe,
    queryFn: fetchSettingsPreviewRecipe,
    staleTime: REFERENCE_STALE_TIME,
  })
}
