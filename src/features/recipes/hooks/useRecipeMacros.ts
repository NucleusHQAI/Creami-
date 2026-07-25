import { useMemo } from 'react'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useBases } from '@/features/reference/hooks/useBases'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { calculateMacros } from '@/lib/macros'
import type {
  Ingredient as MacroIngredient,
  MacroLine,
  MacroResult,
  Unit,
} from '@/lib/macros/types'
import type {
  AppSettings,
  BaseWithIngredients,
  Ingredient as DomainIngredient,
  RecipeWithLines,
} from '@/types/domain'

export interface UseRecipeMacrosOptions {
  scale?: number
  excludeOptional?: boolean
}

/** Exported so useDraftRecipeMacros (the editor's live readout) can share this mapping without duplicating it. */
export function toMacroIngredient(ingredient: DomainIngredient): MacroIngredient {
  return {
    id: ingredient.id,
    slug: ingredient.slug,
    name: ingredient.name,
    basis: ingredient.basis as MacroIngredient['basis'],
    kcal: ingredient.kcal,
    protein_g: ingredient.protein_g,
    carbs_g: ingredient.carbs_g,
    fat_g: ingredient.fat_g,
    density_g_per_ml: ingredient.density_g_per_ml,
    grams_per_item: ingredient.grams_per_item,
    negligible: ingredient.negligible,
    counts_toward_volume: ingredient.counts_toward_volume,
  }
}

/**
 * Binds one recipe to the macro engine. Pure — no memoisation, no React.
 * Shared by `useRecipeMacros` (one recipe) and `useRecipeListMacros` (every
 * recipe on the list) so the ingredient/base/settings wiring lives in one
 * place. All the arithmetic still lives in `src/lib/macros`.
 */
export function computeRecipeMacros(
  recipe: RecipeWithLines,
  ingredients: DomainIngredient[],
  bases: BaseWithIngredients[],
  settings: AppSettings,
  options: UseRecipeMacrosOptions = {},
): MacroResult | undefined {
  const base = bases.find((b) => b.id === recipe.base_id)
  if (!base) {
    return undefined
  }

  const ingredientMap = new Map(ingredients.map((i) => [i.id, toMacroIngredient(i)]))

  const baseLines: MacroLine[] = base.ingredients.map((line) => ({
    ingredientId: line.ingredient_id,
    quantity: line.quantity,
    unit: line.unit as Unit,
    optional: false,
    role: 'base',
  }))

  const recipeLines: MacroLine[] = recipe.ingredients.map((line) => ({
    ingredientId: line.ingredient_id,
    quantity: line.quantity,
    unit: line.unit as Unit | null,
    optional: line.optional,
    role: line.role as 'addition' | 'mixin',
  }))

  return calculateMacros({
    baseLines,
    fillIngredientId: base.fill_ingredient_id,
    recipeLines,
    ingredients: ingredientMap,
    settings: {
      maxFillMl: settings.max_fill_ml,
      servingsPerTub: settings.servings_per_tub,
      defaultMilkIngredientId: settings.default_milk_ingredient_id,
    },
    scale: options.scale,
    excludeOptional: options.excludeOptional,
  })
}

/**
 * Gathers ingredients, the recipe's base and settings from the reference
 * hooks, builds the MacroLine arrays, and calls the macro engine. Contains
 * no arithmetic of its own — all of that lives in src/lib/macros.
 */
export function useRecipeMacros(
  recipe: RecipeWithLines | undefined,
  options: UseRecipeMacrosOptions = {},
): MacroResult | undefined {
  const { data: ingredients } = useIngredients()
  const { data: bases } = useBases()
  const { data: settings } = useSettings()
  const { scale, excludeOptional } = options

  return useMemo(() => {
    if (!recipe || !ingredients || !bases || !settings) {
      return undefined
    }
    return computeRecipeMacros(recipe, ingredients, bases, settings, { scale, excludeOptional })
  }, [recipe, ingredients, bases, settings, scale, excludeOptional])
}
