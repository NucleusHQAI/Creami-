import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/lib/api/categories'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
    staleTime: REFERENCE_STALE_TIME,
  })
}
