import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { IngredientPicker } from '@/features/recipes/components/IngredientPicker'
import { useIngredientUsageCounts } from '@/features/recipes/hooks/useIngredientUsageCounts'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { expectNoAxeViolations } from '@/test/accessibility'
import type { Ingredient } from '@/types/domain'

vi.mock('@/features/reference/hooks/useIngredients', () => ({ useIngredients: vi.fn() }))
vi.mock('@/features/recipes/hooks/useIngredientUsageCounts', () => ({
  useIngredientUsageCounts: vi.fn(),
}))
vi.mock('@/features/reference/components/IngredientEditSheet', () => ({
  IngredientEditSheet: () => null,
}))

const ingredients: Ingredient[] = [
  {
    basis: 'per_100g',
    carbs_g: 8,
    category: 'flavour',
    counts_toward_volume: true,
    created_at: '2026-07-25T00:00:00Z',
    density_g_per_ml: 1,
    fat_g: 1,
    grams_per_item: null,
    grams_per_tsp: null,
    id: 'vanilla',
    is_seed: true,
    kcal: 40,
    name: 'Vanilla',
    negligible: false,
    notes: null,
    protein_g: 2,
    slug: 'vanilla',
    updated_at: '2026-07-25T00:00:00Z',
  },
  {
    basis: 'per_100g',
    carbs_g: 12,
    category: 'fruit',
    counts_toward_volume: true,
    created_at: '2026-07-25T00:00:00Z',
    density_g_per_ml: 1,
    fat_g: 0,
    grams_per_item: null,
    grams_per_tsp: null,
    id: 'strawberry',
    is_seed: true,
    kcal: 45,
    name: 'Strawberry',
    negligible: false,
    notes: null,
    protein_g: 1,
    slug: 'strawberry',
    updated_at: '2026-07-25T00:00:00Z',
  },
]

const mockedUseIngredients = vi.mocked(useIngredients)
const mockedUseIngredientUsageCounts = vi.mocked(useIngredientUsageCounts)

beforeEach(() => {
  mockedUseIngredients.mockReturnValue({
    data: ingredients,
  } as ReturnType<typeof useIngredients>)
  mockedUseIngredientUsageCounts.mockReturnValue({
    data: new Map<string, number>(),
  } as ReturnType<typeof useIngredientUsageCounts>)
})

test('owns and keyboard-navigates its ingredient listbox', async () => {
  const onSelectIngredient = vi.fn()
  const { container } = render(
    <IngredientPicker
      ingredientId={null}
      freeText={null}
      onSelectIngredient={onSelectIngredient}
      onSetFreeText={vi.fn()}
      ariaLabel="Ingredient"
    />,
  )

  const combobox = screen.getByRole('combobox', { name: 'Ingredient' })
  fireEvent.focus(combobox)
  const listbox = screen.getByRole('listbox', { name: 'Ingredient' })
  expect(combobox).toHaveAttribute('aria-controls', listbox.id)

  fireEvent.keyDown(combobox, { key: 'ArrowDown' })
  expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    `${listbox.id}-option-vanilla`,
  )

  fireEvent.keyDown(combobox, { key: 'ArrowDown' })
  expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    `${listbox.id}-option-strawberry`,
  )

  await expectNoAxeViolations(container)
  fireEvent.keyDown(combobox, { key: 'Enter' })
  expect(onSelectIngredient).toHaveBeenCalledWith(ingredients[1])
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('closes the listbox on Escape without selecting', () => {
  const onSelectIngredient = vi.fn()
  render(
    <IngredientPicker
      ingredientId={null}
      freeText={null}
      onSelectIngredient={onSelectIngredient}
      onSetFreeText={vi.fn()}
      ariaLabel="Ingredient"
    />,
  )

  const combobox = screen.getByRole('combobox', { name: 'Ingredient' })
  fireEvent.focus(combobox)
  fireEvent.keyDown(combobox, { key: 'Escape' })

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onSelectIngredient).not.toHaveBeenCalled()
})
