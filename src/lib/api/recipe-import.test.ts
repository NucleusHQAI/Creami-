import { beforeEach, describe, expect, it, vi } from 'vitest'

const { invoke, from } = vi.hoisted(() => ({
  invoke: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke }, from },
}))

import { extractRecipe, fetchAdaptationRules, RecipeImportError } from '@/lib/api/recipe-import'

const validRecipe = {
  source: {
    url: 'https://example.com/recipe',
    title: 'Chocolate',
    site: 'example.com',
    retrievedAt: '2026-07-25T12:00:00.000Z',
  },
  name: 'Chocolate',
  description: null,
  recipeYield: '1 tub',
  ingredients: [{ original: '20 g cocoa powder' }],
}

describe('recipe import API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes the authenticated function and validates its response', async () => {
    invoke.mockResolvedValue({ data: validRecipe, error: null })
    await expect(extractRecipe('https://example.com/recipe')).resolves.toEqual(validRecipe)
    expect(invoke).toHaveBeenCalledWith('extract-recipe', {
      body: { url: 'https://example.com/recipe' },
    })
  })

  it('rejects an unexpected function response', async () => {
    invoke.mockResolvedValue({ data: { nutrition: { calories: 900 } }, error: null })
    await expect(extractRecipe('https://example.com')).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('translates stable function errors', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        context: new Response(
          JSON.stringify({ error: { code: 'no_structured_recipe', message: 'No recipe' } }),
        ),
      },
    })
    await expect(extractRecipe('https://example.com')).rejects.toEqual(
      expect.objectContaining<Partial<RecipeImportError>>({
        code: 'no_structured_recipe',
        message: expect.stringMatching(/paste the ingredients/i),
      }),
    )
  })

  it('reads ordered adaptation rules through the API layer', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'rule',
          match_term: 'pb2',
          action: 'map',
          replacement_ingredient_id: 'ingredient',
          suggested_base_id: null,
          suggested_role: 'addition',
          reason: 'Existing replacement',
          priority: 100,
        },
      ],
      error: null,
    })
    const select = vi.fn(() => ({ order }))
    from.mockReturnValue({ select })

    await expect(fetchAdaptationRules()).resolves.toHaveLength(1)
    expect(from).toHaveBeenCalledWith('adaptation_rules')
    expect(order).toHaveBeenCalledWith('priority', { ascending: false })
  })
})
