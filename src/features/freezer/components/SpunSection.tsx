import { useState } from 'react'
import { formatDistance } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/app/ToastProvider'
import { useMarkFinished } from '@/features/freezer/hooks/useMarkFinished'
import { useCreateTastingNote } from '@/features/freezer/hooks/useCreateTastingNote'
import { TastingNoteForm } from '@/features/freezer/components/TastingNoteForm'
import { FinishedRatingPrompt } from '@/features/freezer/components/FinishedRatingPrompt'
import type { BatchWithRecipe } from '@/lib/api/batches'

export interface SpunSectionProps {
  batches: BatchWithRecipe[]
}

/** Tubs currently being eaten — "Mark finished" and "Add a note" on each. */
export function SpunSection({ batches }: SpunSectionProps) {
  const { mutate: markFinished, isPending: isFinishing } = useMarkFinished()
  const { mutate: createTastingNote, isPending: isSavingNote } = useCreateTastingNote()
  const { showToast } = useToast()

  const [noteTarget, setNoteTarget] = useState<BatchWithRecipe | null>(null)
  const [finishedTarget, setFinishedTarget] = useState<BatchWithRecipe | null>(null)

  function handleMarkFinished(batch: BatchWithRecipe) {
    markFinished(batch.id, {
      onSuccess: () => setFinishedTarget(batch),
      onError: () => showToast('Could not mark that batch finished. Try again.', { variant: 'error' }),
    })
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl tracking-[-0.025em] text-ink">Spun, not finished</h2>
      <div className="space-y-3">
        {batches.map((batch) => (
          <Card
            key={batch.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg text-ink">{batch.recipe?.name ?? 'Recipe'}</p>
              {batch.spun_at && (
                <p className="text-[13px] text-muted">
                  Spun {formatDistance(new Date(batch.spun_at), new Date(), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setNoteTarget(batch)}>
                Add a note
              </Button>
              <Button size="sm" onClick={() => handleMarkFinished(batch)} disabled={isFinishing}>
                Mark finished
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {noteTarget && (
        <Sheet open onClose={() => setNoteTarget(null)} title="Add a note">
          <TastingNoteForm
            isSubmitting={isSavingNote}
            onCancel={() => setNoteTarget(null)}
            onSubmit={(value) => {
              createTastingNote(
                { recipeId: noteTarget.recipe_id, batchId: noteTarget.id, ...value },
                {
                  onSuccess: () => {
                    showToast('Note saved.')
                    setNoteTarget(null)
                  },
                  onError: () => showToast('Could not save that note. Try again.', { variant: 'error' }),
                },
              )
            }}
          />
        </Sheet>
      )}

      {finishedTarget && (
        <FinishedRatingPrompt
          batch={finishedTarget}
          open
          onClose={() => setFinishedTarget(null)}
        />
      )}
    </section>
  )
}
