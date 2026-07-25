// Pure — no React. Turns a base's own ingredient lines into the "floor"
// macros for that base alone: no recipe additions, no mix-ins, full tub.

import { calculateMacros } from '@/lib/macros'
import type {
  Ingredient as MacroIngredient,
  MacroLine,
  MacroResult,
  Unit,
} from '@/lib/macros/types'
import type { AppSettings, BaseWithIngredients, Ingredient } from '@/types/domain'

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

/**
 * Computes a base's macros alone — its own lines, topped up to the freezer fill with
 * the default milk, with no recipe additions or mix-ins. This is the floor
 * figure shown on `/bases`: "any recipe on this base has at least this."
 */
export function calculateBaseOnlyMacros(
  base: BaseWithIngredients,
  ingredients: Ingredient[],
  settings: AppSettings,
): MacroResult {
  const ingredientMap = new Map(
    ingredients.map((ingredient) => [ingredient.id, toMacroIngredient(ingredient)]),
  )

  const baseLines: MacroLine[] = base.ingredients.map((line) => ({
    ingredientId: line.ingredient_id,
    quantity: line.quantity,
    unit: line.unit as Unit,
    optional: false,
    role: 'base',
  }))

  return calculateMacros({
    baseLines,
    fillIngredientId: base.fill_ingredient_id,
    recipeLines: [],
    ingredients: ingredientMap,
    settings: {
      maxFillMl: settings.max_fill_ml,
      servingsPerTub: settings.servings_per_tub,
      defaultMilkIngredientId: settings.default_milk_ingredient_id,
    },
  })
}
