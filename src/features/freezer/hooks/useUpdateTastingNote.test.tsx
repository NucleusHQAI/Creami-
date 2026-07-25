import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import { queryKeys } from '@/lib/query-keys'

const { updateTastingNote } = vi.hoisted(() => ({
  updateTastingNote: vi.fn(),
}))

vi.mock('@/lib/api/tasting-notes', () => ({ updateTastingNote }))

import { useUpdateTastingNote } from '@/features/freezer/hooks/useUpdateTastingNote'

beforeEach(() => {
  vi.clearAllMocks()
  updateTastingNote.mockResolvedValue({ id: 'note-1' })
})

test('updates the review and refreshes every rating display', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUpdateTastingNote(), { wrapper })

  await act(async () => {
    await result.current.mutateAsync({
      id: 'note-1',
      recipeId: 'recipe-1',
      rating: 4,
      notes: 'Smoother after one re-spin',
    })
  })

  expect(updateTastingNote).toHaveBeenCalledWith({
    id: 'note-1',
    rating: 4,
    notes: 'Smoother after one re-spin',
  })
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: queryKeys.tastingNotes.forRecipe('recipe-1'),
  })
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: queryKeys.recipeRatings.forRecipe('recipe-1'),
  })
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.recipes.all })
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.batches.history })
})
