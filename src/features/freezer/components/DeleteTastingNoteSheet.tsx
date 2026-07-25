import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'

export interface DeleteTastingNoteSheetProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function DeleteTastingNoteSheet({
  open,
  onClose,
  onConfirm,
  isPending,
}: DeleteTastingNoteSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Delete review">
      <div className="space-y-4">
        <p className="text-[15px] text-ink">
          Delete this review? Its rating and tasting note will be permanently removed.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
