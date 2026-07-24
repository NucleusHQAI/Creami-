import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPlan, removeFromPlan, setPlanMultiplier } from '@/lib/api/shopping'
import { queryKeys } from '@/lib/query-keys'

export function usePlan() {
  return useQuery({
    queryKey: queryKeys.shopping.plan,
    queryFn: fetchPlan,
  })
}

export function useRemoveFromPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeFromPlan,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.plan }),
  })
}

export function useSetPlanMultiplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recipeId, multiplier }: { recipeId: string; multiplier: number }) =>
      setPlanMultiplier(recipeId, multiplier),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.plan }),
  })
}
