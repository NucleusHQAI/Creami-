import { useEffect, useState } from 'react'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/app/ToastProvider'
import { useRecipe } from '@/features/recipes/hooks/useRecipe'
import { useSaveRecipe } from '@/features/recipes/hooks/useSaveRecipe'
import { useArchiveRecipe } from '@/features/recipes/hooks/useArchiveRecipe'
import { useExistingSlugs } from '@/features/recipes/hooks/useExistingSlugs'
import { useDraftRecipeMacros } from '@/features/recipes/hooks/useDraftRecipeMacros'
import { useCategories } from '@/features/reference/hooks/useCategories'
import { useBases } from '@/features/reference/hooks/useBases'
import { BaseSelectField } from '@/features/recipes/components/BaseSelectField'
import { IngredientLinesEditor } from '@/features/recipes/components/IngredientLinesEditor'
import { RecipeOverridesFields } from '@/features/recipes/components/RecipeOverridesFields'
import { EditorMacroReadout } from '@/features/recipes/components/EditorMacroReadout'
import { DeleteRecipeSheet } from '@/features/recipes/components/DeleteRecipeSheet'
import {
  defaultFormValues,
  formValuesToInput,
  recipeFormSchema,
  recipeToFormValues,
  type RecipeFormValues,
} from '@/features/recipes/recipe-form-schema'
import { ensureUniqueSlug, slugify } from '@/lib/slug'

const textareaClass =
  'h-24 w-full rounded-soft border border-line bg-cream px-3 py-2 text-[14px] text-ink focus-visible:outline-none'
const inputClass = 'h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none'

export default function RecipeEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEditing = Boolean(slug)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: existingRecipe, isLoading, isError, refetch } = useRecipe(slug)
  const { data: categories } = useCategories()
  const { data: bases } = useBases()
  const existingSlugs = useExistingSlugs(existingRecipe?.slug)
  const saveRecipe = useSaveRecipe()
  const { archiveWithUndo, isPending: isArchiving } = useArchiveRecipe()

  const [slugTouched, setSlugTouched] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: defaultFormValues(),
  })

  useEffect(() => {
    if (existingRecipe) {
      reset(recipeToFormValues(existingRecipe))
      setSlugTouched(true)
    }
  }, [existingRecipe, reset])

  // Warn before navigating away from a dirty form, per docs/05 § Saving.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Leave without saving your changes?')) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const name = watch('name')
  const baseId = watch('baseId')
  const additions = watch('additions')
  const mixins = watch('mixins')
  const draftMacros = useDraftRecipeMacros(baseId || undefined, [...additions, ...mixins])

  function handleNameChange(nextName: string) {
    setValue('name', nextName, { shouldDirty: true, shouldValidate: true })
    if (!isEditing && !slugTouched) {
      setValue('slug', ensureUniqueSlug(slugify(nextName), existingSlugs), { shouldDirty: true })
    }
  }

  function onSubmit(values: RecipeFormValues) {
    const finalSlug = values.slug.trim()
    if (existingSlugs.has(finalSlug)) {
      setError('slug', { message: 'That slug is already used by another recipe.' })
      return
    }

    saveRecipe.mutate(
      formValuesToInput(values, {
        id: existingRecipe?.id,
        isFavourite: existingRecipe?.is_favourite ?? false,
      }),
      {
        onSuccess: (recipe) => {
          // Clears isDirty before navigating, so the unsaved-changes blocker
          // doesn't immediately fire on a save that just succeeded.
          reset(values, { keepValues: true })
          showToast(isEditing ? 'Recipe saved' : 'Recipe created')
          navigate(`/recipe/${recipe.slug}`)
        },
        onError: () => showToast("Couldn't save this recipe — try again", { variant: 'error' }),
      },
    )
  }

  if (isEditing && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isEditing && (isError || !existingRecipe)) {
    return <ErrorState message="Couldn't load this recipe to edit." onRetry={refetch} />
  }

  return (
    <div className="space-y-6 pb-28">
      <h1 className="font-display text-[clamp(28px,5vw,36px)] tracking-[-0.04em] text-ink">
        {isEditing ? `Edit ${existingRecipe?.name}` : 'New recipe'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Field label="Name" error={errors.name}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Slug" hint="Lowercase letters, numbers and hyphens." error={errors.slug}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              {...register('slug', {
                onChange: () => setSlugTouched(true),
              })}
              className={`${inputClass} font-mono`}
            />
          )}
        </Field>

        <Field label="Category" error={errors.categoryId}>
          {(fieldProps) => (
            <select {...fieldProps} {...register('categoryId')} className={inputClass}>
              <option value="">Choose a category…</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <BaseSelectField
          bases={bases ?? []}
          value={baseId}
          onChange={(nextBaseId) => setValue('baseId', nextBaseId, { shouldDirty: true, shouldValidate: true })}
          showChangeWarning={Boolean(existingRecipe) && baseId !== existingRecipe?.base_id}
          error={errors.baseId?.message}
        />

        <Field label="Profile" hint="One line describing the flavour." error={errors.profile}>
          {(fieldProps) => (
            <textarea {...fieldProps} {...register('profile')} maxLength={200} className={textareaClass} />
          )}
        </Field>

        <IngredientLinesEditor
          control={control}
          setValue={setValue}
          name="additions"
          title="Flavour additions"
          addLabel="Add addition"
        />

        <IngredientLinesEditor
          control={control}
          setValue={setValue}
          name="mixins"
          title="Mix-ins"
          addLabel="Add mix-in"
        />

        <Field label="Mix-in note" hint="A human-readable summary, e.g. “Optional: 5g wafer pieces.”">
          {(fieldProps) => <textarea {...fieldProps} {...register('mixinNote')} className={textareaClass} />}
        </Field>

        <Field label="Best result tip">
          {(fieldProps) => <textarea {...fieldProps} {...register('tip')} className={textareaClass} />}
        </Field>

        <RecipeOverridesFields register={register} errors={errors} />

        {(errors.additions || errors.mixins) && (
          <p role="alert" className="text-[13px] text-berry">
            Every ingredient line needs either an ingredient or a note, and a description.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting || saveRecipe.isPending}>
            {saveRecipe.isPending ? 'Saving…' : 'Save recipe'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {isEditing && (
            <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          )}
        </div>
      </form>

      <EditorMacroReadout macros={draftMacros} />

      {existingRecipe && (
        <DeleteRecipeSheet
          open={deleteOpen}
          recipeName={existingRecipe.name}
          isPending={isArchiving}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            setDeleteOpen(false)
            reset(getValues(), { keepValues: true })
            archiveWithUndo(existingRecipe, () => navigate('/'))
          }}
        />
      )}
    </div>
  )
}
