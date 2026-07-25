import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/app/ToastProvider'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { useCreateBatch } from '@/features/freezer/hooks/useCreateBatch'
import { computeReadyAt, formatReadyAt } from '@/lib/freezer-status'

export interface LogBatchSheetProps {
  recipeId: string
  recipeName: string
  open: boolean
  onClose: () => void
}

function toLocalInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Reachable from a recipe's detail page ("Log a batch") and from the freezer
 * screen's floating action button. Two taps in the common case: open, then
 * confirm — the time defaults to now and notes are optional.
 */
export function LogBatchSheet({ recipeId, recipeName, open, onClose }: LogBatchSheetProps) {
  const { data: settings } = useSettings()
  const { mutate: createBatch, isPending } = useCreateBatch()
  const { showToast } = useToast()

  const [showTimeInput, setShowTimeInput] = useState(false)
  const [frozenAt, setFrozenAt] = useState(() => new Date())
  const [notes, setNotes] = useState('')

  function reset() {
    setShowTimeInput(false)
    setFrozenAt(new Date())
    setNotes('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleConfirm() {
    createBatch(
      { recipeId, frozenAt, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          showToast(`Logged ${recipeName}.`)
          handleClose()
        },
        onError: () => {
          showToast('Could not log that batch. Try again.', { variant: 'error' })
        },
      },
    )
  }

  const readyAt = settings ? computeReadyAt(frozenAt, settings.freeze_hours) : null

  return (
    <Sheet open={open} onClose={handleClose} title="Log a batch">
      <div className="space-y-5">
        <div>
          <p className="text-[13px] text-muted">Recipe</p>
          <p className="font-display text-xl tracking-[-0.025em] text-ink">{recipeName}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] text-muted">When did it go in</p>
          {!showTimeInput ? (
            <div className="flex items-center justify-between">
              <p className="text-[15px] text-ink">Now</p>
              <button
                type="button"
                onClick={() => setShowTimeInput(true)}
                className="text-[13px] font-medium text-ink underline underline-offset-2"
              >
                Set a different time
              </button>
            </div>
          ) : (
            <Field label="Went into the freezer at">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="datetime-local"
                  value={toLocalInputValue(frozenAt)}
                  onChange={(event) => {
                    if (!event.target.value) return
                    setFrozenAt(new Date(event.target.value))
                  }}
                  className="h-11 w-full rounded-soft border border-line bg-paper px-3 text-[15px] text-ink"
                />
              )}
            </Field>
          )}
        </div>

        <Field label="Notes" hint="Optional">
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Anything worth remembering about this batch"
              className="w-full rounded-soft border border-line bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-muted"
            />
          )}
        </Field>

        <p className="rounded-soft bg-line/30 px-3 py-2 text-[13px] text-ink">
          {readyAt ? `Ready to spin ${formatReadyAt(readyAt)}.` : 'Calculating ready time…'}
        </p>

        <Button className="w-full" onClick={handleConfirm} disabled={isPending}>
          {isPending ? 'Logging…' : 'Log batch'}
        </Button>
      </div>
    </Sheet>
  )
}
