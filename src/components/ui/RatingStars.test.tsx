import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { RatingStars } from '@/components/ui/RatingStars'
import { expectNoAxeViolations } from '@/test/accessibility'

test('uses native pressed buttons for an editable rating', async () => {
  const onChange = vi.fn()
  const { container } = render(<RatingStars value={2} onChange={onChange} />)

  expect(screen.getByRole('group', { name: 'Rating' })).toBeInTheDocument()
  const buttons = screen.getAllByRole('button')
  expect(buttons).toHaveLength(5)
  expect(screen.getByRole('button', { name: '2 stars' })).toHaveAttribute('aria-pressed', 'true')

  fireEvent.click(screen.getByRole('button', { name: '3 stars' }))
  expect(onChange).toHaveBeenCalledWith(3)
  await expectNoAxeViolations(container)
})
