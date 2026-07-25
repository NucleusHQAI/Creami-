import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { RecipeInput } from '@/lib/api/recipes'
import type { Recipe } from '@/types/domain'

const { upsertRecipe, uploadRecipeImage, removeRecipeImage, insertRecipeSource } = vi.hoisted(
  () => ({
    upsertRecipe: vi.fn(),
    uploadRecipeImage: vi.fn(),
    removeRecipeImage: vi.fn(),
    insertRecipeSource: vi.fn(),
  }),
)

vi.mock('@/lib/api/recipes', () => ({ upsertRecipe }))
vi.mock('@/lib/api/recipe-images', () => ({
  uploadRecipeImage,
  removeRecipeImage,
  isUploadedRecipeImage: (path: string | null) => path !== null && !path.startsWith('/'),
}))
vi.mock('@/lib/api/recipe-sources', () => ({ insertRecipeSource }))

import { useSaveRecipe } from '@/features/recipes/hooks/useSaveRecipe'

const input: RecipeInput = {
  id: 'recipe-1',
  slug: 'birthday-cake',
  name: 'Birthday Cake',
  categoryId: 'category-1',
  baseId: 'base-1',
  profile: null,
  tip: null,
  mixinNote: null,
  methodOverride: null,
  imagePath: 'uploads/old.webp',
  macroOverrideKcal: null,
  macroOverrideProteinG: null,
  isFavourite: false,
  ingredients: [],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  removeRecipeImage.mockResolvedValue(undefined)
})

test('uploads a replacement, saves its path and removes the previous upload', async () => {
  const file = new File(['photo'], 'birthday.webp', { type: 'image/webp' })
  uploadRecipeImage.mockResolvedValue('uploads/new.webp')
  upsertRecipe.mockResolvedValue({
    id: 'recipe-1',
    slug: 'birthday-cake',
    image_path: 'uploads/new.webp',
  } as Recipe)

  const { result } = renderHook(() => useSaveRecipe(), { wrapper: createWrapper() })

  await act(async () => {
    await result.current.mutateAsync({
      input,
      imageFile: file,
      previousImagePath: 'uploads/old.webp',
      source: null,
    })
  })

  expect(upsertRecipe).toHaveBeenCalledWith({
    ...input,
    imagePath: 'uploads/new.webp',
  })
  expect(removeRecipeImage).toHaveBeenCalledWith('uploads/old.webp')
})

test('removes a new upload when the recipe save fails', async () => {
  const file = new File(['photo'], 'birthday.webp', { type: 'image/webp' })
  uploadRecipeImage.mockResolvedValue('uploads/new.webp')
  upsertRecipe.mockRejectedValue(new Error('save failed'))

  const { result } = renderHook(() => useSaveRecipe(), { wrapper: createWrapper() })

  await act(async () => {
    await expect(
      result.current.mutateAsync({
        input,
        imageFile: file,
        previousImagePath: 'uploads/old.webp',
        source: null,
      }),
    ).rejects.toThrow('save failed')
  })

  expect(removeRecipeImage).toHaveBeenCalledWith('uploads/new.webp')
})

test('keeps the recipe saved when source attribution fails', async () => {
  upsertRecipe.mockResolvedValue({
    id: 'recipe-1',
    slug: 'birthday-cake',
    image_path: null,
  } as Recipe)
  insertRecipeSource.mockRejectedValue(new Error('source failed'))
  const { result } = renderHook(() => useSaveRecipe(), { wrapper: createWrapper() })

  let savedSource = true
  await act(async () => {
    const saved = await result.current.mutateAsync({
      input,
      imageFile: null,
      previousImagePath: null,
      source: {
        sourceUrl: 'https://example.com/recipe',
        sourceTitle: 'Birthday cake',
        sourceSite: 'example.com',
        adaptationSummary: 'Adapted around Everyday creamy.',
        retrievedAt: null,
      },
    })
    savedSource = saved.sourceAttached
  })

  expect(savedSource).toBe(false)
})
