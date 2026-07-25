import { useState, type DragEvent } from 'react'
import { useFieldArray, type Control, type UseFormSetValue } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IngredientLineRow } from '@/features/recipes/components/IngredientLineRow'
import { emptyIngredientLine, type RecipeFormValues } from '@/features/recipes/recipe-form-schema'

export interface IngredientLinesEditorProps {
  control: Control<RecipeFormValues>
  setValue: UseFormSetValue<RecipeFormValues>
  name: 'additions' | 'mixins'
  title: string
  addLabel: string
}

/**
 * The additions/mixins line editor (docs/05 § The ingredient line editor).
 * Reordering works two ways: drag on pointer devices, up/down buttons for
 * touch — "do not ship drag-only".
 */
export function IngredientLinesEditor({
  control,
  setValue,
  name,
  title,
  addLabel,
}: IngredientLinesEditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function handleDrop(targetIndex: number) {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      move(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-[-0.02em] text-ink">{title}</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyIngredientLine())}>
          <Plus size={14} aria-hidden="true" />
          {addLabel}
        </Button>
      </div>

      {fields.length === 0 && <p className="text-[13px] text-muted">No lines yet.</p>}

      <ul className="space-y-2">
        {fields.map((field, index) => (
          <IngredientLineRow
            key={field.id}
            control={control}
            setValue={setValue}
            name={name}
            index={index}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
            onRemove={() => remove(index)}
            onMoveUp={() => index > 0 && move(index, index - 1)}
            onMoveDown={() => index < fields.length - 1 && move(index, index + 1)}
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(event: DragEvent) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
          />
        ))}
      </ul>
    </div>
  )
}
