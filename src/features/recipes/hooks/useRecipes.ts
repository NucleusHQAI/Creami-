import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMadeCounts, fetchRecipeList, fetchRecipesWithLines } from '@/lib/api/recipes'
import { queryKeys, type RecipeFilters } from '@/lib/query-keys'
import { useCategories } from '@/features/reference/hooks/useCategories'
import { useRecipeListMacros } from '@/features/recipes/hooks/useRecipeListMacros'
import type { RecipeListRow, RecipeWithLines } from '@/types/domain'

export interface RecipeListItem {
  recipe: RecipeListRow
  kcal: number | null
  proteinG: number | null
}

function matchesSearch(
  recipe: RecipeListRow,
  lines: RecipeWithLines | undefined,
  term: string,
): boolean {
  const haystack = [
    recipe.name,
    recipe.profile,
    recipe.base_name,
    ...(lines?.ingredients.map((line) => line.display) ?? []),
  ]
  return haystack.some((value) => value?.toLowerCase().includes(term))
}

/**
 * The recipe list: fetches recipe_list_view once (queryKeys.recipes.all —
 * the same cache entry the optimistic favourite toggle patches) plus the
 * full recipe+ingredient data needed for macros and ingredient-text search,
 * then applies search/filter/sort in memory. Per docs/05 § Search, this is
 * all client-side — forty rows is nothing, so filters never trigger a fetch.
 */
export function useRecipes(filters: RecipeFilters = {}) {
  const listQuery = useQuery({
    queryKey: queryKeys.recipes.all,
    queryFn: fetchRecipeList,
  })
  const linesQuery = useQuery({
    queryKey: queryKeys.recipes.withLines,
    queryFn: fetchRecipesWithLines,
  })
  const { data: categories } = useCategories()
  const madeCountsQuery = useQuery({
    queryKey: queryKeys.recipes.madeCounts,
    queryFn: fetchMadeCounts,
    enabled: filters.sort === 'madeCount',
    staleTime: 1000 * 60,
  })

  const macrosById = useRecipeListMacros(linesQuery.data)

  const items = useMemo<RecipeListItem[] | undefined>(() => {
    if (!listQuery.data) {
      return undefined
    }

    const linesById = new Map((linesQuery.data ?? []).map((recipe) => [recipe.id, recipe]))
    const categorySortOrder = new Map((categories ?? []).map((c) => [c.key, c.sort_order]))
    const term = filters.search?.trim().toLowerCase() ?? ''

    let rows = listQuery.data.filter((recipe): recipe is RecipeListRow & { id: string } =>
      Boolean(recipe.id),
    )

    if (filters.categoryKey) {
      rows = rows.filter((recipe) => recipe.category_key === filters.categoryKey)
    }
    if (filters.favouritesOnly) {
      rows = rows.filter((recipe) => recipe.is_favourite === true)
    }
    if (term) {
      rows = rows.filter((recipe) => matchesSearch(recipe, linesById.get(recipe.id), term))
    }

    const sorted = [...rows].sort((a, b) => {
      switch (filters.sort) {
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '')
        case 'recent':
          return (b.created_at ?? '').localeCompare(a.created_at ?? '')
        case 'rating':
          return (b.average_rating ?? -1) - (a.average_rating ?? -1)
        case 'madeCount': {
          const madeCounts = madeCountsQuery.data
          const countA = madeCounts?.get(a.id) ?? 0
          const countB = madeCounts?.get(b.id) ?? 0
          return countB - countA
        }
        case 'category':
        default: {
          const orderA = categorySortOrder.get(a.category_key ?? '') ?? 0
          const orderB = categorySortOrder.get(b.category_key ?? '') ?? 0
          return orderA - orderB || (a.name ?? '').localeCompare(b.name ?? '')
        }
      }
    })

    return sorted.map((recipe) => ({
      recipe,
      kcal: macrosById.get(recipe.id)?.perTub.kcal ?? null,
      proteinG: macrosById.get(recipe.id)?.perTub.protein_g ?? null,
    }))
  }, [listQuery.data, linesQuery.data, categories, macrosById, madeCountsQuery.data, filters])

  return {
    items,
    isLoading: listQuery.isLoading || linesQuery.isLoading,
    isError: listQuery.isError || linesQuery.isError,
    error: listQuery.error ?? linesQuery.error,
    refetch: () => {
      void listQuery.refetch()
      void linesQuery.refetch()
    },
  }
}
