import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTastingNote } from '@/lib/api/tasting-notes'
import { queryKeys } from '@/lib/query-keys'

interface UpdateTastingNoteVariables {
  id: string
  recipeId: string
  rating?: number
  notes?: string
}

export function useUpdateTastingNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating, notes }: UpdateTastingNoteVariables) =>
      updateTastingNote({ id, rating, notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tastingNotes.forRecipe(variables.recipeId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipeRatings.forRecipe(variables.recipeId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.history })
    },
  })
}
