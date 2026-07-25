import { useEffect, useRef, useState } from 'react'
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
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { BaseSelectField } from '@/features/recipes/components/BaseSelectField'
import { IngredientLinesEditor } from '@/features/recipes/components/IngredientLinesEditor'
import { RecipeOverridesFields } from '@/features/recipes/components/RecipeOverridesFields'
import { EditorMacroReadout } from '@/features/recipes/components/EditorMacroReadout'
import { DeleteRecipeSheet } from '@/features/recipes/components/DeleteRecipeSheet'
import { RecipePhotoField } from '@/features/recipes/components/RecipePhotoField'
import {
  defaultFormValues,
  formValuesToInput,
  recipeFormSchema,
  recipeToFormValues,
  type RecipeFormValues,
} from '@/features/recipes/recipe-form-schema'
import { ensureUniqueSlug, slugify } from '@/lib/slug'
import { useOnlineStatus } from '@/lib/online-status'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sparkles, WifiOff } from 'lucide-react'
import { getRecipeImageUrl, validateRecipeImage } from '@/lib/api/recipe-images'
import { useAdaptationRules } from '@/features/recipes/hooks/useAdaptationRules'
import { AdaptRecipeSheet } from '@/features/recipes/components/AdaptRecipeSheet'
import { AdaptationReviewPanel } from '@/features/recipes/components/AdaptationReviewPanel'
import type { AdaptationDecision, RecipeSourceInput } from '@/features/recipes/import/types'

const textareaClass =
  'h-24 w-full rounded-soft border border-line bg-cream px-3 py-2 text-[14px] text-ink focus-visible:outline-none'
const inputClass =
  'h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none'

export default function RecipeEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEditing = Boolean(slug)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isOnline = useOnlineStatus()

  const { data: existingRecipe, isLoading, isError, refetch } = useRecipe(slug)
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategories()
  const {
    data: bases,
    isLoading: isBasesLoading,
    isError: isBasesError,
    refetch: refetchBases,
  } = useBases()
  const {
    data: ingredients,
    isLoading: isIngredientsLoading,
    isError: isIngredientsError,
    refetch: refetchIngredients,
  } = useIngredients()
  const {
    data: adaptationRules,
    isLoading: isRulesLoading,
    isError: isRulesError,
    refetch: refetchRules,
  } = useAdaptationRules(!isEditing)
  const {
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useSettings()
  const existingSlugs = useExistingSlugs(existingRecipe?.slug)
  const saveRecipe = useSaveRecipe()
  const { archiveWithUndo, isPending: isArchiving } = useArchiveRecipe()

  const [slugTouched, setSlugTouched] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [adaptOpen, setAdaptOpen] = useState(false)
  const [adaptationDecisions, setAdaptationDecisions] = useState<AdaptationDecision[]>([])
  const [pendingSource, setPendingSource] = useState<RecipeSourceInput | null>(null)
  const [adaptationDirty, setAdaptationDirty] = useState(false)
  const allowNavigationRef = useRef(false)

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
      setPhotoFile(null)
      setPhotoRemoved(false)
      setPhotoError(null)
    }
  }, [existingRecipe, reset])

  const photoDirty = photoFile !== null || photoRemoved
  const hasUnsavedChanges = isDirty || photoDirty || adaptationDirty

  // Warn before navigating away from a dirty form, per docs/05 § Saving.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigationRef.current &&
      hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname,
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
      if (!hasUnsavedChanges) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

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

    const currentImagePath = existingRecipe?.image_path ?? null
    saveRecipe.mutate(
      {
        input: formValuesToInput(values, {
          id: existingRecipe?.id,
          isFavourite: existingRecipe?.is_favourite ?? false,
          imagePath: photoRemoved ? null : currentImagePath,
        }),
        imageFile: photoFile,
        previousImagePath: currentImagePath,
        source: pendingSource,
      },
      {
        onSuccess: ({ recipe, sourceAttached }) => {
          // Clears isDirty before navigating, so the unsaved-changes blocker
          // doesn't immediately fire on a save that just succeeded.
          reset(values, { keepValues: true })
          setPhotoFile(null)
          setPhotoRemoved(false)
          setPhotoError(null)
          setPendingSource(null)
          setAdaptationDirty(false)
          allowNavigationRef.current = true
          showToast(
            sourceAttached
              ? isEditing
                ? 'Recipe saved'
                : 'Recipe created'
              : 'Recipe saved, but its source link could not be attached.',
            sourceAttached ? undefined : { variant: 'error', durationMs: 7000 },
          )
          navigate(`/recipe/${recipe.slug}`)
        },
        onError: () => showToast("Couldn't save this recipe — try again", { variant: 'error' }),
      },
    )
  }

  if (!isOnline) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Recipe editing is unavailable offline"
        message="Reconnect before creating or editing a recipe. Your saved recipes are still available to read."
      />
    )
  }

  if (
    (isEditing && isLoading) ||
    isCategoriesLoading ||
    isBasesLoading ||
    isIngredientsLoading ||
    (!isEditing && isRulesLoading) ||
    isSettingsLoading
  ) {
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

  if (
    isCategoriesError ||
    isBasesError ||
    isIngredientsError ||
    (!isEditing && isRulesError) ||
    isSettingsError
  ) {
    return (
      <ErrorState
        message="Couldn't load the ingredient library needed to edit a recipe."
        onRetry={() => {
          void refetchCategories()
          void refetchBases()
          void refetchIngredients()
          void refetchRules()
          void refetchSettings()
        }}
      />
    )
  }

  return (
    <div className="space-y-6 pb-28">
      <h1 className="font-display text-[clamp(28px,5vw,36px)] tracking-[-0.04em] text-ink">
        {isEditing ? `Edit ${existingRecipe?.name}` : 'New recipe'}
      </h1>

      {!isEditing && (
        <Button type="button" variant="secondary" onClick={() => setAdaptOpen(true)}>
          <Sparkles size={16} aria-hidden="true" />
          Adapt from an online recipe
        </Button>
      )}

      {adaptationDecisions.length > 0 && <AdaptationReviewPanel decisions={adaptationDecisions} />}

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
          onChange={(nextBaseId) =>
            setValue('baseId', nextBaseId, { shouldDirty: true, shouldValidate: true })
          }
          showChangeWarning={Boolean(existingRecipe) && baseId !== existingRecipe?.base_id}
          error={errors.baseId?.message}
        />

        <Field label="Profile" hint="One line describing the flavour." error={errors.profile}>
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              {...register('profile')}
              maxLength={200}
              className={textareaClass}
            />
          )}
        </Field>

        <RecipePhotoField
          currentImageUrl={photoRemoved ? null : getRecipeImageUrl(existingRecipe?.image_path)}
          selectedFile={photoFile}
          error={photoError}
          disabled={isSubmitting || saveRecipe.isPending}
          onSelect={(file) => {
            const validationError = validateRecipeImage(file)
            setPhotoError(validationError)
            if (validationError) return
            setPhotoFile(file)
            setPhotoRemoved(false)
          }}
          onRemove={() => {
            setPhotoFile(null)
            setPhotoRemoved(true)
            setPhotoError(null)
          }}
        />

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

        <Field
          label="Mix-in note"
          hint="A human-readable summary, e.g. “Optional: 5g wafer pieces.”"
        >
          {(fieldProps) => (
            <textarea {...fieldProps} {...register('mixinNote')} className={textareaClass} />
          )}
        </Field>

        <Field label="Best result tip">
          {(fieldProps) => (
            <textarea {...fieldProps} {...register('tip')} className={textareaClass} />
          )}
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

      {!isEditing && (
        <AdaptRecipeSheet
          open={adaptOpen}
          onClose={() => setAdaptOpen(false)}
          isOnline={isOnline}
          bases={bases ?? []}
          ingredients={ingredients ?? []}
          categories={categories ?? []}
          rules={adaptationRules ?? []}
          onUse={(draft) => {
            if (
              hasUnsavedChanges &&
              !window.confirm('Replace your current recipe draft with this adaptation?')
            ) {
              return
            }
            const values = {
              ...draft.values,
              slug: ensureUniqueSlug(draft.values.slug, existingSlugs),
            }
            reset(values)
            setSlugTouched(true)
            setAdaptationDecisions(draft.decisions)
            setPendingSource(draft.source)
            setAdaptationDirty(true)
          }}
        />
      )}
    </div>
  )
}
