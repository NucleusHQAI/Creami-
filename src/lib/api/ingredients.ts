import { supabase } from '@/lib/supabase'
import type { Ingredient } from '@/types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('name')
  if (error) throw error
  return data
}
