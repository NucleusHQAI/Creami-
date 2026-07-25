import { supabase } from '@/lib/supabase'
import type { IngredientUnit, Recipe, RecipeListRow, RecipeWithLines } from '@/types/domain'

// The nested select behind both fetchRecipe and fetchRecipesWithLines.
// `recipe_ingredients` is aliased to `ingredients` so the result lands
// directly in the RecipeWithLines shape. The base is fetched plain (no
// nested base_ingredients) — its ingredient lines come from useBases(),
// already cached and shared with the macro engine, rather than being
// re-fetched once per recipe here.
const RECIPE_WITH_LINES_SELECT = `
  *,
  category:categories(*),
  base:bases(*),
  ingredients:recipe_ingredients(*, ingredient:ingredients(*))
`

/** List rows for the recipe list screen — name, category, base, favourite and rating, but never macros (those depend on live settings and are computed client-side). */
export async function fetchRecipeList(): Promise<RecipeListRow[]> {
  const { data, error } = await supabase
    .from('recipe_list_view')
    .select('*')
    .is('archived_at', null)
  if (error) throw error
  return data
}

/**
 * Every non-archived recipe with its base and ingredient lines resolved.
 * Used to compute per-card macros on the list and to let search match
 * ingredient `display` text — recipe_list_view carries neither. Forty rows
 * with a handful of lines each is a small query, not forty round trips.
 */
export async function fetchRecipesWithLines(): Promise<RecipeWithLines[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_WITH_LINES_SELECT)
    .is('archived_at', null)
  if (error) throw error
  return data as unknown as RecipeWithLines[]
}

/** A single recipe, with its base and ingredient lines resolved, by slug. */
export async function fetchRecipe(slug: string): Promise<RecipeWithLines> {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_WITH_LINES_SELECT)
    .eq('slug', slug)
    .is('archived_at', null)
    .single()
  if (error) throw error
  return data as unknown as RecipeWithLines
}

/** Total batches ever logged per recipe, for the "Most made" sort. Recipes with none are simply absent from the map. */
export async function fetchMadeCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('batches').select('recipe_id')
  if (error) throw error
  const counts = new Map<string, number>()
  for (const row of data) {
    counts.set(row.recipe_id, (counts.get(row.recipe_id) ?? 0) + 1)
  }
  return counts
}

/**
 * How many recipe lines reference each ingredient, across every recipe —
 * feeds the "most-used at the top" ordering in the editor's ingredient
 * picker (docs/05 § The ingredient line editor).
 */
export async function fetchIngredientUsageCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('ingredient_id')
    .not('ingredient_id', 'is', null)
  if (error) throw error
  const counts = new Map<string, number>()
  for (const row of data) {
    if (!row.ingredient_id) continue
    counts.set(row.ingredient_id, (counts.get(row.ingredient_id) ?? 0) + 1)
  }
  return counts
}

export interface RecipeIngredientLineInput {
  ingredientId: string | null
  freeText: string | null
  role: 'addition' | 'mixin'
  quantity: number | null
  unit: IngredientUnit | null
  display: string
  optional: boolean
}

export interface RecipeInput {
  /** Present when editing an existing recipe, absent when creating one. */
  id?: string
  slug: string
  name: string
  categoryId: string
  baseId: string
  profile: string | null
  tip: string | null
  mixinNote: string | null
  methodOverride: string | null
  imagePath: string | null
  macroOverrideKcal: number | null
  macroOverrideProteinG: number | null
  isFavourite: boolean
  ingredients: RecipeIngredientLineInput[]
}

/**
 * Saves a recipe. Per docs/05 "Saving": upsert the recipe row, delete its
 * existing recipe_ingredients, insert the new set — in that order, since
 * Supabase has no client-side transactions and a failure partway should
 * leave a recipe with no ingredients (recoverable) rather than orphan lines.
 */
export async function upsertRecipe(input: RecipeInput): Promise<Recipe> {
  const recipeRow = {
    slug: input.slug,
    name: input.name,
    category_id: input.categoryId,
    base_id: input.baseId,
    profile: input.profile,
    tip: input.tip,
    mixin_note: input.mixinNote,
    method_override: input.methodOverride,
    image_path: input.imagePath,
    macro_override_kcal: input.macroOverrideKcal,
    macro_override_protein_g: input.macroOverrideProteinG,
    is_favourite: input.isFavourite,
  }

  const { data: recipe, error: recipeError } = input.id
    ? await supabase.from('recipes').update(recipeRow).eq('id', input.id).select().single()
    : await supabase.from('recipes').insert(recipeRow).select().single()

  if (recipeError) throw recipeError

  const { error: deleteError } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipe.id)
  if (deleteError) throw deleteError

  if (input.ingredients.length > 0) {
    const lines = input.ingredients.map((line, index) => ({
      recipe_id: recipe.id,
      ingredient_id: line.ingredientId,
      free_text: line.freeText,
      role: line.role,
      quantity: line.quantity,
      unit: line.unit,
      display: line.display,
      optional: line.optional,
      sort_order: index,
    }))

    const { error: insertError } = await supabase.from('recipe_ingredients').insert(lines)
    if (insertError) throw insertError
  }

  return recipe
}

/** Soft delete — sets `archived_at`. Batch history is untouched. */
export async function archiveRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Undoes archiveRecipe within the undo window. */
export async function restoreRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').update({ archived_at: null }).eq('id', id)
  if (error) throw error
}

export async function toggleFavourite(id: string, next: boolean): Promise<void> {
  const { error } = await supabase.from('recipes').update({ is_favourite: next }).eq('id', id)
  if (error) throw error
}
