import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FavouriteButton } from '@/components/ui/FavouriteButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useRecipe } from '@/features/recipes/hooks/useRecipe'
import { useRecipeMacros } from '@/features/recipes/hooks/useRecipeMacros'
import { useToggleFavourite } from '@/features/recipes/hooks/useToggleFavourite'
import { useArchiveRecipe } from '@/features/recipes/hooks/useArchiveRecipe'
import { useDuplicateRecipe } from '@/features/recipes/hooks/useDuplicateRecipe'
import { useBases } from '@/features/reference/hooks/useBases'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { RecipeOverflowMenu } from '@/features/recipes/components/RecipeOverflowMenu'
import { DeleteRecipeSheet } from '@/features/recipes/components/DeleteRecipeSheet'
import { ServingToggle, type ServingMode } from '@/features/recipes/components/ServingToggle'
import { MacroPanel } from '@/features/recipes/components/MacroPanel'
import { IngredientList } from '@/features/recipes/components/IngredientList'
import { DerivedMilkLine } from '@/features/recipes/components/DerivedMilkLine'
import { RecipeActionButtons } from '@/features/recipes/components/RecipeActionButtons'
import { describeBaseLine, describeRecipeLine } from '@/features/recipes/ingredient-display'
import { splitIntoSteps } from '@/lib/text'
import type { RecipeWithLines } from '@/types/domain'
import { LogBatchSheet } from '@/features/freezer/components/LogBatchSheet'
import { RatingsSection } from '@/features/freezer/components/RatingsSection'
import { RecipeInsights } from '@/features/freezer/components/RecipeInsights'
import { useAddToPlan } from '@/features/shopping/hooks/useAddToPlan'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-paper p-4">
      <h2 className="font-display text-xl tracking-[-0.025em] text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

const SCALE_LABELS: Record<ServingMode, string> = {
  full: 'full tub',
  half: 'half tub',
  custom: 'custom fill',
}

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading, isError, refetch } = useRecipe(slug)
  const { data: bases, isLoading: isBasesLoading, isError: isBasesError, refetch: refetchBases } = useBases()
  const {
    data: ingredients,
    isLoading: isIngredientsLoading,
    isError: isIngredientsError,
    refetch: refetchIngredients,
  } = useIngredients()
  const {
    data: settings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useSettings()
  const toggleFavourite = useToggleFavourite()
  const { archiveWithUndo, isPending: isArchiving } = useArchiveRecipe()
  const duplicateRecipe = useDuplicateRecipe()
  const addToPlan = useAddToPlan()

  const [mode, setMode] = useState<ServingMode>('full')
  const [customMl, setCustomMl] = useState(680)
  const [excludedOptionalIds, setExcludedOptionalIds] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logBatchOpen, setLogBatchOpen] = useState(false)

  const maxFillMl = settings?.max_fill_ml ?? 680
  const scale = mode === 'full' ? 1 : mode === 'half' ? 0.5 : customMl / maxFillMl

  const macroRecipe = useMemo<RecipeWithLines | undefined>(() => {
    if (!recipe) return undefined
    return {
      ...recipe,
      ingredients: recipe.ingredients.filter((line) => !excludedOptionalIds.has(line.id)),
    }
  }, [recipe, excludedOptionalIds])

  const macros = useRecipeMacros(macroRecipe, { scale })
  const base = bases?.find((b) => b.id === recipe?.base_id)
  const milkIngredient = settings?.default_milk_ingredient_id
    ? ingredients?.find((i) => i.id === settings.default_milk_ingredient_id)
    : undefined

  function toggleOptional(id: string) {
    setExcludedOptionalIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading || isBasesLoading || isIngredientsLoading || isSettingsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !recipe) {
    return <ErrorState message="Couldn't load this recipe." onRetry={refetch} />
  }

  if (isBasesError || isIngredientsError || isSettingsError) {
    return (
      <ErrorState
        message="Couldn't load this recipe's macros."
        onRetry={() => {
          void refetchBases()
          void refetchIngredients()
          void refetchSettings()
        }}
      />
    )
  }

  const additions = recipe.ingredients
    .filter((line) => line.role === 'addition')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((line) => describeRecipeLine(line, scale))

  const mixins = recipe.ingredients
    .filter((line) => line.role === 'mixin')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((line) => describeRecipeLine(line, scale))

  const baseLines = (base?.ingredients ?? [])
    .filter((line) => line.ingredient_id !== base?.fill_ingredient_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((line) => describeBaseLine(line, scale))

  const methodText = recipe.method_override ?? settings?.standard_method ?? ''
  const methodSteps = methodText ? splitIntoSteps(methodText) : []

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: recipe.category.accent }}
            >
              {recipe.category.label}
            </p>
            <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] tracking-[-0.04em] text-ink">
              {recipe.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <FavouriteButton
              isFavourite={recipe.is_favourite}
              onToggle={() =>
                toggleFavourite.mutate({ id: recipe.id, next: !recipe.is_favourite })
              }
            />
            <RecipeOverflowMenu
              onEdit={() => navigate(`/recipe/${recipe.slug}/edit`)}
              onDuplicate={() => duplicateRecipe.mutate(recipe)}
              onDelete={() => setDeleteOpen(true)}
              onAddToShoppingList={() => addToPlan.mutate(recipe.id)}
              onLogBatch={() => setLogBatchOpen(true)}
            />
          </div>
        </div>
        {recipe.profile && <p className="text-[15px] text-muted">{recipe.profile}</p>}
      </header>

      {/* 2. Serving toggle */}
      <ServingToggle
        mode={mode}
        customMl={customMl}
        maxFillMl={maxFillMl}
        onChange={(nextMode, nextMl) => {
          setMode(nextMode)
          setCustomMl(nextMl)
        }}
      />

      {/* 3. Macro panel */}
      <MacroPanel
        macros={macros}
        overrideKcal={recipe.macro_override_kcal}
        overrideProteinG={recipe.macro_override_protein_g}
        scale={scale}
        servingsPerTub={settings?.servings_per_tub ?? 1}
        scaleLabel={SCALE_LABELS[mode]}
      />

      {/* 4. Base, including the derived milk line */}
      {base && (
        <Section title={base.name}>
          {base.summary && <p className="mb-2 text-[13px] text-muted">{base.summary}</p>}
          <IngredientList
            lines={baseLines}
            after={
              macros &&
              milkIngredient && (
                <DerivedMilkLine
                  milkName={milkIngredient.name}
                  fillVolumeMl={macros.fillVolumeMl}
                  targetFillMl={maxFillMl * scale}
                  maxFillMl={maxFillMl}
                  isFullTub={mode === 'full'}
                  overflows={macros.overflows}
                />
              )
            }
          />
        </Section>
      )}

      {/* 5. Flavour additions */}
      {additions.length > 0 && (
        <Section title="Flavour additions">
          <IngredientList lines={additions} />
        </Section>
      )}

      {/* 6. Mix-ins */}
      {(mixins.length > 0 || recipe.mixin_note) && (
        <Section title="Mix-in">
          {mixins.length > 0 && (
            <IngredientList
              lines={mixins}
              onToggleOptional={toggleOptional}
              excludedIds={excludedOptionalIds}
            />
          )}
          {recipe.mixin_note && <p className="mt-2 text-[13px] text-muted">{recipe.mixin_note}</p>}
        </Section>
      )}

      {/* 7. Method */}
      {methodSteps.length > 0 && (
        <Section title="Method">
          <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink">
            {methodSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* 8. Best result */}
      {recipe.tip && (
        <Section title="Best result">
          <p className="text-[15px] text-ink">{recipe.tip}</p>
        </Section>
      )}

      {/* 9. Ratings and notes, plus insights (docs/06 § Insights) */}
      <RecipeInsights recipeId={recipe.id} />
      <RatingsSection recipeId={recipe.id} />

      {/* 10. Actions */}
      <RecipeActionButtons
        onAddToShoppingList={() => addToPlan.mutate(recipe.id)}
        onLogBatch={() => setLogBatchOpen(true)}
      />

      <DeleteRecipeSheet
        open={deleteOpen}
        recipeName={recipe.name}
        isPending={isArchiving}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          archiveWithUndo(recipe, () => navigate('/'))
        }}
      />

      <LogBatchSheet
        recipeId={recipe.id}
        recipeName={recipe.name}
        open={logBatchOpen}
        onClose={() => setLogBatchOpen(false)}
      />
    </div>
  )
}
