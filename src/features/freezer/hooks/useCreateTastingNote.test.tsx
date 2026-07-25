import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import { queryKeys } from '@/lib/query-keys'

const { createTastingNote } = vi.hoisted(() => ({
  createTastingNote: vi.fn(),
}))

vi.mock('@/lib/api/tasting-notes', () => ({ createTastingNote }))

import { useCreateTastingNote } from '@/features/freezer/hooks/useCreateTastingNote'

beforeEach(() => {
  vi.clearAllMocks()
  createTastingNote.mockResolvedValue({ id: 'note-1' })
})

test('invalidates the recipe list after a tasting note changes its rating', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useCreateTastingNote(), { wrapper })

  await act(async () => {
    await result.current.mutateAsync({ recipeId: 'recipe-1', rating: 5 })
  })

  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.recipes.all })
})
