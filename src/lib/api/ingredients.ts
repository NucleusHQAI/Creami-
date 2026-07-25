import { supabase } from '@/lib/supabase'
import type { Ingredient, IngredientBasis } from '@/types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('name')
  if (error) throw error
  return data
}

/** The editable fields of an ingredient — everything in the editor sheet bar id, slug and is_seed. */
export interface IngredientInput {
  name: string
  category: string
  basis: IngredientBasis
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  grams_per_item: number | null
  density_g_per_ml: number
  grams_per_tsp: number | null
  negligible: boolean
  counts_toward_volume: boolean
  notes: string | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(base: string): Promise<string> {
  const safeBase = base || 'ingredient'
  const { data, error } = await supabase.from('ingredients').select('slug').ilike('slug', `${safeBase}%`)
  if (error) throw error
  const existing = new Set((data ?? []).map((row) => row.slug))
  if (!existing.has(safeBase)) return safeBase
  let suffix = 2
  while (existing.has(`${safeBase}-${suffix}`)) suffix += 1
  return `${safeBase}-${suffix}`
}

/** Creates a new ingredient (no `id`) or updates an existing one (`id` present). */
export async function upsertIngredient(
  input: IngredientInput & { id?: string },
): Promise<Ingredient> {
  const { id, ...fields } = input

  if (id) {
    const { data, error } = await supabase
      .from('ingredients')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const slug = await generateUniqueSlug(slugify(fields.name))
  const { data, error } = await supabase
    .from('ingredients')
    .insert({ ...fields, slug })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Fails at the database if the ingredient is seeded — RLS blocks that delete outright. */
export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw error
}

/** Distinct recipes and bases referencing this ingredient, for the "used by…" delete guard. */
export async function countIngredientUsage(
  id: string,
): Promise<{ recipes: number; bases: number }> {
  const [recipeRows, baseRows] = await Promise.all([
    supabase.from('recipe_ingredients').select('recipe_id').eq('ingredient_id', id),
    supabase.from('base_ingredients').select('base_id').eq('ingredient_id', id),
  ])
  if (recipeRows.error) throw recipeRows.error
  if (baseRows.error) throw baseRows.error

  const recipes = new Set((recipeRows.data ?? []).map((row) => row.recipe_id)).size
  const bases = new Set((baseRows.data ?? []).map((row) => row.base_id)).size
  return { recipes, bases }
}
