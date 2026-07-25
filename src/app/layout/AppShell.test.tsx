import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { AppShell } from '@/app/layout/AppShell'
import { expectNoAxeViolations } from '@/test/accessibility'

test('provides a keyboard skip link and a labelled main landmark', async () => {
  const { container } = render(
    <MemoryRouter
      initialEntries={['/freezer']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppShell>
        <h1>Freezer</h1>
      </AppShell>
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
    'href',
    '#main-content',
  )
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  for (const link of screen.getAllByRole('link', { name: /Freezer/ })) {
    expect(link).toHaveAttribute('aria-current', 'page')
  }
  await expectNoAxeViolations(container)
})
