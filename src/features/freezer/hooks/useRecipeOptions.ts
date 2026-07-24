import { useQuery } from '@tanstack/react-query'
import { fetchRecipeOptions } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

/** The "which recipe" list for the freezer screen's log-a-batch floating action button. */
export function useRecipeOptions() {
  return useQuery({
    queryKey: queryKeys.recipeOptions.all,
    queryFn: fetchRecipeOptions,
    staleTime: REFERENCE_STALE_TIME,
  })
}
