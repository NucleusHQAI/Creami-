import { supabase } from '@/lib/supabase'
import type { BaseWithIngredients } from '@/types/domain'

export async function fetchBases(): Promise<BaseWithIngredients[]> {
  const { data, error } = await supabase
    .from('bases')
    .select('*, ingredients:base_ingredients(*, ingredient:ingredients(*))')
    .order('sort_order')
  if (error) throw error
  return data as unknown as BaseWithIngredients[]
}
