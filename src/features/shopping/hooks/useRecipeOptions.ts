import { useQuery } from '@tanstack/react-query'
import { fetchRecipeOptions } from '@/lib/api/shopping'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

/** The minimal recipe list the "Add recipes" sheet searches over. */
export function useRecipeOptions() {
  return useQuery({
    queryKey: queryKeys.shopping.recipeOptions,
    queryFn: fetchRecipeOptions,
    staleTime: REFERENCE_STALE_TIME,
  })
}
