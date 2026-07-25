import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AdaptationReviewPanel } from '@/features/recipes/components/AdaptationReviewPanel'
import { expectNoAxeViolations } from '@/test/accessibility'

test('groups every decision and explains unresolved lines accessibly', async () => {
  const { container } = render(
    <AdaptationReviewPanel
      decisions={[
        {
          kind: 'mapped',
          sourceLine: '20 g sprinkles',
          reason: 'Matched sprinkles.',
          ingredientId: 'sprinkles',
          ingredientName: 'Sprinkles',
          role: 'mixin',
        },
        {
          kind: 'unresolved',
          sourceLine: '1 cup mystery crunch',
          reason: 'No confident match.',
          ingredientId: null,
          ingredientName: null,
          role: null,
        },
      ]}
    />,
  )

  expect(screen.getByRole('heading', { name: 'Using' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
  expect(screen.getByText(/add a no-macro note/i)).toBeInTheDocument()
  await expectNoAxeViolations(container)
})
