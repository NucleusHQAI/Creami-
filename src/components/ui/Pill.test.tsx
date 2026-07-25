import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Pill } from '@/components/ui/Pill'

test('uses a guaranteed readable text colour for dynamic accent pills', () => {
  render(
    <Pill
      variant="accent"
      style={{ '--accent': '#d49b29', '--tint': '#fff1cf' } as React.CSSProperties}
    >
      Creamy classics
    </Pill>,
  )

  expect(screen.getByText('Creamy classics')).toHaveClass('text-ink')
})
