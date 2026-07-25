import { useState, type DragEvent } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { IngredientPicker } from '@/features/recipes/components/IngredientPicker'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import type { RecipeFormValues } from '@/features/recipes/recipe-form-schema'
import type { Ingredient } from '@/types/domain'
import type { Unit } from '@/lib/macros/types'

function defaultUnitFor(ingredient: Ingredient): Unit {
  if (ingredient.basis === 'per_100ml') return 'ml'
  if (ingredient.basis === 'per_item') return 'item'
  return 'g'
}

function buildAutoDisplay(ingredient: Ingredient, quantity: number | null, unit: Unit | null): string {
  if (quantity === null || unit === null) return ingredient.name
  return `${quantity}${unit} ${ingredient.name.toLowerCase()}`
}

export interface IngredientLineRowProps {
  control: Control<RecipeFormValues>
  setValue: UseFormSetValue<RecipeFormValues>
  name: 'additions' | 'mixins'
  index: number
  isFirst: boolean
  isLast: boolean
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDragStart: () => void
  onDragOver: (event: DragEvent) => void
  onDrop: () => void
}

/** One row of the ingredient line editor: picker, quantity/unit, optional toggle, reorder, remove — docs/05 § The ingredient line editor. */
export function IngredientLineRow({
  control,
  setValue,
  name,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}: IngredientLineRowProps) {
  const line = useWatch({ control, name: `${name}.${index}` })
  const { data: ingredients } = useIngredients()
  const ingredient = ingredients?.find((i) => i.id === line.ingredientId)
  const [displayEdited, setDisplayEdited] = useState(false)

  function patch(next: Partial<typeof line>) {
    setValue(`${name}.${index}`, { ...line, ...next }, { shouldDirty: true, shouldValidate: true })
  }

  function handleSelectIngredient(selected: Ingredient) {
    const unit = defaultUnitFor(selected)
    setDisplayEdited(false)
    patch({
      ingredientId: selected.id,
      freeText: null,
      unit,
      display: buildAutoDisplay(selected, line.quantity, unit),
    })
  }

  function handleSetFreeText(text: string) {
    setDisplayEdited(false)
    patch({ ingredientId: null, freeText: text, quantity: null, unit: null, display: text })
  }

  function handleQuantityChange(quantity: number | null) {
    const next: Partial<typeof line> = { quantity }
    if (ingredient && !displayEdited) {
      next.display = buildAutoDisplay(ingredient, quantity, line.unit)
    }
    patch(next)
  }

  function handleUnitChange(unit: Unit) {
    const next: Partial<typeof line> = { unit }
    if (ingredient && !displayEdited) {
      next.display = buildAutoDisplay(ingredient, line.quantity, unit)
    }
    patch(next)
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="space-y-2 rounded-soft border border-line bg-cream p-3"
    >
      <div className="flex items-start gap-2">
        <span className="mt-2 cursor-grab text-muted" aria-hidden="true">
          <GripVertical size={16} />
        </span>

        <div className="flex-1 space-y-2">
          <IngredientPicker
            ariaLabel="Ingredient"
            ingredientId={line.ingredientId}
            freeText={line.freeText}
            onSelectIngredient={handleSelectIngredient}
            onSetFreeText={handleSetFreeText}
          />

          {line.ingredientId && (
            <QuantityInput
              quantity={line.quantity}
              unit={line.unit}
              onQuantityChange={handleQuantityChange}
              onUnitChange={handleUnitChange}
              gramsPerTsp={ingredient?.grams_per_tsp}
            />
          )}

          <label className="block text-[13px] text-muted">
            Shown as
            <input
              type="text"
              value={line.display}
              onChange={(event) => {
                setDisplayEdited(true)
                patch({ display: event.target.value })
              }}
              className="mt-1 h-10 w-full rounded-soft border border-line bg-paper px-3 text-[14px] text-ink focus-visible:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={line.optional}
              onChange={(event) => patch({ optional: event.target.checked })}
              className="h-4 w-4 rounded border-line"
            />
            Optional
          </label>
        </div>

        <div className="flex flex-col items-center gap-1">
          <IconButton aria-label="Move up" onClick={onMoveUp} disabled={isFirst} className="h-8 w-8">
            <ChevronUp size={14} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Move down" onClick={onMoveDown} disabled={isLast} className="h-8 w-8">
            <ChevronDown size={14} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Remove line" onClick={onRemove} className="h-8 w-8 text-berry">
            <X size={14} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </li>
  )
}
