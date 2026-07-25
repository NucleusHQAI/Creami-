import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database.types'
import type { Batch, BatchStatus } from '@/types/domain'

export interface RecipeSummary {
  name: string
  slug: string
}

/** A batch with just enough of its recipe — and any ratings against it — joined to display it. */
export interface BatchWithRecipe extends Batch {
  recipe: RecipeSummary | null
  tasting_notes: Array<{ rating: number | null }>
}

const BATCH_WITH_RECIPE_SELECT = '*, recipe:recipes(name, slug), tasting_notes(rating)'

export async function fetchBatches(statuses?: BatchStatus[]): Promise<BatchWithRecipe[]> {
  let query = supabase
    .from('batches')
    .select(BATCH_WITH_RECIPE_SELECT)
    .order('frozen_at', { ascending: false })
  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses)
  }
  const { data, error } = await query
  if (error) throw error
  return data as unknown as BatchWithRecipe[]
}

/** freezing + ready + spun — "ready" is derived from `freezing`, never a stored status. */
export async function fetchActiveBatches(): Promise<BatchWithRecipe[]> {
  return fetchBatches(['freezing', 'spun'])
}

export async function fetchBatchesForRecipe(recipeId: string): Promise<BatchWithRecipe[]> {
  const { data, error } = await supabase
    .from('batches')
    .select(BATCH_WITH_RECIPE_SELECT)
    .eq('recipe_id', recipeId)
    .order('frozen_at', { ascending: false })
  if (error) throw error
  return data as unknown as BatchWithRecipe[]
}

export interface CreateBatchInput {
  recipeId: string
  frozenAt?: Date
  notes?: string
}

export async function createBatch(input: CreateBatchInput): Promise<Batch> {
  const frozenAt = (input.frozenAt ?? new Date()).toISOString()
  const { data, error } = await supabase
    .from('batches')
    .insert({
      recipe_id: input.recipeId,
      frozen_at: frozenAt,
      notes: input.notes ?? null,
    } as TablesInsert<'batches'>)
    .select()
    .single()
  if (error) throw error
  return data
}

export interface MarkSpunInput {
  respins: number
  milkMl?: number
  notes?: string
}

export async function markSpun(
  id: string,
  input: MarkSpunInput,
  spunAt: string,
): Promise<void> {
  const update: {
    status: 'spun'
    spun_at: string
    respin_count: number
    added_milk_ml?: number
    notes?: string
  } = {
    status: 'spun',
    spun_at: spunAt,
    respin_count: input.respins,
  }
  if (input.milkMl !== undefined) update.added_milk_ml = input.milkMl
  if (input.notes !== undefined) update.notes = input.notes

  const { error } = await supabase.from('batches').update(update).eq('id', id)
  if (error) throw error
}

export async function markFinished(id: string, finishedAt: string): Promise<void> {
  const { error } = await supabase
    .from('batches')
    .update({ status: 'finished', finished_at: finishedAt })
    .eq('id', id)
  if (error) throw error
}

export async function deleteBatch(id: string): Promise<void> {
  const { error } = await supabase.from('batches').delete().eq('id', id)
  if (error) throw error
}

export interface RecipeOption {
  id: string
  name: string
  slug: string
}

/** For the "which recipe" step of logging a batch from the freezer FAB. */
export async function fetchRecipeOptions(): Promise<RecipeOption[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, slug')
    .is('archived_at', null)
    .order('name')
  if (error) throw error
  return data
}
