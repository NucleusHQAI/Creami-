import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRecipeList } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'

/** Every recipe slug currently in use, for the editor's uniqueness check — excludes the recipe being edited, if any. */
export function useExistingSlugs(excludeSlug?: string): ReadonlySet<string> {
  const { data } = useQuery({ queryKey: queryKeys.recipes.all, queryFn: fetchRecipeList })

  return useMemo(() => {
    const slugs = (data ?? [])
      .map((recipe) => recipe.slug)
      .filter((slug): slug is string => Boolean(slug) && slug !== excludeSlug)
    return new Set(slugs)
  }, [data, excludeSlug])
}
