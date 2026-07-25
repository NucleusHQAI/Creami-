import { describe, expect, it, vi } from 'vitest'

const { from, insert, select, single, update, eq } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import { createBatch, markFinished, markSpun } from '@/lib/api/batches'

describe('createBatch', () => {
  it('leaves ready_at to the database trigger', async () => {
    single.mockResolvedValue({ data: { id: 'batch-1' }, error: null })
    select.mockReturnValue({ single })
    insert.mockReturnValue({ select })
    from.mockReturnValue({ insert })

    await createBatch({
      recipeId: 'recipe-1',
      frozenAt: new Date('2026-07-25T12:00:00.000Z'),
      notes: 'Weekend batch',
    })

    expect(insert).toHaveBeenCalledWith({
      recipe_id: 'recipe-1',
      frozen_at: '2026-07-25T12:00:00.000Z',
      notes: 'Weekend batch',
    })
  })

  it('uses the captured action times when replaying batch updates', async () => {
    eq.mockResolvedValue({ error: null })
    update.mockReturnValue({ eq })
    from.mockReturnValue({ update })

    await markSpun(
      'batch-1',
      { respins: 1, milkMl: 20 },
      '2026-07-25T12:00:00.000Z',
    )
    expect(update).toHaveBeenCalledWith({
      status: 'spun',
      spun_at: '2026-07-25T12:00:00.000Z',
      respin_count: 1,
      added_milk_ml: 20,
    })

    await markFinished('batch-1', '2026-07-25T13:00:00.000Z')
    expect(update).toHaveBeenLastCalledWith({
      status: 'finished',
      finished_at: '2026-07-25T13:00:00.000Z',
    })
  })
})
