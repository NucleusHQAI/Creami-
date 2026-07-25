import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { RecipeCard } from '@/features/recipes/components/RecipeCard'
import { expectNoAxeViolations } from '@/test/accessibility'
import type { RecipeListRow } from '@/types/domain'

const recipe: RecipeListRow = {
  accent: '#a23b5d',
  active_batches: 0,
  archived_at: null,
  average_rating: 4.5,
  base_key: 'classic',
  base_name: 'Classic base',
  category_key: 'dessert',
  category_label: 'Dessert',
  created_at: '2026-07-25T00:00:00Z',
  emoji: '🍓',
  id: 'recipe-1',
  is_favourite: false,
  name: 'Berry',
  profile: 'Bright and creamy.',
  rating_count: 2,
  slug: 'berry',
  tint: '#f9e9ef',
  updated_at: '2026-07-25T00:00:00Z',
}

test('keeps the recipe link and favourite button as accessible siblings', async () => {
  const { container } = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RecipeCard
        recipe={recipe}
        kcal={320}
        proteinG={28}
        onToggleFavourite={vi.fn()}
      />
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: 'View Berry recipe' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeInTheDocument()
  const categoryLabel = screen.getByText('Dessert')
  expect(categoryLabel).toBeVisible()
  expect(categoryLabel).toHaveClass('text-ink')
  expect(categoryLabel).not.toHaveStyle({ color: recipe.accent })
  await expectNoAxeViolations(container)
})
