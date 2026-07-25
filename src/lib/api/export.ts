// A read-only "download everything" for the Settings screen. Not a sync
// mechanism — just a way for the household recipe collection to never be
// trapped behind one Supabase project.

import { supabase } from '@/lib/supabase'
import { fetchCategories } from '@/lib/api/categories'
import { fetchIngredients } from '@/lib/api/ingredients'
import { fetchBases } from '@/lib/api/bases'
import { fetchSettings } from '@/lib/api/settings'
import type {
  AppSettings,
  BaseWithIngredients,
  Batch,
  Category,
  Ingredient,
  PlanItem,
  Recipe,
  RecipeIngredient,
  ShoppingCheck,
  ShoppingExtra,
  TastingNote,
} from '@/types/domain'

export interface ExportRecipe extends Recipe {
  category_key: string | null
  base_key: string | null
  ingredients: RecipeIngredient[]
}

export interface HouseholdExport {
  exported_at: string
  settings: AppSettings
  categories: Category[]
  ingredients: Ingredient[]
  bases: BaseWithIngredients[]
  recipes: ExportRecipe[]
  batches: Batch[]
  tasting_notes: TastingNote[]
  plan_items: PlanItem[]
  shopping_extras: ShoppingExtra[]
  shopping_checks: ShoppingCheck[]
}

interface RecipeExportRow extends Recipe {
  category: { key: string } | null
  base: { key: string } | null
  ingredients: RecipeIngredient[]
}

async function fetchRecipesForExport(): Promise<ExportRecipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, category:categories(key), base:bases(key), ingredients:recipe_ingredients(*)')
    .order('name')
  if (error) throw error

  return (data as unknown as RecipeExportRow[]).map(({ category, base, ...recipe }) => ({
    ...recipe,
    category_key: category?.key ?? null,
    base_key: base?.key ?? null,
  }))
}

/** Fetches everything reasonably exportable in one call: reference data plus every recipe. */
export async function fetchExportData(): Promise<HouseholdExport> {
  const [
    settings,
    categories,
    ingredients,
    bases,
    recipes,
    batchesResult,
    tastingNotesResult,
    planItemsResult,
    shoppingExtrasResult,
    shoppingChecksResult,
  ] = await Promise.all([
    fetchSettings(),
    fetchCategories(),
    fetchIngredients(),
    fetchBases(),
    fetchRecipesForExport(),
    supabase.from('batches').select('*'),
    supabase.from('tasting_notes').select('*'),
    supabase.from('plan_items').select('*'),
    supabase.from('shopping_extras').select('*'),
    supabase.from('shopping_checks').select('*'),
  ])

  if (batchesResult.error) throw batchesResult.error
  if (tastingNotesResult.error) throw tastingNotesResult.error
  if (planItemsResult.error) throw planItemsResult.error
  if (shoppingExtrasResult.error) throw shoppingExtrasResult.error
  if (shoppingChecksResult.error) throw shoppingChecksResult.error

  return {
    exported_at: new Date().toISOString(),
    settings,
    categories,
    ingredients,
    bases,
    recipes,
    batches: batchesResult.data,
    tasting_notes: tastingNotesResult.data,
    plan_items: planItemsResult.data,
    shopping_extras: shoppingExtrasResult.data,
    shopping_checks: shoppingChecksResult.data,
  }
}
