import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { onlineManager } from '@tanstack/react-query'
import { ToastProvider } from '@/app/ToastProvider'
import { RecipeActionButtons } from '@/features/recipes/components/RecipeActionButtons'

afterEach(() => {
  onlineManager.setOnline(true)
})

describe('RecipeActionButtons', () => {
  it('blocks server writes with an explanation while offline', () => {
    onlineManager.setOnline(false)

    render(
      <ToastProvider>
        <RecipeActionButtons onAddToShoppingList={vi.fn()} onLogBatch={vi.fn()} />
      </ToastProvider>,
    )

    expect(screen.getByRole('button', { name: 'Log a batch' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Log a batch' })).toHaveAttribute(
      'title',
      'Reconnect to log a batch.',
    )
    expect(screen.getByRole('button', { name: 'Add to shopping list' })).toBeDisabled()
  })
})
