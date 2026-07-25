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
  Category,
  Ingredient,
  Recipe,
  RecipeIngredient,
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
  const [settings, categories, ingredients, bases, recipes] = await Promise.all([
    fetchSettings(),
    fetchCategories(),
    fetchIngredients(),
    fetchBases(),
    fetchRecipesForExport(),
  ])

  return {
    exported_at: new Date().toISOString(),
    settings,
    categories,
    ingredients,
    bases,
    recipes,
  }
}
