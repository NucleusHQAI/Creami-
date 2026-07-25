import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import { queryKeys } from '@/lib/query-keys'
import type { RecipeWithLines } from '@/types/domain'

const { showToast, toggleFavourite } = vi.hoisted(() => ({
  showToast: vi.fn(),
  toggleFavourite: vi.fn(),
}))

vi.mock('@/lib/api/recipes', () => ({ toggleFavourite }))
vi.mock('@/app/ToastProvider', () => ({ useToast: () => ({ showToast }) }))

import { useToggleFavourite } from '@/features/recipes/hooks/useToggleFavourite'

function createRecipe(isFavourite: boolean): RecipeWithLines {
  return {
    id: 'recipe-1',
    slug: 'berry',
    is_favourite: isFavourite,
    ingredients: [],
  } as unknown as RecipeWithLines
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('optimistically patches every matching recipe detail cache', async () => {
  let resolveToggle: (() => void) | undefined
  toggleFavourite.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveToggle = resolve
    }),
  )
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  queryClient.setQueryData(queryKeys.recipes.detail('berry'), createRecipe(false))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useToggleFavourite(), { wrapper })

  act(() => {
    result.current.mutate({ id: 'recipe-1', next: true })
  })

  await waitFor(() => {
    expect(
      queryClient.getQueryData<RecipeWithLines>(queryKeys.recipes.detail('berry'))?.is_favourite,
    ).toBe(true)
  })

  await act(async () => {
    resolveToggle?.()
  })
})

test('restores matching recipe detail caches when the update fails', async () => {
  toggleFavourite.mockRejectedValue(new Error('network'))
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  queryClient.setQueryData(queryKeys.recipes.detail('berry'), createRecipe(false))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useToggleFavourite(), { wrapper })

  await act(async () => {
    await expect(result.current.mutateAsync({ id: 'recipe-1', next: true })).rejects.toThrow(
      'network',
    )
  })

  expect(
    queryClient.getQueryData<RecipeWithLines>(queryKeys.recipes.detail('berry'))?.is_favourite,
  ).toBe(false)
})
