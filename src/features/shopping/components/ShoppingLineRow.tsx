import type { ShoppingLine, ShoppingRecipeRef } from '@/features/shopping/types'
import { formatShoppingQuantity } from '@/lib/units'

export interface ShoppingLineRowProps {
  line: ShoppingLine
  checked: boolean
  onToggle: () => void
}

function formatRecipeTag(ref: ShoppingRecipeRef): string {
  return ref.multiplier === 1 ? ref.name : `${ref.name} ×${ref.multiplier}`
}

export function ShoppingLineRow({ line, checked, onToggle }: ShoppingLineRowProps) {
  if (line.kind === 'freeText') {
    return (
      <li className="flex items-start gap-3 border-b border-line/60 py-3 last:border-b-0">
        <span
          className="mt-0.5 h-5 w-5 shrink-0 rounded-soft border border-dashed border-line"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-[15px] text-ink">{line.text}</p>
          <p className="text-[13px] text-muted">{line.recipeName}</p>
        </div>
      </li>
    )
  }

  const quantityLabel =
    line.quantity !== null && line.unit !== null
      ? line.unit === 'item'
        ? String(line.quantity)
        : formatShoppingQuantity(line.quantity, line.unit)
      : null

  return (
    <li
      className={`flex items-start gap-3 border-b border-line/60 py-3 last:border-b-0 ${checked ? 'opacity-50' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`${checked ? 'Untick' : 'Tick'} ${line.name}`}
        className="mt-0.5 h-5 w-5 shrink-0 rounded-soft border border-line accent-berry"
      />
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-[15px] text-ink ${checked ? 'line-through' : ''}`}>{line.name}</span>
          {quantityLabel && <span className="font-mono text-[13px] text-ink">{quantityLabel}</span>}
        </div>
        {line.recipes.length > 0 && (
          <p className="text-[13px] text-muted">{line.recipes.map(formatRecipeTag).join(', ')}</p>
        )}
      </div>
    </li>
  )
}
