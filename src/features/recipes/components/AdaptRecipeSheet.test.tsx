import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { AdaptRecipeSheet } from '@/features/recipes/components/AdaptRecipeSheet'
import type { BaseWithIngredients, Category, Ingredient } from '@/types/domain'

vi.mock('@/features/recipes/hooks/useExtractRecipe', () => ({
  useExtractRecipe: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
}))

const ingredient: Ingredient = {
  id: 'sprinkles',
  slug: 'sprinkles',
  name: 'Sprinkles',
  category: 'confectionery',
  basis: 'per_100g',
  kcal: 390,
  protein_g: 0,
  carbs_g: 88,
  fat_g: 4,
  density_g_per_ml: 0.8,
  grams_per_item: null,
  grams_per_tsp: null,
  negligible: false,
  counts_toward_volume: true,
  notes: null,
  is_seed: true,
  created_at: '',
  updated_at: '',
}

const base: BaseWithIngredients = {
  id: 'everyday',
  key: 'everyday',
  name: 'Everyday creamy',
  tagline: null,
  summary: null,
  guidance: null,
  is_variation_of: null,
  fill_ingredient_id: 'milk',
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ingredients: [],
}

const category: Category = {
  id: 'classic',
  key: 'classic',
  label: 'Creamy classics',
  emoji: null,
  accent: '',
  tint: '',
  sort_order: 0,
}

test('builds a pasted adaptation and returns focus after use', () => {
  const onUse = vi.fn()
  const onClose = vi.fn()
  render(
    <AdaptRecipeSheet
      open
      onClose={onClose}
      onUse={onUse}
      isOnline
      bases={[base]}
      ingredients={[ingredient]}
      categories={[category]}
      rules={[]}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Paste ingredients' }))
  fireEvent.change(screen.getByLabelText(/recipe title/i), {
    target: { value: 'Birthday cake' },
  })
  fireEvent.change(screen.getByLabelText(/ingredients, one per line/i), {
    target: { value: '20 g sprinkles\n1 cup Mystery Crunch' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Build adaptation' }))

  expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Use this adaptation' }))
  expect(onUse).toHaveBeenCalledWith(
    expect.objectContaining({ values: expect.objectContaining({ name: 'Birthday cake' }) }),
  )
  expect(onClose).toHaveBeenCalled()
})

test('explains why adaptation is blocked offline', () => {
  render(
    <AdaptRecipeSheet
      open
      onClose={vi.fn()}
      onUse={vi.fn()}
      isOnline={false}
      bases={[base]}
      ingredients={[ingredient]}
      categories={[category]}
      rules={[]}
    />,
  )
  expect(screen.getByText(/reconnect before adapting/i)).toBeInTheDocument()
})
