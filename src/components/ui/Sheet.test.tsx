import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { Sheet } from '@/components/ui/Sheet'
import { expectNoAxeViolations } from '@/test/accessibility'

function SheetHarness() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Test sheet">
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Re-render {count}
        </button>
      </Sheet>
    </>
  )
}

test('preserves focus across renders and returns it after Escape', async () => {
  const { container } = render(<SheetHarness />)
  const opener = screen.getByRole('button', { name: 'Open sheet' })
  opener.focus()
  fireEvent.click(opener)

  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  const rerenderButton = screen.getByRole('button', { name: 'Re-render 0' })
  rerenderButton.focus()
  fireEvent.click(rerenderButton)

  expect(screen.getByRole('button', { name: 'Re-render 1' })).toHaveFocus()
  await expectNoAxeViolations(container)

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener).toHaveFocus()
})

test('wraps focus in both directions', () => {
  render(<SheetHarness />)
  fireEvent.click(screen.getByRole('button', { name: 'Open sheet' }))

  const closeButton = screen.getByRole('button', { name: 'Close' })
  const lastButton = screen.getByRole('button', { name: 'Re-render 0' })

  lastButton.focus()
  fireEvent.keyDown(document, { key: 'Tab' })
  expect(closeButton).toHaveFocus()

  closeButton.focus()
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
  expect(lastButton).toHaveFocus()
})

test('uses a distinct title relationship for each rendered dialog', () => {
  render(
    <>
      <Sheet open onClose={() => undefined} title="First sheet">
        <p>First content</p>
      </Sheet>
      <Sheet open onClose={() => undefined} title="Second sheet">
        <p>Second content</p>
      </Sheet>
    </>,
  )

  expect(screen.getByRole('dialog', { name: 'First sheet' })).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Second sheet' })).toBeInTheDocument()
})
