import { useQuery } from '@tanstack/react-query'
import { fetchRecipeRatings } from '@/lib/api/tasting-notes'
import { queryKeys } from '@/lib/query-keys'

export function useRecipeRatings(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.recipeRatings.forRecipe(recipeId),
    queryFn: () => fetchRecipeRatings(recipeId),
  })
}
