import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

const { useRecipeBatches } = vi.hoisted(() => ({
  useRecipeBatches: vi.fn(),
}))

vi.mock('@/features/freezer/hooks/useRecipeBatches', () => ({ useRecipeBatches }))

import { RecipeInsights } from '@/features/freezer/components/RecipeInsights'

beforeEach(() => {
  vi.clearAllMocks()
})

test('shows no insights before three batches exist', () => {
  useRecipeBatches.mockReturnValue({
    data: [
      { id: 'batch-1', spun_at: null, respin_count: 0, added_milk_ml: null },
      { id: 'batch-2', spun_at: null, respin_count: 0, added_milk_ml: null },
    ],
    isLoading: false,
    isError: false,
    error: null,
  })

  render(<RecipeInsights recipeId="recipe-1" />)

  expect(screen.queryByText(/Made 2 times/)).not.toBeInTheDocument()
})

test('shows the made count once three batches exist', () => {
  useRecipeBatches.mockReturnValue({
    data: [
      { id: 'batch-1', spun_at: null, respin_count: 0, added_milk_ml: null },
      { id: 'batch-2', spun_at: null, respin_count: 0, added_milk_ml: null },
      { id: 'batch-3', spun_at: null, respin_count: 0, added_milk_ml: null },
    ],
    isLoading: false,
    isError: false,
    error: null,
  })

  render(<RecipeInsights recipeId="recipe-1" />)

  expect(screen.getByText('Made 3 times')).toBeInTheDocument()
})
