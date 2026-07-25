import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, update, updateEq, deleteRows, deleteEq, insert } = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  deleteRows: vi.fn(),
  deleteEq: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { updateBase } from '@/lib/api/bases'

describe('updateBase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateEq.mockResolvedValue({ error: null })
    update.mockReturnValue({ eq: updateEq })
    deleteEq.mockResolvedValue({ error: null })
    deleteRows.mockReturnValue({ eq: deleteEq })
    insert.mockResolvedValue({ error: null })
    from.mockImplementation((table: string) => {
      if (table === 'bases') return { update }
      return { delete: deleteRows, insert }
    })
  })

  it('updates the base fill ingredient with its ingredient lines', async () => {
    await updateBase('base-1', {
      fillIngredientId: 'ingredient-skimmed',
      ingredients: [
        {
          ingredient_id: 'ingredient-skimmed',
          quantity: 200,
          unit: 'ml',
          note: null,
        },
      ],
    })

    expect(update).toHaveBeenCalledWith({ fill_ingredient_id: 'ingredient-skimmed' })
    expect(updateEq).toHaveBeenCalledWith('id', 'base-1')
  })
})
