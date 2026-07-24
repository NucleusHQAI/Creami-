import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { RatingStars } from '@/components/ui/RatingStars'

export interface TastingNoteFormValue {
  rating?: number
  notes?: string
}

export interface TastingNoteFormProps {
  onSubmit: (value: TastingNoteFormValue) => void
  onCancel?: () => void
  cancelLabel?: string
  submitLabel?: string
  isSubmitting?: boolean
}

/** The rating-plus-text form shared by every place a tasting note can be created. */
export function TastingNoteForm({
  onSubmit,
  onCancel,
  cancelLabel = 'Skip',
  submitLabel = 'Save note',
  isSubmitting = false,
}: TastingNoteFormProps) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    onSubmit({
      rating: rating > 0 ? rating : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[13px] text-muted">Rating</p>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <Field label="Notes" hint="Optional">
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Too icy, blend the fruit longer"
            className="w-full rounded-soft border border-line bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-muted"
          />
        )}
      </Field>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
