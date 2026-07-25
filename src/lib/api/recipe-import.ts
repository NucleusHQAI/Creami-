import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { extractedRecipeSchema } from '@/features/recipes/import/extraction-schema'
import type { AdaptationRuleData, ExtractedRecipe } from '@/features/recipes/import/types'

const adaptationRuleSchema = z.object({
  id: z.string(),
  match_term: z.string().trim().min(1),
  action: z.enum(['map', 'omit', 'base_hint']),
  replacement_ingredient_id: z.string().nullable(),
  suggested_base_id: z.string().nullable(),
  suggested_role: z.enum(['addition', 'mixin']).nullable(),
  reason: z.string().trim().min(1),
  priority: z.number(),
})

export class RecipeImportError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'RecipeImportError'
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_url: 'Enter a complete HTTP or HTTPS recipe link.',
  blocked_host: 'That address cannot be fetched safely.',
  timeout: 'The recipe website took too long to respond. Try again or paste the ingredients.',
  too_large: 'That recipe page is too large to import. Paste the ingredients instead.',
  unsupported_content: 'That link is not a supported recipe page. Paste the ingredients instead.',
  no_structured_recipe: 'No supported structured recipe was found. Paste the ingredients instead.',
  invalid_request: 'Enter one valid recipe link.',
  fetch_failed: 'The recipe website could not be read. Try again or paste the ingredients.',
}
const DEFAULT_ERROR_MESSAGE =
  'The recipe website could not be read. Try again or paste the ingredients.'

async function functionErrorCode(context: unknown): Promise<string | null> {
  if (!(context instanceof Response)) return null
  try {
    const payload: unknown = await context.clone().json()
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'code' in payload.error &&
      typeof payload.error.code === 'string'
    ) {
      return payload.error.code
    }
  } catch {
    return null
  }
  return null
}

export async function extractRecipe(url: string): Promise<ExtractedRecipe> {
  const { data, error } = await supabase.functions.invoke('extract-recipe', {
    body: { url },
  })
  if (error) {
    const code = (await functionErrorCode(error.context)) ?? 'fetch_failed'
    throw new RecipeImportError(ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE, code)
  }

  const result = extractedRecipeSchema.safeParse(data)
  if (!result.success) {
    throw new RecipeImportError(
      'The recipe website returned an unexpected response. Paste the ingredients instead.',
      'invalid_response',
    )
  }
  return result.data
}

export async function fetchAdaptationRules(): Promise<AdaptationRuleData[]> {
  const { data, error } = await supabase
    .from('adaptation_rules')
    .select(
      'id, match_term, action, replacement_ingredient_id, suggested_base_id, suggested_role, reason, priority',
    )
    .order('priority', { ascending: false })
  if (error) throw error
  return z.array(adaptationRuleSchema).parse(data)
}
