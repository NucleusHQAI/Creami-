import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { fetchRecipePage, RecipeExtractionError } from '../_shared/fetch-recipe-page.ts'
import { extractRecipeJsonLd } from '../_shared/recipe-json-ld.ts'

function errorResponse(error: RecipeExtractionError): Response {
  return Response.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  )
}

async function resolveDns(hostname: string, type: 'A' | 'AAAA'): Promise<string[]> {
  return Deno.resolveDns(hostname, type)
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request) => {
    if (request.method !== 'POST') {
      return Response.json(
        { error: { code: 'invalid_request', message: 'Use POST to extract a recipe.' } },
        { status: 405 },
      )
    }

    let input: unknown
    try {
      input = await request.json()
    } catch {
      return errorResponse(
        new RecipeExtractionError('invalid_request', 'Send a JSON recipe link.', 400),
      )
    }

    if (
      typeof input !== 'object' ||
      input === null ||
      Array.isArray(input) ||
      Object.keys(input).length !== 1 ||
      !('url' in input) ||
      typeof input.url !== 'string'
    ) {
      return errorResponse(
        new RecipeExtractionError('invalid_request', 'Send one HTTP or HTTPS recipe link.', 400),
      )
    }

    try {
      const page = await fetchRecipePage(input.url, resolveDns)
      const recipe = extractRecipeJsonLd(page.html, page.finalUrl)
      if (!recipe) {
        throw new RecipeExtractionError(
          'no_structured_recipe',
          'No supported structured recipe was found. Paste the ingredients instead.',
          422,
        )
      }
      return Response.json(recipe)
    } catch (error) {
      if (error instanceof RecipeExtractionError) return errorResponse(error)
      console.error('Recipe extraction failed.', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return errorResponse(
        new RecipeExtractionError(
          'fetch_failed',
          'The recipe could not be extracted. Try pasting its ingredients instead.',
          502,
        ),
      )
    }
  }),
}
