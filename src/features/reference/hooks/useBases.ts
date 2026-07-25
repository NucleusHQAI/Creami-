import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countBaseUsage, fetchBases, updateBase, type BaseInput } from '@/lib/api/bases'
import { queryKeys } from '@/lib/query-keys'

const REFERENCE_STALE_TIME = 1000 * 60 * 60

export function useBases() {
  return useQuery({
    queryKey: queryKeys.bases.all,
    queryFn: fetchBases,
    staleTime: REFERENCE_STALE_TIME,
  })
}

/** How many recipes are built on a base — the count named in the "this will change…" warning. */
export function useBaseUsage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bases.usage(id ?? 'none'),
    queryFn: () => countBaseUsage(id as string),
    enabled: Boolean(id),
  })
}

/**
 * Replaces a base's ingredient lines. Recipe macros are derived live from
 * `bases.all`, so invalidating it is enough to recalculate every recipe
 * built on this base without touching the recipes themselves.
 */
export function useUpdateBase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BaseInput }) => updateBase(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bases.all })
    },
  })
}
