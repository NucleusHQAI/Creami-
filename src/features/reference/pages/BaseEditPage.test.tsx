import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import type { AppSettings, BaseWithIngredients, Ingredient } from '@/types/domain'

const {
  mutateAsync,
  showToast,
  useBases,
  useBaseUsage,
  useIngredients,
  useSettings,
  useUpdateBase,
} = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  showToast: vi.fn(),
  useBases: vi.fn(),
  useBaseUsage: vi.fn(),
  useIngredients: vi.fn(),
  useSettings: vi.fn(),
  useUpdateBase: vi.fn(),
}))

vi.mock('@/features/reference/hooks/useBases', () => ({
  useBases,
  useBaseUsage,
  useUpdateBase,
}))
vi.mock('@/features/reference/hooks/useIngredients', () => ({ useIngredients }))
vi.mock('@/features/reference/hooks/useSettings', () => ({ useSettings }))
vi.mock('@/app/ToastProvider', () => ({ useToast: () => ({ showToast }) }))
vi.mock('@/features/reference/lib/baseMacros', () => ({
  calculateBaseOnlyMacros: () => ({
    perTub: { kcal: 100, protein_g: 10, carbs_g: 12, fat_g: 2 },
  }),
}))

import BaseEditPage from '@/features/reference/pages/BaseEditPage'

const milk = {
  id: 'milk',
  name: 'Semi-skimmed milk',
  category: 'dairy',
} as Ingredient
const yoghurt = {
  id: 'yoghurt',
  name: 'Greek yoghurt',
  category: 'dairy',
} as Ingredient
const base = {
  id: 'base-1',
  key: 'everyday',
  name: 'Everyday creamy',
  fill_ingredient_id: milk.id,
  ingredients: [
    {
      id: 'line-1',
      base_id: 'base-1',
      ingredient_id: milk.id,
      quantity: 200,
      unit: 'ml',
      note: null,
      sort_order: 0,
      ingredient: milk,
    },
    {
      id: 'line-2',
      base_id: 'base-1',
      ingredient_id: yoghurt.id,
      quantity: 100,
      unit: 'g',
      note: null,
      sort_order: 1,
      ingredient: yoghurt,
    },
  ],
} as BaseWithIngredients

beforeEach(() => {
  vi.clearAllMocks()
  mutateAsync.mockResolvedValue(undefined)
  useBases.mockReturnValue({ data: [base], isLoading: false, isError: false, refetch: vi.fn() })
  useIngredients.mockReturnValue({
    data: [milk, yoghurt],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  useSettings.mockReturnValue({
    data: { id: 1, max_fill_ml: 680 } as AppSettings,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  useBaseUsage.mockReturnValue({ data: 4, isLoading: false, isError: false })
  useUpdateBase.mockReturnValue({ mutateAsync, isPending: false })
})

test('saves the selected fill ingredient with the edited lines', async () => {
  render(
    <MemoryRouter
      initialEntries={['/bases/everyday']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/bases/:key" element={<BaseEditPage />} />
        <Route path="/bases" element={<div>Bases</div>} />
      </Routes>
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByRole('combobox', { name: 'Fill ingredient' }), {
    target: { value: yoghurt.id },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save base' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

  await waitFor(() => {
    expect(mutateAsync).toHaveBeenCalledWith({
      id: base.id,
      input: expect.objectContaining({ fillIngredientId: yoghurt.id }),
    })
  })
})
