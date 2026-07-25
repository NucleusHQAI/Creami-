import { useQuery } from '@tanstack/react-query'
import { fetchBatchesForRecipe } from '@/lib/api/batches'
import { queryKeys } from '@/lib/query-keys'

/** Every batch ever logged for a recipe, for the "made N times" insights. */
export function useRecipeBatches(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.batches.forRecipe(recipeId),
    queryFn: () => fetchBatchesForRecipe(recipeId),
  })
}
