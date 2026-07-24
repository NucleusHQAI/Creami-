import { useState } from 'react'
import { format } from 'date-fns'
import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { RatingStars } from '@/components/ui/RatingStars'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/app/ToastProvider'
import { useTastingNotes } from '@/features/freezer/hooks/useTastingNotes'
import { useRecipeRatings } from '@/features/freezer/hooks/useRecipeRatings'
import { useCreateTastingNote } from '@/features/freezer/hooks/useCreateTastingNote'
import { TastingNoteForm } from '@/features/freezer/components/TastingNoteForm'

export interface RatingsSectionProps {
  recipeId: string
}

/**
 * Fully self-contained — fetches its own data, makes no assumptions about a
 * parent layout, so it can be dropped straight into the recipe detail page.
 */
export function RatingsSection({ recipeId }: RatingsSectionProps) {
  const [addingNote, setAddingNote] = useState(false)
  const {
    data: notes,
    isLoading: notesLoading,
    isError: notesError,
    refetch: refetchNotes,
  } = useTastingNotes(recipeId)
  const { data: ratings, isLoading: ratingsLoading } = useRecipeRatings(recipeId)
  const { mutate: createTastingNote, isPending } = useCreateTastingNote()
  const { showToast } = useToast()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-[-0.025em] text-ink">Ratings and notes</h2>
        {!ratingsLoading && ratings && ratings.average_rating !== null && (
          <p className="font-mono text-[13px] text-ink">
            ★ {ratings.average_rating} ({ratings.rating_count ?? 0})
          </p>
        )}
      </div>

      {notesLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {notesError && <ErrorState message="Could not load notes." onRetry={() => refetchNotes()} />}

      {!notesLoading && !notesError && notes?.length === 0 && (
        <EmptyState
          icon={MessageSquarePlus}
          title="No tasting notes yet"
          message="Add one after a batch to start tracking how it turns out."
          action={
            <Button variant="secondary" size="sm" onClick={() => setAddingNote(true)}>
              Add a note
            </Button>
          }
        />
      )}

      {!notesLoading && !notesError && notes && notes.length > 0 && (
        <>
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="space-y-1.5 p-4">
                <div className="flex items-center justify-between gap-3">
                  {note.rating != null ? (
                    <RatingStars value={note.rating} size={14} />
                  ) : (
                    <span />
                  )}
                  <p className="font-mono text-[11px] text-muted">
                    {format(new Date(note.created_at), 'd MMMM yyyy')}
                  </p>
                </div>
                {note.notes && <p className="text-[14px] text-ink">{note.notes}</p>}
                {note.batch?.frozen_at && (
                  <p className="text-[12px] text-muted">
                    From the batch made on {format(new Date(note.batch.frozen_at), 'd MMMM')}
                  </p>
                )}
              </Card>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setAddingNote(true)}>
            Add a note
          </Button>
        </>
      )}

      {addingNote && (
        <Sheet open onClose={() => setAddingNote(false)} title="Add a note">
          <TastingNoteForm
            isSubmitting={isPending}
            onCancel={() => setAddingNote(false)}
            onSubmit={(value) => {
              createTastingNote(
                { recipeId, ...value },
                {
                  onSuccess: () => {
                    showToast('Note saved.')
                    setAddingNote(false)
                  },
                  onError: () => showToast('Could not save that note. Try again.', { variant: 'error' }),
                },
              )
            }}
          />
        </Sheet>
      )}
    </section>
  )
}
