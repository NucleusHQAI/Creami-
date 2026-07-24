import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/app/ToastProvider'
import { useCreateTastingNote } from '@/features/freezer/hooks/useCreateTastingNote'
import { TastingNoteForm } from '@/features/freezer/components/TastingNoteForm'
import type { BatchWithRecipe } from '@/lib/api/batches'

export interface FinishedRatingPromptProps {
  batch: BatchWithRecipe
  open: boolean
  onClose: () => void
}

/** Prompted once when a batch is marked finished — dismissible, never insisted on. */
export function FinishedRatingPrompt({ batch, open, onClose }: FinishedRatingPromptProps) {
  const { mutate: createTastingNote, isPending } = useCreateTastingNote()
  const { showToast } = useToast()

  return (
    <Sheet open={open} onClose={onClose} title="How was it?">
      <div className="space-y-4">
        <p className="text-[15px] text-ink">
          {batch.recipe?.name ?? 'This batch'} is finished — worth a rating while it's fresh?
        </p>
        <TastingNoteForm
          submitLabel="Save rating"
          cancelLabel="Not now"
          isSubmitting={isPending}
          onCancel={onClose}
          onSubmit={(value) => {
            createTastingNote(
              { recipeId: batch.recipe_id, batchId: batch.id, ...value },
              {
                onSuccess: () => {
                  showToast('Thanks — saved.')
                  onClose()
                },
                onError: () => {
                  showToast('Could not save that rating. Try again.', { variant: 'error' })
                },
              },
            )
          }}
        />
      </div>
    </Sheet>
  )
}
