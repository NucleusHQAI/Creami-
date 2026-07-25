import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { onlineManager } from '@tanstack/react-query'
import { ToastProvider } from '@/app/ToastProvider'
import { RecipeOverflowMenu } from '@/features/recipes/components/RecipeOverflowMenu'
import { expectNoAxeViolations } from '@/test/accessibility'

afterEach(() => {
  onlineManager.setOnline(true)
})

test('supports menu arrow keys and returns focus on Escape', async () => {
  const { container } = render(
    <ToastProvider>
      <RecipeOverflowMenu onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />
    </ToastProvider>,
  )

  const trigger = screen.getByRole('button', { name: 'Recipe actions' })
  fireEvent.click(trigger)

  const menu = screen.getByRole('menu', { name: 'Recipe actions' })
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()

  fireEvent.keyDown(menu, { key: 'ArrowDown' })
  expect(screen.getByRole('menuitem', { name: 'Add to shopping list' })).toHaveFocus()

  fireEvent.keyDown(menu, { key: 'End' })
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()

  fireEvent.keyDown(menu, { key: 'Home' })
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()

  await expectNoAxeViolations(container)
  fireEvent.keyDown(menu, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('blocks recipe changes with an explanation while offline', () => {
  const onEdit = vi.fn()
  onlineManager.setOnline(false)

  render(
    <ToastProvider>
      <RecipeOverflowMenu onEdit={onEdit} onDuplicate={vi.fn()} onDelete={vi.fn()} />
    </ToastProvider>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Recipe actions' }))
  const edit = screen.getByRole('menuitem', { name: 'Edit' })

  expect(edit).toHaveAttribute('aria-disabled', 'true')
  expect(edit).toHaveAttribute('title', 'Reconnect to change this recipe.')
  fireEvent.click(edit)
  expect(onEdit).not.toHaveBeenCalled()
  expect(screen.getByText('Reconnect to change this recipe.')).toBeInTheDocument()
})
