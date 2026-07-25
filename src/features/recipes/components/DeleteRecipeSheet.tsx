import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'

export interface DeleteRecipeSheetProps {
  open: boolean
  recipeName: string
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

/** Confirmation sheet naming the recipe, per docs/05 § Deleting. */
export function DeleteRecipeSheet({
  open,
  recipeName,
  onClose,
  onConfirm,
  isPending,
}: DeleteRecipeSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Delete recipe">
      <div className="space-y-4">
        <p className="text-[15px] text-ink">
          Delete <span className="font-medium">“{recipeName}”</span>? It will disappear from your
          recipe list, but any batches you've logged for it stay in your freezer history. You can
          undo this for the next 10 seconds.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={isPending}>
            Delete
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
