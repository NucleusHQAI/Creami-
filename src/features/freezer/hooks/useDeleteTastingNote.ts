import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTastingNote } from '@/lib/api/tasting-notes'
import { queryKeys } from '@/lib/query-keys'

/** Callers pass the recipeId alongside the note id so the right caches are invalidated. */
export function useDeleteTastingNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; recipeId: string }) => deleteTastingNote(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tastingNotes.forRecipe(variables.recipeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeRatings.forRecipe(variables.recipeId) })
    },
  })
}
