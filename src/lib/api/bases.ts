import { supabase } from '@/lib/supabase'
import type { BaseWithIngredients, IngredientUnit } from '@/types/domain'

export async function fetchBases(): Promise<BaseWithIngredients[]> {
  const { data, error } = await supabase
    .from('bases')
    .select('*, ingredients:base_ingredients(*, ingredient:ingredients(*))')
    .order('sort_order')
  if (error) throw error
  return data as unknown as BaseWithIngredients[]
}

/** One line of a base's ingredient list, as edited on `/bases/:key`. */
export interface BaseIngredientInput {
  ingredient_id: string
  quantity: number
  unit: IngredientUnit
  note: string | null
}

export interface BaseInput {
  ingredients: BaseIngredientInput[]
}

/**
 * Replaces every ingredient line on a base with the edited set. Changing a
 * base changes the macros of every recipe built on it, since recipe macros
 * are always derived live from the base's current lines — nothing about a
 * recipe itself needs to change.
 */
export async function updateBase(id: string, input: BaseInput): Promise<void> {
  const { error: deleteError } = await supabase.from('base_ingredients').delete().eq('base_id', id)
  if (deleteError) throw deleteError

  if (input.ingredients.length === 0) return

  const rows = input.ingredients.map((line, index) => ({
    base_id: id,
    ingredient_id: line.ingredient_id,
    quantity: line.quantity,
    unit: line.unit,
    note: line.note,
    sort_order: index,
  }))
  const { error: insertError } = await supabase.from('base_ingredients').insert(rows)
  if (insertError) throw insertError
}

/** How many recipes are built on this base — the count shown in the "this will change…" warning. */
export async function countBaseUsage(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('base_id', id)
  if (error) throw error
  return count ?? 0
}
