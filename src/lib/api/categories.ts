import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/domain'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data
}
