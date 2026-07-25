import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '@/app/LoginPage'
import { useAuth } from '@/app/providers'
import { expectNoAxeViolations } from '@/test/accessibility'

vi.mock('@/app/providers', () => ({ useAuth: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)

test('ties a sign-in error to both credential fields', async () => {
  mockedUseAuth.mockReturnValue({
    session: null,
    loading: false,
    signOut: vi.fn(async () => undefined),
    signIn: vi.fn(async () => ({ error: 'Email or password is incorrect.' })),
  })

  const { container } = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LoginPage />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'cook@example.test' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveAttribute('id', 'login-error')
  expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'login-error')
  expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'login-error')
  expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  await expectNoAxeViolations(container)
})
