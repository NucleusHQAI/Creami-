// Pure — no React. Computes the same recipe's macros twice, once against the
// currently-saved settings and once against the draft values on the form,
// so the Settings screen can show "before → after" without needing to save
// first.

import { calculateMacros } from '@/lib/macros'
import type {
  Ingredient as MacroIngredient,
  MacroLine,
  MacroResult,
  Unit,
} from '@/lib/macros/types'
import type { BaseWithIngredients, Ingredient, RecipeWithLines } from '@/types/domain'

export interface PreviewSettings {
  maxFillMl: number
  servingsPerTub: number
  defaultMilkIngredientId: string | null
}

function toMacroIngredient(ingredient: Ingredient): MacroIngredient {
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

export function calculateRecipePreview(
  recipe: RecipeWithLines,
  base: BaseWithIngredients,
  ingredients: Ingredient[],
  settings: PreviewSettings,
): MacroResult {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, toMacroIngredient(ingredient)]))

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
      maxFillMl: settings.maxFillMl,
      servingsPerTub: settings.servingsPerTub,
      defaultMilkIngredientId: settings.defaultMilkIngredientId,
    },
  })
}
