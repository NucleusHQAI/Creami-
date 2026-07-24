import { supabase } from '@/lib/supabase'
import type { AppSettings } from '@/types/domain'

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}
