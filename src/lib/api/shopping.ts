import { supabase } from '@/lib/supabase'
import type { Unit } from '@/lib/macros/types'
import type { PlanItemWithRecipe, RecipeOption } from '@/features/shopping/types'
import type { ShoppingExtra } from '@/types/domain'

// ---------- plan ----------

interface RawPlanRow {
  id: string
  recipe_id: string
  multiplier: number
  created_at: string
  recipe: {
    id: string
    name: string
    base: {
      fill_ingredient_id: string
      base_ingredients: Array<{ ingredient_id: string; quantity: number; unit: string }>
    } | null
    recipe_ingredients: Array<{
      ingredient_id: string | null
      quantity: number | null
      unit: string | null
      optional: boolean
      role: string
      display: string
      free_text: string | null
    }>
  } | null
}

function toPlanItemWithRecipe(row: RawPlanRow): PlanItemWithRecipe | null {
  const { recipe } = row
  if (!recipe || !recipe.base) return null

  return {
    id: row.id,
    recipe_id: row.recipe_id,
    multiplier: row.multiplier,
    created_at: row.created_at,
    recipe: {
      id: recipe.id,
      name: recipe.name,
      fillIngredientId: recipe.base.fill_ingredient_id,
      baseLines: recipe.base.base_ingredients.map((line) => ({
        ingredientId: line.ingredient_id,
        quantity: line.quantity,
        unit: line.unit as Unit,
      })),
      lines: recipe.recipe_ingredients.map((line) => ({
        ingredientId: line.ingredient_id,
        quantity: line.quantity,
        unit: line.unit as Unit | null,
        optional: line.optional,
        role: line.role as 'addition' | 'mixin',
        display: line.display,
      })),
    },
  }
}

/** The plan, with each recipe's base and ingredient lines resolved so aggregation has what it needs. */
export async function fetchPlan(): Promise<PlanItemWithRecipe[]> {
  const { data, error } = await supabase
    .from('plan_items')
    .select(
      `
      id, recipe_id, multiplier, created_at,
      recipe:recipes (
        id, name,
        base:bases ( fill_ingredient_id, base_ingredients ( ingredient_id, quantity, unit ) ),
        recipe_ingredients ( ingredient_id, quantity, unit, optional, role, display, free_text )
      )
    `,
    )
    .order('created_at', { ascending: true })
  if (error) throw error

  const rows = data as unknown as RawPlanRow[]
  const items: PlanItemWithRecipe[] = []
  for (const row of rows) {
    const item = toPlanItemWithRecipe(row)
    if (item) items.push(item)
  }
  return items
}

/** Adds a recipe to the plan. A no-op if it's already there — the unique constraint on recipe_id does the deduplication. */
export async function addToPlan(recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('plan_items')
    .upsert({ recipe_id: recipeId }, { onConflict: 'recipe_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function setPlanMultiplier(recipeId: string, multiplier: number): Promise<void> {
  const { error } = await supabase
    .from('plan_items')
    .update({ multiplier })
    .eq('recipe_id', recipeId)
  if (error) throw error
}

export async function removeFromPlan(recipeId: string): Promise<void> {
  const { error } = await supabase.from('plan_items').delete().eq('recipe_id', recipeId)
  if (error) throw error
}

export async function clearPlan(): Promise<void> {
  const { error } = await supabase.from('plan_items').delete().not('id', 'is', null)
  if (error) throw error
}

// ---------- recipe options, for the "Add recipes" sheet ----------

export async function fetchRecipeOptions(): Promise<RecipeOption[]> {
  const { data, error } = await supabase
    .from('recipe_list_view')
    .select('id, name, slug, category_label')
    .is('archived_at', null)
    .order('name')
  if (error) throw error

  // The view's generated types mark every column nullable — true of a
  // Postgres view regardless of the underlying NOT NULL constraints — so
  // narrow defensively rather than asserting.
  const options: RecipeOption[] = []
  for (const row of data) {
    if (row.id === null || row.name === null || row.slug === null || row.category_label === null) {
      continue
    }
    options.push({ id: row.id, name: row.name, slug: row.slug, categoryLabel: row.category_label })
  }
  return options
}

// ---------- extras ----------

export async function fetchExtras(): Promise<ShoppingExtra[]> {
  const { data, error } = await supabase
    .from('shopping_extras')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addExtra(label: string, category?: string): Promise<ShoppingExtra> {
  const { data, error } = await supabase
    .from('shopping_extras')
    .insert({ label, category: category ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function toggleExtra(id: string, next: boolean): Promise<void> {
  const { error } = await supabase.from('shopping_extras').update({ is_checked: next }).eq('id', id)
  if (error) throw error
}

export async function deleteExtra(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_extras').delete().eq('id', id)
  if (error) throw error
}

// ---------- ticks ----------

export async function fetchChecks(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('shopping_checks').select('ingredient_id, is_checked')
  if (error) throw error

  const checks: Record<string, boolean> = {}
  for (const row of data) {
    checks[row.ingredient_id] = row.is_checked
  }
  return checks
}

export async function setCheck(ingredientId: string, next: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_checks')
    .upsert({ ingredient_id: ingredientId, is_checked: next, updated_at: new Date().toISOString() })
  if (error) throw error
}

/** Clears every tick — the auto-generated lines and the extras alike — but never touches the plan. */
export async function clearChecks(): Promise<void> {
  const { error: checksError } = await supabase
    .from('shopping_checks')
    .delete()
    .not('ingredient_id', 'is', null)
  if (checksError) throw checksError

  const { error: extrasError } = await supabase
    .from('shopping_extras')
    .update({ is_checked: false })
    .eq('is_checked', true)
  if (extrasError) throw extrasError
}
