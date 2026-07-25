import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { TastingNoteForm } from '@/features/freezer/components/TastingNoteForm'

test('prefills an existing review and submits the edited values', () => {
  const onSubmit = vi.fn()

  render(
    <TastingNoteForm
      initialValue={{ rating: 3, notes: 'A little icy' }}
      submitLabel="Save changes"
      onSubmit={onSubmit}
    />,
  )

  expect(screen.getByRole('button', { name: '3 stars' })).toHaveAttribute('aria-pressed', 'true')
  const notes = screen.getByRole('textbox', { name: 'Notes' })
  expect(notes).toHaveValue('A little icy')

  fireEvent.click(screen.getByRole('button', { name: '4 stars' }))
  fireEvent.change(notes, { target: { value: 'Better after one re-spin' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(onSubmit).toHaveBeenCalledWith({
    rating: 4,
    notes: 'Better after one re-spin',
  })
})
