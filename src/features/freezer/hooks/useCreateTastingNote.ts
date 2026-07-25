import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTastingNote } from '@/lib/api/tasting-notes'
import { queryKeys } from '@/lib/query-keys'

export function useCreateTastingNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTastingNote,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tastingNotes.forRecipe(variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeRatings.forRecipe(variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}
