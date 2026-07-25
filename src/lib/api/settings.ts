import { supabase } from '@/lib/supabase'
import type { AppSettings, RecipeWithLines } from '@/types/domain'

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function updateSettings(input: Partial<AppSettings>): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update(input)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * The one seeded recipe used on the Settings screen to preview the effect of
 * MAX FILL and default-milk changes before saving. Returns null if it isn't
 * present (a non-seeded environment), in which case the preview is skipped.
 */
export async function fetchSettingsPreviewRecipe(): Promise<RecipeWithLines | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, category:categories(*), base:bases(*), ingredients:recipe_ingredients(*, ingredient:ingredients(*))')
    .eq('slug', 'vanilla-custard')
    .maybeSingle()
  if (error) throw error
  return data as unknown as RecipeWithLines | null
}
