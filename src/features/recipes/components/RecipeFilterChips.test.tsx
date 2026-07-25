import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { RecipeFilterChips } from '@/features/recipes/components/RecipeFilterChips'
import { expectNoAxeViolations } from '@/test/accessibility'
import type { Category } from '@/types/domain'

const category: Category = {
  accent: '#a23b5d',
  emoji: '🍓',
  id: 'category-1',
  key: 'fruit',
  label: 'Fruit',
  sort_order: 1,
  tint: '#f9e9ef',
}

test('exposes the pressed filter buttons as a labelled group', async () => {
  const { container } = render(
    <RecipeFilterChips categories={[category]} value="fruit" onChange={vi.fn()} />,
  )

  expect(screen.getByRole('group', { name: 'Filter recipes' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Fruit' })).toHaveAttribute('aria-pressed', 'true')
  await expectNoAxeViolations(container)
})
