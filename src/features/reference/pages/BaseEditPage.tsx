import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Pill } from '@/components/ui/Pill'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/app/ToastProvider'
import { useBases, useBaseUsage, useUpdateBase } from '@/features/reference/hooks/useBases'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { calculateBaseOnlyMacros } from '@/features/reference/lib/baseMacros'
import { formatCategoryLabel } from '@/features/reference/lib/ingredientCategory'
import type { BaseInput } from '@/lib/api/bases'
import type { AppSettings, BaseWithIngredients, Ingredient } from '@/types/domain'

const baseLineSchema = z.object({
  ingredient_id: z.string().min(1, 'Choose an ingredient'),
  quantity: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Must be 0 or more'),
  unit: z.enum(['g', 'ml', 'item']),
  note: z.string(),
})

const baseEditSchema = z
  .object({
    fill_ingredient_id: z.string().min(1, 'Choose the fill ingredient'),
    lines: z.array(baseLineSchema).min(1, 'Add at least one ingredient'),
  })
  .refine(
    (values) => values.lines.some((line) => line.ingredient_id === values.fill_ingredient_id),
    {
      message: 'Choose one of the base ingredients',
      path: ['fill_ingredient_id'],
    },
  )

type BaseEditFormValues = z.infer<typeof baseEditSchema>

export default function BaseEditPage() {
  const { key } = useParams<{ key: string }>()
  const basesQuery = useBases()
  const ingredientsQuery = useIngredients()
  const settingsQuery = useSettings()

  const isLoading = basesQuery.isLoading || ingredientsQuery.isLoading || settingsQuery.isLoading
  const isError = basesQuery.isError || ingredientsQuery.isError || settingsQuery.isError

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        message="Could not load this base."
        onRetry={() => {
          basesQuery.refetch()
          ingredientsQuery.refetch()
          settingsQuery.refetch()
        }}
      />
    )
  }

  const base = basesQuery.data?.find((candidate) => candidate.key === key)

  if (!base || !ingredientsQuery.data || !settingsQuery.data) {
    return (
      <ErrorState message="This base could not be found." onRetry={() => basesQuery.refetch()} />
    )
  }

  return (
    <BaseEditForm base={base} ingredients={ingredientsQuery.data} settings={settingsQuery.data} />
  )
}

interface BaseEditFormProps {
  base: BaseWithIngredients
  ingredients: Ingredient[]
  settings: AppSettings
}

function BaseEditForm({ base, ingredients, settings }: BaseEditFormProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const updateBase = useUpdateBase()
  const usage = useBaseUsage(base.id)
  const [pendingInput, setPendingInput] = useState<BaseInput | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: isValidating },
  } = useForm<BaseEditFormValues>({
    resolver: zodResolver(baseEditSchema),
    defaultValues: {
      fill_ingredient_id: base.fill_ingredient_id,
      lines: base.ingredients
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((line) => ({
          ingredient_id: line.ingredient_id,
          quantity: line.quantity,
          unit: line.unit as 'g' | 'ml' | 'item',
          note: line.note ?? '',
        })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLines = watch('lines')

  const ingredientsByCategory = useMemo(() => {
    const groups = new Map<string, Ingredient[]>()
    for (const ingredient of ingredients) {
      const group = groups.get(ingredient.category) ?? []
      group.push(ingredient)
      groups.set(ingredient.category, group)
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.name.localeCompare(b.name))
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [ingredients])

  const ingredientById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [ingredients],
  )

  const previewMacros = useMemo(() => {
    const previewBase: BaseWithIngredients = {
      ...base,
      ingredients: watchedLines
        .map((line, index) => {
          const ingredient = ingredientById.get(line.ingredient_id)
          if (!ingredient) return null
          return {
            id: `preview-${index}`,
            base_id: base.id,
            ingredient_id: line.ingredient_id,
            quantity: Number.isFinite(line.quantity) ? line.quantity : 0,
            unit: line.unit,
            note: line.note || null,
            sort_order: index,
            ingredient,
          }
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    }
    return calculateBaseOnlyMacros(previewBase, ingredients, settings)
  }, [base, ingredientById, ingredients, settings, watchedLines])

  function onValidated(values: BaseEditFormValues) {
    setPendingInput({
      fillIngredientId: values.fill_ingredient_id,
      ingredients: values.lines.map((line) => ({
        ingredient_id: line.ingredient_id,
        quantity: line.quantity,
        unit: line.unit,
        note: line.note.trim() ? line.note.trim() : null,
      })),
    })
  }

  async function handleConfirm() {
    if (!pendingInput) return
    try {
      await updateBase.mutateAsync({ id: base.id, input: pendingInput })
      showToast('Base updated.')
      setPendingInput(null)
      navigate('/bases')
    } catch {
      showToast('Could not save this base. Try again.', { variant: 'error' })
    }
  }

  const inputClasses =
    'h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] tracking-[-0.04em] text-ink">
          {base.name}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Edit quantities and swap ingredients. Changing this base changes every recipe built on it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onValidated)} className="space-y-4">
        <Field
          label="Fill ingredient"
          error={errors.fill_ingredient_id}
          hint="This ingredient is topped up to the freezer fill line before mix-ins."
        >
          {(fieldProps) => (
            <select {...register('fill_ingredient_id')} {...fieldProps} className={inputClasses}>
              {ingredientsByCategory.map(([category, categoryIngredients]) => (
                <optgroup key={category} label={formatCategoryLabel(category)}>
                  {categoryIngredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Field>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <Field label="Ingredient" error={errors.lines?.[index]?.ingredient_id}>
                {(fieldProps) => (
                  <select
                    {...register(`lines.${index}.ingredient_id`)}
                    {...fieldProps}
                    className={inputClasses}
                  >
                    {ingredientsByCategory.map(([category, categoryIngredients]) => (
                      <optgroup key={category} label={formatCategoryLabel(category)}>
                        {categoryIngredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Quantity" error={errors.lines?.[index]?.quantity}>
                {(fieldProps) => (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    {...fieldProps}
                    className={`${inputClasses} w-28`}
                  />
                )}
              </Field>
              <Field label="Unit">
                {(fieldProps) => (
                  <select
                    {...register(`lines.${index}.unit`)}
                    {...fieldProps}
                    className={`${inputClasses} w-24`}
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="item">item</option>
                  </select>
                )}
              </Field>
              <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end">
                <Field label="Note">
                  {(fieldProps) => (
                    <input
                      type="text"
                      {...register(`lines.${index}.note`)}
                      {...fieldProps}
                      className={`${inputClasses} w-32`}
                    />
                  )}
                </Field>
                <IconButton
                  aria-label="Remove line"
                  variant="ghost"
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </Card>
          ))}
        </div>

        {errors.lines?.root && (
          <p className="text-[13px] text-berry">{errors.lines.root.message}</p>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({ ingredient_id: ingredients[0]?.id ?? '', quantity: 0, unit: 'g', note: '' })
          }
        >
          <Plus size={16} aria-hidden="true" />
          Add ingredient
        </Button>

        <Card className="space-y-2 p-4">
          <h2 className="text-[13px] font-medium text-muted">Base-only macros, live</h2>
          <div className="flex flex-wrap gap-1.5">
            <Pill>{Math.round(previewMacros.perTub.kcal)} kcal</Pill>
            <Pill variant="protein">{previewMacros.perTub.protein_g.toFixed(1)}g protein</Pill>
            <Pill>{previewMacros.perTub.carbs_g.toFixed(1)}g carbs</Pill>
            <Pill>{previewMacros.perTub.fat_g.toFixed(1)}g fat</Pill>
          </div>
        </Card>

        <Button type="submit" disabled={isValidating}>
          Save base
        </Button>
      </form>

      <Sheet
        open={pendingInput !== null}
        onClose={() => setPendingInput(null)}
        title="Confirm change"
      >
        <p className="text-[15px] text-ink">
          {usage.isLoading
            ? 'Checking how many recipes this affects…'
            : usage.isError
              ? "Couldn't check how many recipes this affects — saving will still change all of them."
              : `This will change the macros of ${usage.data ?? 0} recipe${usage.data === 1 ? '' : 's'}.`}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={handleConfirm} disabled={updateBase.isPending}>
            {updateBase.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPendingInput(null)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
