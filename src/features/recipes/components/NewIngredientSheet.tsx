import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useCreateIngredient } from '@/features/recipes/hooks/useCreateIngredient'
import { useToast } from '@/app/ToastProvider'
import type { IngredientBasis, Ingredient } from '@/types/domain'

const INGREDIENT_CATEGORIES = [
  'biscuit',
  'confectionery',
  'dairy',
  'flavour',
  'fruit',
  'nut-butter',
  'nuts',
  'protein',
  'sweet',
  'texture',
] as const

const BASIS_OPTIONS: Array<{ value: IngredientBasis; label: string }> = [
  { value: 'per_100g', label: 'per 100g' },
  { value: 'per_100ml', label: 'per 100ml' },
  { value: 'per_item', label: 'per item' },
]

export interface NewIngredientSheetProps {
  open: boolean
  /** Pre-fills the name from whatever was typed into the picker's search box. */
  initialName: string
  onClose: () => void
  onCreated: (ingredient: Ingredient) => void
}

/**
 * The minimal "create a new ingredient" sheet for the recipe editor's
 * picker (docs/05 § The ingredient line editor; scoped down per docs/10
 * Task 23). Only name, macros per basis, and basis itself — Task 40's
 * canonical ingredient editor (density, volume, advanced fields) will
 * likely replace this outright rather than extend it.
 */
export function NewIngredientSheet({
  open,
  initialName,
  onClose,
  onCreated,
}: NewIngredientSheetProps) {
  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState<(typeof INGREDIENT_CATEGORIES)[number]>('flavour')
  const [basis, setBasis] = useState<IngredientBasis>('per_100g')
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [gramsPerItem, setGramsPerItem] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createIngredient = useCreateIngredient()
  const { showToast } = useToast()

  function reset(nextName: string) {
    setName(nextName)
    setCategory('flavour')
    setBasis('per_100g')
    setKcal('')
    setProteinG('')
    setCarbsG('')
    setFatG('')
    setGramsPerItem('')
    setError(null)
  }

  function handleClose() {
    reset(initialName)
    onClose()
  }

  function handleSubmit() {
    if (name.trim().length < 2) {
      setError('Give it a name.')
      return
    }
    if (basis === 'per_item' && !gramsPerItem) {
      setError('Per-item ingredients need a weight per item, in grams.')
      return
    }

    createIngredient.mutate(
      {
        name: name.trim(),
        category,
        basis,
        kcal: Number(kcal) || 0,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
        gramsPerItem: basis === 'per_item' ? Number(gramsPerItem) : null,
      },
      {
        onSuccess: (ingredient) => {
          showToast(`Added "${ingredient.name}" to the ingredient library`)
          onCreated(ingredient)
          reset('')
        },
        onError: () => setError("Couldn't save that ingredient — try again."),
      },
    )
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Create a new ingredient">
      <div className="space-y-4">
        <Field label="Name">
          {(props) => (
            <input
              {...props}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
            />
          )}
        </Field>

        <Field label="Category">
          {(props) => (
            <select
              {...props}
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof INGREDIENT_CATEGORIES)[number])}
              className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
            >
              {INGREDIENT_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Counted" hint="Per 100g, per 100ml, or per item (biscuits, sweets…)">
          {(props) => (
            <select
              {...props}
              value={basis}
              onChange={(event) => setBasis(event.target.value as IngredientBasis)}
              className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
            >
              {BASIS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        {basis === 'per_item' && (
          <Field label="Weight per item (g)">
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                min={0}
                value={gramsPerItem}
                onChange={(event) => setGramsPerItem(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Calories ${basis === 'per_item' ? '(per item)' : '(per 100)'}`}>
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                min={0}
                value={kcal}
                onChange={(event) => setKcal(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
          <Field label="Protein (g)">
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                min={0}
                value={proteinG}
                onChange={(event) => setProteinG(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
          <Field label="Carbs (g)">
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                min={0}
                value={carbsG}
                onChange={(event) => setCarbsG(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
          <Field label="Fat (g)">
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                min={0}
                value={fatG}
                onChange={(event) => setFatG(event.target.value)}
                className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
              />
            )}
          </Field>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-berry">
            {error}
          </p>
        )}

        <Button className="w-full" onClick={handleSubmit} disabled={createIngredient.isPending}>
          {createIngredient.isPending ? 'Saving…' : 'Add ingredient'}
        </Button>
      </div>
    </Sheet>
  )
}
