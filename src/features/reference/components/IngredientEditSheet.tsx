import { forwardRef, useMemo, useState, type InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/app/ToastProvider'
import {
  useDeleteIngredient,
  useIngredientUsage,
  useIngredients,
  useUpsertIngredient,
} from '@/features/reference/hooks/useIngredients'
import type { IngredientInput } from '@/lib/api/ingredients'
import type { Ingredient, IngredientBasis } from '@/types/domain'

export interface IngredientEditSheetProps {
  open: boolean
  onClose: () => void
  /** Present = edit this ingredient, absent = create a new one. */
  ingredientId?: string
  /** Pre-fills the name field when creating from a search term elsewhere (e.g. the recipe editor). */
  initialName?: string
  /** Called with the created/updated row once the save succeeds, before the sheet closes. */
  onSaved?: (ingredient: Ingredient) => void
}

const BASIS_OPTIONS: Array<{ value: IngredientBasis; label: string }> = [
  { value: 'per_100g', label: 'per 100g' },
  { value: 'per_100ml', label: 'per 100ml' },
  { value: 'per_item', label: 'per item' },
]

/**
 * The canonical ingredient editor — used standalone from `/ingredients` and,
 * per the seam this app relies on, inline from the recipe editor's
 * ingredient picker. Being a sheet rather than a route is what makes the
 * inline case work: opening it never navigates anywhere, so whatever screen
 * opened it keeps its own state untouched underneath.
 */
export function IngredientEditSheet({
  open,
  onClose,
  ingredientId,
  initialName,
  onSaved,
}: IngredientEditSheetProps) {
  const { data: ingredients, isLoading, isError, refetch } = useIngredients()

  return (
    <Sheet open={open} onClose={onClose} title={ingredientId ? 'Edit ingredient' : 'Add ingredient'}>
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}
      {isError && (
        <ErrorState message="Could not load the ingredient library." onRetry={() => refetch()} />
      )}
      {ingredients && (
        <IngredientEditForm
          key={ingredientId ?? initialName ?? 'create'}
          ingredientId={ingredientId}
          initialName={initialName}
          ingredients={ingredients}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Sheet>
  )
}

const ingredientFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    category: z.string().min(1, 'Choose a category'),
    basis: z.enum(['per_100g', 'per_100ml', 'per_item']),
    kcal: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Must be 0 or more'),
    protein_g: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Must be 0 or more'),
    carbs_g: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Must be 0 or more'),
    fat_g: z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Must be 0 or more'),
    grams_per_item: z.number().positive('Must be greater than 0').nullable(),
    density_g_per_ml: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be greater than 0'),
    grams_per_tsp: z.number().positive('Must be greater than 0').nullable(),
    negligible: z.boolean(),
    counts_toward_volume: z.boolean(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.basis === 'per_item' && value.grams_per_item === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grams_per_item'],
        message: 'Required for an item-based ingredient',
      })
    }
  })

type IngredientFormValues = z.infer<typeof ingredientFormSchema>

function usageMessage(usage: { recipes: number; bases: number }): string {
  const parts: string[] = []
  if (usage.recipes > 0) parts.push(`${usage.recipes} recipe${usage.recipes === 1 ? '' : 's'}`)
  if (usage.bases > 0) parts.push(`${usage.bases} base${usage.bases === 1 ? '' : 's'}`)
  return `Used by ${parts.join(' and ')}. Remove it from ${parts.length > 1 ? 'those' : 'that'} first.`
}

interface IngredientEditFormProps {
  ingredientId?: string
  initialName?: string
  ingredients: Ingredient[]
  onClose: () => void
  onSaved?: (ingredient: Ingredient) => void
}

function IngredientEditForm({
  ingredientId,
  initialName,
  ingredients,
  onClose,
  onSaved,
}: IngredientEditFormProps) {
  const { showToast } = useToast()
  const upsert = useUpsertIngredient()
  const remove = useDeleteIngredient()
  const usage = useIngredientUsage(ingredientId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const existing = ingredientId ? ingredients.find((row) => row.id === ingredientId) : undefined

  const categoryOptions = useMemo(() => {
    const set = new Set(ingredients.map((row) => row.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [ingredients])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          category: existing.category,
          basis: existing.basis as IngredientBasis,
          kcal: existing.kcal,
          protein_g: existing.protein_g,
          carbs_g: existing.carbs_g,
          fat_g: existing.fat_g,
          grams_per_item: existing.grams_per_item,
          density_g_per_ml: existing.density_g_per_ml,
          grams_per_tsp: existing.grams_per_tsp,
          negligible: existing.negligible,
          counts_toward_volume: existing.counts_toward_volume,
          notes: existing.notes ?? '',
        }
      : {
          name: initialName ?? '',
          category: categoryOptions[0] ?? '',
          basis: 'per_100g',
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          grams_per_item: null,
          density_g_per_ml: 1,
          grams_per_tsp: null,
          negligible: false,
          counts_toward_volume: true,
          notes: '',
        },
  })

  const basis = watch('basis')

  if (ingredientId && !existing) {
    return <p className="text-[13px] text-muted">This ingredient could not be found.</p>
  }

  async function onSubmit(values: IngredientFormValues) {
    const payload: IngredientInput & { id?: string } = {
      id: ingredientId,
      name: values.name.trim(),
      category: values.category,
      basis: values.basis,
      kcal: values.kcal,
      protein_g: values.protein_g,
      carbs_g: values.carbs_g,
      fat_g: values.fat_g,
      grams_per_item: values.basis === 'per_item' ? values.grams_per_item : null,
      density_g_per_ml: values.density_g_per_ml,
      grams_per_tsp: values.grams_per_tsp,
      negligible: values.negligible,
      counts_toward_volume: values.counts_toward_volume,
      notes: values.notes.trim() ? values.notes.trim() : null,
    }

    try {
      const saved = await upsert.mutateAsync(payload)
      showToast(ingredientId ? 'Ingredient updated.' : 'Ingredient created.')
      onSaved?.(saved)
      onClose()
    } catch {
      showToast('Could not save this ingredient. Try again.', { variant: 'error' })
    }
  }

  async function handleDelete() {
    if (!ingredientId) return
    try {
      await remove.mutateAsync(ingredientId)
      showToast('Ingredient deleted.')
      onClose()
    } catch {
      showToast('Could not delete this ingredient. Try again.', { variant: 'error' })
    }
  }

  const inputClasses =
    'h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Name" error={errors.name}>
        {(field) => <input type="text" {...register('name')} {...field} className={inputClasses} />}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" error={errors.category}>
          {(field) => (
            <select {...register('category')} {...field} className={inputClasses}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Basis" error={errors.basis}>
          {(field) => (
            <select {...register('basis')} {...field} className={inputClasses}>
              {BASIS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kcal" error={errors.kcal}>
          {(field) => (
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('kcal', { valueAsNumber: true })}
              {...field}
              className={inputClasses}
            />
          )}
        </Field>
        <Field label="Protein (g)" error={errors.protein_g}>
          {(field) => (
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('protein_g', { valueAsNumber: true })}
              {...field}
              className={inputClasses}
            />
          )}
        </Field>
        <Field label="Carbs (g)" error={errors.carbs_g}>
          {(field) => (
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('carbs_g', { valueAsNumber: true })}
              {...field}
              className={inputClasses}
            />
          )}
        </Field>
        <Field label="Fat (g)" error={errors.fat_g}>
          {(field) => (
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('fat_g', { valueAsNumber: true })}
              {...field}
              className={inputClasses}
            />
          )}
        </Field>
      </div>

      {basis === 'per_item' && (
        <Field label="Grams per item" error={errors.grams_per_item}>
          {(field) => (
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('grams_per_item', {
                setValueAs: (value) => (value === '' || value === undefined ? null : Number(value)),
              })}
              {...field}
              className={inputClasses}
            />
          )}
        </Field>
      )}

      <Field label="Grams per tsp" hint="Optional — powers the spoon helper." error={errors.grams_per_tsp}>
        {(field) => (
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            {...register('grams_per_tsp', {
              setValueAs: (value) => (value === '' || value === undefined ? null : Number(value)),
            })}
            {...field}
            className={inputClasses}
          />
        )}
      </Field>

      <SwitchField
        label="Negligible"
        hint="Contributes no meaningful macros at recipe quantities."
        {...register('negligible')}
      />

      <details className="rounded-soft border border-line bg-cream px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-medium text-ink">Advanced</summary>
        <div className="mt-3 space-y-4">
          <Field label="Density (g per ml)" error={errors.density_g_per_ml}>
            {(field) => (
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                {...register('density_g_per_ml', { valueAsNumber: true })}
                {...field}
                className={inputClasses}
              />
            )}
          </Field>
          <SwitchField
            label="Counts toward volume"
            hint="Included when working out how much room is left in the tub."
            {...register('counts_toward_volume')}
          />
        </div>
      </details>

      <Field label="Notes" hint="Shown in the library.">
        {(field) => (
          <textarea {...register('notes')} {...field} rows={3} className="w-full rounded-soft border border-line bg-cream px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2" />
        )}
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save ingredient'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {ingredientId && existing && (
        <div className="space-y-2 border-t border-line pt-4">
          <h3 className="text-[13px] font-medium text-muted">Delete this ingredient</h3>
          {existing.is_seed ? (
            <p className="text-[13px] text-muted">
              Seeded ingredients can&rsquo;t be deleted, but you can edit them above.
            </p>
          ) : usage.isLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : usage.isError ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-berry">Couldn&rsquo;t check whether this ingredient is in use.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => usage.refetch()}>
                Try again
              </Button>
            </div>
          ) : usage.data && (usage.data.recipes > 0 || usage.data.bases > 0) ? (
            <p className="text-[13px] text-muted">{usageMessage(usage.data)}</p>
          ) : confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-ink">Delete &ldquo;{existing.name}&rdquo;?</span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={remove.isPending}
              >
                {remove.isPending ? 'Deleting…' : 'Confirm delete'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              Delete ingredient
            </Button>
          )}
        </div>
      )}
    </form>
  )
}

interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string
  hint?: string
}

// A checkbox styled as a pill switch. Built locally rather than reusing a
// shared primitive — there is no Switch in components/ui yet, and this is
// the only screen in this task's scope that needs one. Wrapped in
// forwardRef so react-hook-form's `register` ref reaches the real DOM
// checkbox — without it RHF can't set the initial checked state to match
// `defaultValues`, and an existing ingredient's switches would render off
// regardless of their saved value.
const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(function SwitchField(
  { label, hint, ...inputProps },
  ref,
) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-soft border border-line bg-cream px-4 py-3">
      <span>
        <span className="block text-[15px] text-ink">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...inputProps} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-pill bg-line transition-colors peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-berry peer-focus-visible:outline-offset-2"
      >
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-paper transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
})
