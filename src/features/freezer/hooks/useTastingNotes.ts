import { useQuery } from '@tanstack/react-query'
import { fetchTastingNotes } from '@/lib/api/tasting-notes'
import { queryKeys } from '@/lib/query-keys'

export function useTastingNotes(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.tastingNotes.forRecipe(recipeId),
    queryFn: () => fetchTastingNotes(recipeId),
  })
}
