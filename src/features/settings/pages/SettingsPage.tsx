import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useBases } from '@/features/reference/hooks/useBases'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings, useUpdateSettings } from '@/features/reference/hooks/useSettings'
import { useExportData } from '@/features/settings/hooks/useExportData'
import { useSettingsPreviewRecipe } from '@/features/settings/hooks/useSettingsPreviewRecipe'
import { downloadJson } from '@/features/settings/lib/downloadJson'
import { calculateRecipePreview } from '@/features/settings/lib/previewMacros'
import type { AppSettings, BaseWithIngredients, Ingredient } from '@/types/domain'

const APP_VERSION = '0.1.0'
const REPO_URL = 'https://github.com/NucleusHQAI/Creami-'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
        Settings
      </h1>

      <SettingsFormSection />
      <AccountSection />
      <AboutSection />
      <ExportSection />
    </div>
  )
}

function SettingsFormSection() {
  const settingsQuery = useSettings()
  const ingredientsQuery = useIngredients()
  const basesQuery = useBases()

  const isLoading = settingsQuery.isLoading || ingredientsQuery.isLoading || basesQuery.isLoading
  const isError = settingsQuery.isError || ingredientsQuery.isError || basesQuery.isError

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !settingsQuery.data || !ingredientsQuery.data || !basesQuery.data) {
    return (
      <ErrorState
        message="Could not load settings."
        onRetry={() => {
          settingsQuery.refetch()
          ingredientsQuery.refetch()
          basesQuery.refetch()
        }}
      />
    )
  }

  return (
    <SettingsForm
      settings={settingsQuery.data}
      ingredients={ingredientsQuery.data}
      bases={basesQuery.data}
    />
  )
}

const settingsSchema = z.object({
  max_fill_ml: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(100, 'Must be at least 100ml')
    .max(2000, 'Must be 2000ml or less'),
  default_milk_ingredient_id: z.string().min(1, 'Choose a default milk'),
  freeze_hours: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(1, 'Must be at least 1 hour')
    .max(168, 'Must be 168 hours or less'),
  servings_per_tub: z.number({ invalid_type_error: 'Enter a number' }).min(1, 'Must be at least 1'),
  standard_method: z.string().trim().min(1, 'The standard method cannot be empty'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  settings: AppSettings
  ingredients: Ingredient[]
  bases: BaseWithIngredients[]
}

function SettingsForm({ settings, ingredients, bases }: SettingsFormProps) {
  const { showToast } = useToast()
  const updateSettings = useUpdateSettings()
  const previewRecipeQuery = useSettingsPreviewRecipe()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      max_fill_ml: settings.max_fill_ml,
      default_milk_ingredient_id: settings.default_milk_ingredient_id ?? '',
      freeze_hours: settings.freeze_hours,
      servings_per_tub: settings.servings_per_tub,
      standard_method: settings.standard_method,
    },
  })

  const milkOptions = useMemo(
    () =>
      ingredients
        .filter((ingredient) => ingredient.category === 'dairy' && ingredient.basis === 'per_100ml')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [ingredients],
  )

  const watchedMaxFill = watch('max_fill_ml')
  const watchedMilkId = watch('default_milk_ingredient_id')

  const previewRecipe = previewRecipeQuery.data
  const previewBase = previewRecipe ? bases.find((base) => base.id === previewRecipe.base_id) : undefined

  const preview = useMemo(() => {
    if (!previewRecipe || !previewBase) return null

    const before = calculateRecipePreview(previewRecipe, previewBase, ingredients, {
      maxFillMl: settings.max_fill_ml,
      servingsPerTub: settings.servings_per_tub,
      defaultMilkIngredientId: settings.default_milk_ingredient_id,
    })
    const after = calculateRecipePreview(previewRecipe, previewBase, ingredients, {
      maxFillMl: Number.isFinite(watchedMaxFill) ? watchedMaxFill : settings.max_fill_ml,
      servingsPerTub: settings.servings_per_tub,
      defaultMilkIngredientId: watchedMilkId || settings.default_milk_ingredient_id,
    })

    return { name: previewRecipe.name, before: before.perServing.kcal, after: after.perServing.kcal }
  }, [previewRecipe, previewBase, ingredients, settings, watchedMaxFill, watchedMilkId])

  async function onSubmit(values: SettingsFormValues) {
    try {
      const saved = await updateSettings.mutateAsync(values)
      reset({
        max_fill_ml: saved.max_fill_ml,
        default_milk_ingredient_id: saved.default_milk_ingredient_id ?? '',
        freeze_hours: saved.freeze_hours,
        servings_per_tub: saved.servings_per_tub,
        standard_method: saved.standard_method,
      })
      showToast('Settings saved.')
    } catch {
      showToast('Could not save settings. Try again.', { variant: 'error' })
    }
  }

  const inputClasses =
    'h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="MAX FILL volume (ml)" error={errors.max_fill_ml} hint="Recalculates every recipe's derived fill and macros.">
        {(field) => (
          <input
            type="number"
            inputMode="decimal"
            step="any"
            {...register('max_fill_ml', { valueAsNumber: true })}
            {...field}
            className={inputClasses}
          />
        )}
      </Field>

      <Field label="Default milk" error={errors.default_milk_ingredient_id} hint="Swaps the fill ingredient everywhere.">
        {(field) => (
          <select {...register('default_milk_ingredient_id')} {...field} className={inputClasses}>
            <option value="" disabled>
              Choose a milk…
            </option>
            {milkOptions.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      {preview && (
        <p role="status" className="text-[13px] text-muted">
          {preview.name}: {Math.round(preview.before)} kcal → {Math.round(preview.after)} kcal per
          serving
        </p>
      )}

      <Field
        label="Freeze hours"
        error={errors.freeze_hours}
        hint="Used by the timer for new batches only — batches already freezing keep their original ready time."
      >
        {(field) => (
          <input
            type="number"
            inputMode="numeric"
            step="1"
            {...register('freeze_hours', { valueAsNumber: true })}
            {...field}
            className={inputClasses}
          />
        )}
      </Field>

      <Field label="Servings per tub" error={errors.servings_per_tub} hint="Divides the per-serving figures.">
        {(field) => (
          <input
            type="number"
            inputMode="numeric"
            step="1"
            {...register('servings_per_tub', { valueAsNumber: true })}
            {...field}
            className={inputClasses}
          />
        )}
      </Field>

      <Field label="Standard method" error={errors.standard_method} hint="Shown on recipes with no override.">
        {(field) => (
          <textarea
            {...register('standard_method')}
            {...field}
            rows={5}
            className="w-full rounded-soft border border-line bg-cream px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2"
          />
        )}
      </Field>

      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}

function AccountSection() {
  const { session, signOut } = useAuth()
  const { showToast } = useToast()

  async function handleSignOut() {
    await signOut()
    showToast('Signed out.')
  }

  return (
    <section aria-labelledby="account-heading" className="space-y-2">
      <h2 id="account-heading" className="font-display text-2xl tracking-[-0.03em] text-ink">
        Account
      </h2>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-[15px] text-ink">{session?.user.email ?? 'Signed in'}</p>
        <Button type="button" variant="secondary" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </Card>
    </section>
  )
}

function AboutSection() {
  return (
    <section aria-labelledby="about-heading" className="space-y-2">
      <h2 id="about-heading" className="font-display text-2xl tracking-[-0.03em] text-ink">
        About
      </h2>
      <Card className="space-y-2 p-4 text-[13px] text-muted">
        <p>CREAMi Deluxe, version {APP_VERSION}.</p>
        <p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2">
            View the repository
          </a>
        </p>
        <p>
          Macros are estimates, calculated from an editable ingredient library using typical UK
          values. Brands and mix-ins change the totals — check your own labels when it matters.
        </p>
      </Card>
    </section>
  )
}

function ExportSection() {
  const exportData = useExportData()
  const { showToast } = useToast()

  async function handleExport() {
    try {
      const data = await exportData.mutateAsync()
      downloadJson(`creami-deluxe-export-${new Date().toISOString().slice(0, 10)}.json`, data)
      showToast('Export downloaded.')
    } catch {
      showToast('Could not build the export. Try again.', { variant: 'error' })
    }
  }

  return (
    <section aria-labelledby="export-heading" className="space-y-2">
      <h2 id="export-heading" className="font-display text-2xl tracking-[-0.03em] text-ink">
        Export
      </h2>
      <Card className="space-y-3 p-4">
        <p className="text-[13px] text-muted">
          Download everything — categories, ingredients, bases and recipes — as one JSON file. Not a
          sync mechanism, just a way to have a copy.
        </p>
        <Button type="button" variant="secondary" onClick={handleExport} disabled={exportData.isPending}>
          {exportData.isPending ? 'Preparing…' : 'Export as JSON'}
        </Button>
      </Card>
    </section>
  )
}
