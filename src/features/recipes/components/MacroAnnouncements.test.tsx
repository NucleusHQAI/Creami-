import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { EditorMacroReadout } from '@/features/recipes/components/EditorMacroReadout'
import { MacroPanel } from '@/features/recipes/components/MacroPanel'
import type { MacroResult } from '@/lib/macros/types'

function macroResult(kcal: number, proteinG: number, carbsG: number, fatG: number): MacroResult {
  return {
    perTub: {
      kcal,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
    },
    perServing: {
      kcal: kcal / 2,
      protein_g: proteinG / 2,
      carbs_g: carbsG / 2,
      fat_g: fatG / 2,
    },
    fillVolumeMl: 300,
    occupiedVolumeMl: 680,
    overflows: false,
    excludedLines: [],
    warnings: [],
  }
}

test('announces a scaled macro result as one atomic status', () => {
  const { rerender } = render(
    <MacroPanel
      macros={macroResult(400, 40, 60, 20)}
      overrideKcal={null}
      overrideProteinG={null}
      scale={1}
      servingsPerTub={2}
      scaleLabel="full tub"
    />,
  )

  rerender(
    <MacroPanel
      macros={macroResult(200, 20, 30, 10)}
      overrideKcal={null}
      overrideProteinG={null}
      scale={0.5}
      servingsPerTub={2}
      scaleLabel="half tub"
    />,
  )

  const status = screen.getByRole('status')
  expect(status).toHaveAttribute('aria-live', 'polite')
  expect(status).toHaveAttribute('aria-atomic', 'true')
  expect(status).toHaveTextContent(
    'Recalculated for half tub: 200 kcal and 20g protein per tub.',
  )
})

test('announces editor macro changes as one atomic status', () => {
  const { rerender } = render(
    <EditorMacroReadout macros={macroResult(400, 40, 60, 20)} />,
  )

  rerender(<EditorMacroReadout macros={macroResult(200, 20, 30, 10)} />)

  const status = screen.getByRole('status')
  expect(status).toHaveAttribute('aria-live', 'polite')
  expect(status).toHaveAttribute('aria-atomic', 'true')
  expect(status).toHaveTextContent('200 kcal 20g protein 30g carbs 10g fat')
})
