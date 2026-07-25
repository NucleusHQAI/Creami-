import { ShoppingCart, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/app/ToastProvider'
import { useOnlineStatus } from '@/lib/online-status'

export interface RecipeActionButtonsProps {
  /** Optional — see RecipeOverflowMenu for why these default to a toast rather than being required. */
  onAddToShoppingList?: () => void
  onLogBatch?: () => void
}

/** Section 10 of the recipe detail page — full-width, easy-to-hit primary actions. */
export function RecipeActionButtons({ onAddToShoppingList, onLogBatch }: RecipeActionButtonsProps) {
  const { showToast } = useToast()
  const isOnline = useOnlineStatus()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button
        size="lg"
        disabled={!isOnline}
        title={!isOnline ? 'Reconnect to log a batch.' : undefined}
        onClick={onLogBatch ?? (() => showToast('Log a batch — coming soon'))}
      >
        <Snowflake size={18} aria-hidden="true" />
        Log a batch
      </Button>
      <Button
        variant="secondary"
        size="lg"
        disabled={!isOnline}
        title={!isOnline ? 'Reconnect to change the shopping plan.' : undefined}
        onClick={onAddToShoppingList ?? (() => showToast('Add to shopping list — coming soon'))}
      >
        <ShoppingCart size={18} aria-hidden="true" />
        Add to shopping list
      </Button>
    </div>
  )
}
