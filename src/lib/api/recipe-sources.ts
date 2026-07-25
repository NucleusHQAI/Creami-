import { supabase } from '@/lib/supabase'
import type { RecipeSourceInput } from '@/features/recipes/import/types'
import type { RecipeSource } from '@/types/domain'

export async function insertRecipeSource(
  recipeId: string,
  input: RecipeSourceInput,
): Promise<RecipeSource> {
  const { data, error } = await supabase
    .from('recipe_sources')
    .insert({
      recipe_id: recipeId,
      source_url: input.sourceUrl,
      source_title: input.sourceTitle,
      source_site: input.sourceSite,
      adaptation_summary: input.adaptationSummary,
      retrieved_at: input.retrievedAt,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function safeSourceUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}
