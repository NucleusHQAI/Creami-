import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchBases,
  fetchCategories,
  fetchIngredients,
  fetchSettings,
  from,
} = vi.hoisted(() => ({
  fetchBases: vi.fn(),
  fetchCategories: vi.fn(),
  fetchIngredients: vi.fn(),
  fetchSettings: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { from } }))
vi.mock('@/lib/api/bases', () => ({ fetchBases }))
vi.mock('@/lib/api/categories', () => ({ fetchCategories }))
vi.mock('@/lib/api/ingredients', () => ({ fetchIngredients }))
vi.mock('@/lib/api/settings', () => ({ fetchSettings }))

import { fetchExportData } from '@/lib/api/export'

describe('fetchExportData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchSettings.mockResolvedValue({ id: 1 })
    fetchCategories.mockResolvedValue([])
    fetchIngredients.mockResolvedValue([])
    fetchBases.mockResolvedValue([])
    from.mockImplementation((table: string) => ({
      select: vi.fn(() => {
        if (table === 'recipes') {
          return {
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return Promise.resolve({ data: [{ table }], error: null })
      }),
    }))
  })

  it('includes every household-owned table in the export', async () => {
    const result = await fetchExportData()

    expect(result).toMatchObject({
      batches: [{ table: 'batches' }],
      tasting_notes: [{ table: 'tasting_notes' }],
      plan_items: [{ table: 'plan_items' }],
      shopping_extras: [{ table: 'shopping_extras' }],
      shopping_checks: [{ table: 'shopping_checks' }],
    })
  })
})
