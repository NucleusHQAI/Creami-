import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { test, vi } from 'vitest'
import { Field } from '@/components/ui/Field'
import { TastingNoteForm } from '@/features/freezer/components/TastingNoteForm'
import { IngredientList } from '@/features/recipes/components/IngredientList'
import { MacroPanel } from '@/features/recipes/components/MacroPanel'
import { ServingToggle } from '@/features/recipes/components/ServingToggle'
import MorePage from '@/features/reference/pages/MorePage'
import { PlanChip } from '@/features/shopping/components/PlanChip'
import { ShoppingLineRow } from '@/features/shopping/components/ShoppingLineRow'
import { expectNoAxeViolations } from '@/test/accessibility'
import type { MacroResult } from '@/lib/macros/types'
import type { ShoppingIngredientLine } from '@/features/shopping/types'

const macros: MacroResult = {
  perTub: { kcal: 320, protein_g: 28, carbs_g: 35, fat_g: 8 },
  perServing: { kcal: 160, protein_g: 14, carbs_g: 17.5, fat_g: 4 },
  fillVolumeMl: 300,
  occupiedVolumeMl: 525,
  overflows: false,
  excludedLines: [],
  warnings: [],
}

test('recipe controls have no axe violations', async () => {
  const { container } = render(
    <main>
      <h1>Berry recipe</h1>
      <ServingToggle mode="full" customMl={500} maxFillMl={525} onChange={vi.fn()} />
      <MacroPanel
        macros={macros}
        overrideKcal={null}
        overrideProteinG={null}
        scale={1}
        servingsPerTub={2}
        scaleLabel="full tub"
      />
      <IngredientList
        lines={[
          {
            id: 'line-1',
            label: 'Strawberries',
            quantity: '100g',
            isFreeText: false,
            optional: true,
          },
        ]}
        onToggleOptional={vi.fn()}
        excludedIds={new Set<string>()}
      />
    </main>,
  )

  await expectNoAxeViolations(container)
})

test('freezer controls have no axe violations', async () => {
  const { container } = render(
    <main>
      <h1>Freezer</h1>
      <TastingNoteForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    </main>,
  )

  await expectNoAxeViolations(container)
})

test('shopping controls have no axe violations', async () => {
  const line: ShoppingIngredientLine = {
    kind: 'ingredient',
    ingredientId: 'milk',
    name: 'Milk',
    category: 'Dairy',
    quantity: 300,
    unit: 'ml',
    recipes: [{ recipeId: 'recipe-1', name: 'Berry', multiplier: 1 }],
  }

  const { container } = render(
    <main>
      <h1>Shopping</h1>
      <ul>
        <ShoppingLineRow line={line} checked={false} onToggle={vi.fn()} />
      </ul>
      <PlanChip recipeName="Berry" multiplier={1} onMultiplierChange={vi.fn()} onRemove={vi.fn()} />
    </main>,
  )

  await expectNoAxeViolations(container)
})

test('reference and settings controls have no axe violations', async () => {
  const { container } = render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <main>
        <MorePage />
        <section aria-labelledby="settings-test-heading">
          <h2 id="settings-test-heading">Settings form</h2>
          <Field label="Name" hint="Shown on the recipe card">
            {(props) => <input {...props} type="text" />}
          </Field>
          <Field label="Servings" error="Enter at least one serving">
            {(props) => <input {...props} type="number" />}
          </Field>
          <Field label="Default milk">
            {(props) => (
              <select {...props}>
                <option>Skimmed milk</option>
              </select>
            )}
          </Field>
          <Field label="Method notes">{(props) => <textarea {...props} />}</Field>
        </section>
      </main>
    </MemoryRouter>,
  )

  await expectNoAxeViolations(container)
})
