import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PwaUpdatePrompt } from '@/app/PwaUpdatePrompt'
import { ToastProvider } from '@/app/ToastProvider'
import { useRegisterSW } from 'virtual:pwa-register/react'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}))

const mockedUseRegisterSW = vi.mocked(useRegisterSW)

test('offers to reload when a new version is available', () => {
  const updateServiceWorker = vi.fn(async () => undefined)
  mockedUseRegisterSW.mockReturnValue({
    needRefresh: [true, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  })

  render(
    <ToastProvider>
      <PwaUpdatePrompt />
    </ToastProvider>,
  )

  expect(screen.getByText('New version available')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

  expect(updateServiceWorker).toHaveBeenCalledWith(true)
})
