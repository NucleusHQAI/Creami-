import { useQuery } from '@tanstack/react-query'
import { fetchRecipe } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'

/** A single recipe with its base and ingredient lines resolved, by slug — for the detail and edit pages. */
export function useRecipe(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(slug ?? ''),
    queryFn: () => {
      if (!slug) {
        throw new Error('useRecipe called without a slug')
      }
      return fetchRecipe(slug)
    },
    enabled: Boolean(slug),
  })
}
