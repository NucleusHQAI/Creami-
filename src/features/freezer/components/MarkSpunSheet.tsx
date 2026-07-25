import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Stepper } from '@/components/ui/Stepper'
import { useToast } from '@/app/ToastProvider'
import { useMarkSpun } from '@/features/freezer/hooks/useMarkSpun'

export interface MarkSpunSheetProps {
  batchId: string
  recipeName: string
  open: boolean
  onClose: () => void
}

export function MarkSpunSheet({ batchId, recipeName, open, onClose }: MarkSpunSheetProps) {
  const { mutate: markSpun, isPending } = useMarkSpun()
  const { showToast } = useToast()

  const [respins, setRespins] = useState(0)
  const [milkMl, setMilkMl] = useState('')
  const [notes, setNotes] = useState('')

  function reset() {
    setRespins(0)
    setMilkMl('')
    setNotes('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function submit(input: { respins: number; milkMl?: number; notes?: string }) {
    markSpun(
      { id: batchId, input, spunAt: new Date().toISOString() },
      {
        onSuccess: () => {
          showToast(`${recipeName} marked as spun.`)
          handleClose()
        },
        onError: () => {
          showToast('Could not mark that batch spun. Try again.', { variant: 'error' })
        },
      },
    )
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Mark as spun">
      <div className="space-y-5">
        <p className="font-display text-xl tracking-[-0.025em] text-ink">{recipeName}</p>

        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Re-spins</span>
          <Stepper label="re-spins" value={respins} onChange={setRespins} min={0} max={3} />
        </div>

        <Field label="Milk added" hint="Optional — suggested 15–30ml">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="number"
              inputMode="numeric"
              min={0}
              value={milkMl}
              onChange={(event) => setMilkMl(event.target.value)}
              placeholder="ml"
              className="h-11 w-full rounded-soft border border-line bg-paper px-3 text-[15px] text-ink placeholder:text-muted"
            />
          )}
        </Field>

        <Field label="Notes" hint="Optional">
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="w-full rounded-soft border border-line bg-paper px-3 py-2 text-[15px] text-ink"
            />
          )}
        </Field>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              submit({
                respins,
                milkMl: milkMl.trim() ? Number(milkMl) : undefined,
                notes: notes.trim() || undefined,
              })
            }
            disabled={isPending}
          >
            Mark as spun
          </Button>
          <Button variant="ghost" onClick={() => submit({ respins: 0 })} disabled={isPending}>
            Just mark it spun
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
