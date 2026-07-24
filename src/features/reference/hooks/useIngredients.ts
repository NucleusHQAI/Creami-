import { useQuery } from '@tanstack/react-query'
import { fetchIngredients } from '@/lib/api/ingredients'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60 // Ingredients, bases and categories change perhaps monthly.

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients.all,
    queryFn: fetchIngredients,
    staleTime: REFERENCE_STALE_TIME,
  })
}
