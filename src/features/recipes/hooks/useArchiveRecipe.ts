import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveRecipe, restoreRecipe } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/app/ToastProvider'

interface DeletableRecipe {
  id: string
  slug: string
  name: string
}

/**
 * Soft delete with a 10-second undo toast, per docs/05 § Deleting. The
 * confirmation sheet (naming the recipe) lives in the detail page; this hook
 * only owns the archive/restore mutations and the undo toast.
 */
export function useArchiveRecipe() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  function invalidate(slug: string) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.withLines })
    void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) })
  }

  const archiveMutation = useMutation({ mutationFn: archiveRecipe })
  const restoreMutation = useMutation({ mutationFn: restoreRecipe })

  function archiveWithUndo(recipe: DeletableRecipe, onArchived?: () => void) {
    archiveMutation.mutate(recipe.id, {
      onSuccess: () => {
        invalidate(recipe.slug)
        onArchived?.()
        showToast(`Deleted "${recipe.name}"`, {
          actionLabel: 'Undo',
          durationMs: 10000,
          onAction: () => {
            restoreMutation.mutate(recipe.id, {
              onSuccess: () => invalidate(recipe.slug),
              onError: () => showToast("Couldn't restore recipe", { variant: 'error' }),
            })
          },
        })
      },
      onError: () => showToast("Couldn't delete recipe — try again", { variant: 'error' }),
    })
  }

  return { archiveWithUndo, isPending: archiveMutation.isPending }
}
