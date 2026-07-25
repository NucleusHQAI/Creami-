import { supabase } from '@/lib/supabase'
import type { RecipeRatingsRow, TastingNote } from '@/types/domain'

export interface CreateTastingNoteInput {
  recipeId: string
  batchId?: string
  rating?: number
  notes?: string
}

export async function createTastingNote(input: CreateTastingNoteInput): Promise<TastingNote> {
  const { data, error } = await supabase
    .from('tasting_notes')
    .insert({
      recipe_id: input.recipeId,
      batch_id: input.batchId ?? null,
      rating: input.rating ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTastingNote(id: string): Promise<void> {
  const { error } = await supabase.from('tasting_notes').delete().eq('id', id)
  if (error) throw error
}

/** A tasting note with the date of the batch it was made from, where one is set. */
export interface TastingNoteWithBatch extends TastingNote {
  batch: { frozen_at: string } | null
}

export async function fetchTastingNotes(recipeId: string): Promise<TastingNoteWithBatch[]> {
  const { data, error } = await supabase
    .from('tasting_notes')
    .select('*, batch:batches(frozen_at)')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as TastingNoteWithBatch[]
}

export async function fetchRecipeRatings(recipeId: string): Promise<RecipeRatingsRow | null> {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('*')
    .eq('recipe_id', recipeId)
    .maybeSingle()
  if (error) throw error
  return data
}
