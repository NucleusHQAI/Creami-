import { useQuery } from '@tanstack/react-query'
import { fetchIngredientUsageCounts } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'

/** How often each ingredient is used across every recipe — sorts the editor's ingredient picker with the most-used at the top. */
export function useIngredientUsageCounts() {
  return useQuery({
    queryKey: queryKeys.ingredients.usageCounts,
    queryFn: fetchIngredientUsageCounts,
    staleTime: 1000 * 60,
  })
}
