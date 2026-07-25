import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, single } = vi.hoisted(() => ({
  from: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { insertRecipeSource, safeSourceUrl } from '@/lib/api/recipe-sources'

describe('recipe source API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    single.mockResolvedValue({ data: { id: 'source-1' }, error: null })
    from.mockReturnValue({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single })) })),
    })
  })

  it('inserts compact source attribution', async () => {
    await insertRecipeSource('recipe-1', {
      sourceUrl: 'https://example.com/recipe',
      sourceTitle: 'Recipe',
      sourceSite: 'example.com',
      adaptationSummary: 'Adapted around Everyday creamy.',
      retrievedAt: null,
    })
    expect(from).toHaveBeenCalledWith('recipe_sources')
  })

  it.each([
    ['https://example.com/recipe', 'https://example.com/recipe'],
    ['http://example.com', 'http://example.com/'],
    ['javascript:alert(1)', null],
    ['not a URL', null],
  ])('validates saved source link %s', (value, expected) => {
    expect(safeSourceUrl(value)).toBe(expected)
  })
})
