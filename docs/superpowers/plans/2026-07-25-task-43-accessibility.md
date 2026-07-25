# Task 43 Accessibility Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every application control keyboard-operable, expose validation and macro changes to assistive technology, and retain automated axe regression checks.

**Architecture:** Keep accessibility behaviour in the existing shared controls and feature components. Add one typed `axe-core` test helper, focused component interaction tests, and a final real-browser audit; do not add an audit-only production route or a new end-to-end framework.

**Tech Stack:** React 18, TypeScript strict mode, Vitest, Testing Library, jsdom, axe-core 4.12.1, React Router, Tailwind CSS.

---

## File map

- Create `src/test/accessibility.ts`: shared axe runner and readable violation formatter.
- Modify `package.json` and `package-lock.json`: add `axe-core` as a development dependency.
- Create `src/app/layout/AppShell.test.tsx`: landmarks, skip link, current navigation, and axe coverage.
- Modify `src/app/layout/AppShell.tsx`: keyboard skip link and stable main target.
- Create `src/app/LoginPage.test.tsx`: login error relationship and axe coverage.
- Modify `src/app/LoginPage.tsx`: connect sign-in errors to both credentials.
- Create `src/components/ui/Sheet.test.tsx`: dialog, focus trap, Escape, re-render stability, and focus return.
- Modify `src/components/ui/Sheet.tsx`: unique title ID and stable focus lifecycle.
- Create `src/components/ui/RatingStars.test.tsx`: native-button keyboard semantics and axe coverage.
- Modify `src/components/ui/RatingStars.tsx`: use a labelled button group with pressed state.
- Create `src/features/recipes/components/RecipeCard.test.tsx`: no nested interactive elements and category text.
- Modify `src/features/recipes/components/RecipeCard.tsx`: stretched sibling link plus favourite button.
- Create `src/features/recipes/components/RecipeFilterChips.test.tsx`: valid single-select button-group semantics.
- Modify `src/features/recipes/components/RecipeFilterChips.tsx`: use `role="group"` for pressed buttons.
- Create `src/features/recipes/components/RecipeOverflowMenu.test.tsx`: focus entry, arrow navigation, Escape, and axe.
- Modify `src/features/recipes/components/RecipeOverflowMenu.tsx`: keyboard-complete menu behaviour.
- Create `src/features/recipes/components/IngredientPicker.test.tsx`: combobox ownership, option navigation, selection, Escape, and axe.
- Modify `src/features/recipes/components/IngredientPicker.tsx`: standards-compliant combobox/listbox keyboard model.
- Create `src/features/recipes/components/MacroAnnouncements.test.tsx`: exact live-region changes.
- Modify `src/features/recipes/components/MacroPanel.tsx`: atomic status announcement.
- Modify `src/features/recipes/components/EditorMacroReadout.tsx`: atomic editor status announcement.
- Create `src/test/feature-accessibility.test.tsx`: axe smoke coverage for representative recipe, freezer, shopping, reference, and settings compositions.

### Task 1: Add the axe test foundation

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/test/accessibility.ts`

- [ ] **Step 1: Install the explicit audit dependency**

Run:

```powershell
npm.cmd install --save-dev axe-core@4.12.1
```

Expected: `axe-core` appears only under `devDependencies`; npm may repeat the repository's pre-existing audit warnings.

- [ ] **Step 2: Add the typed axe helper**

Create `src/test/accessibility.ts`:

```ts
import axe, { type Result, type RunOptions } from 'axe-core'

const JSDOM_OPTIONS: RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

function formatViolation(violation: Result): string {
  const targets = violation.nodes.flatMap((node) => node.target).join(', ')
  return `${violation.id}: ${violation.help} (${targets})`
}

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const result = await axe.run(container, JSDOM_OPTIONS)

  if (result.violations.length > 0) {
    throw new Error(result.violations.map(formatViolation).join('\n'))
  }
}
```

The jsdom helper intentionally disables only `color-contrast`, which axe documents as unsupported in jsdom. The final browser audit runs the complete rule set.

- [ ] **Step 3: Verify the helper compiles before feature tests use it**

Run:

```powershell
npm.cmd run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit the test foundation**

```powershell
git add package.json package-lock.json src/test/accessibility.ts
git commit -m "test: add reusable axe accessibility checks"
```

### Task 2: Add landmarks and connect login errors

**Files:**

- Create: `src/app/layout/AppShell.test.tsx`
- Modify: `src/app/layout/AppShell.tsx`
- Create: `src/app/LoginPage.test.tsx`
- Modify: `src/app/LoginPage.tsx`

- [ ] **Step 1: Write failing app-shell tests**

Create `src/app/layout/AppShell.test.tsx` with these behaviours:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { expectNoAxeViolations } from '@/test/accessibility'

test('provides a keyboard skip link and a labelled main landmark', async () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/freezer']}>
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
```

- [ ] **Step 2: Run the app-shell test and observe RED**

Run:

```powershell
npm.cmd test -- src/app/layout/AppShell.test.tsx
```

Expected: FAIL because the skip link and `main-content` target do not exist.

- [ ] **Step 3: Add the skip link and main target**

Add before `TopBar` in `AppShell`:

```tsx
<a
  href="#main-content"
  className="sr-only z-50 rounded-soft bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
>
  Skip to main content
</a>
```

Change the main landmark to:

```tsx
<main
  id="main-content"
  tabIndex={-1}
  className="mx-auto max-w-content px-4 pb-24 pt-4 sm:px-6 md:pb-10"
>
  {children}
</main>
```

- [ ] **Step 4: Write the failing login error test**

Create `src/app/LoginPage.test.tsx`. Mock `useAuth`, submit known credentials, and assert both controls reference the rendered alert:

```tsx
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
    signOut: vi.fn(),
    signIn: vi.fn().mockResolvedValue({ error: 'Email or password is incorrect.' }),
  })

  const { container } = render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cook@example.test' } })
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
```

- [ ] **Step 5: Run the login test and observe RED**

Run:

```powershell
npm.cmd test -- src/app/LoginPage.test.tsx
```

Expected: FAIL because the alert has no ID and the inputs have no error relationship.

- [ ] **Step 6: Connect the login error**

Add to both inputs:

```tsx
aria-describedby={error ? 'login-error' : undefined}
aria-invalid={error ? true : undefined}
```

Render the alert as:

```tsx
<p id="login-error" role="alert" className="text-[13px] text-berry">
  {error}
</p>
```

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
npm.cmd test -- src/app/layout/AppShell.test.tsx src/app/LoginPage.test.tsx
git add src/app/layout/AppShell.tsx src/app/layout/AppShell.test.tsx src/app/LoginPage.tsx src/app/LoginPage.test.tsx
git commit -m "fix: add accessible app navigation and login errors"
```

Expected: both files PASS and axe reports no violations.

### Task 3: Make Sheet focus behaviour stable

**Files:**

- Create: `src/components/ui/Sheet.test.tsx`
- Modify: `src/components/ui/Sheet.tsx`

- [ ] **Step 1: Write failing dialog and focus tests**

Create `src/components/ui/Sheet.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
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

test('traps focus, preserves it across renders, closes on Escape, and restores the opener', async () => {
  const { container } = render(<SheetHarness />)
  const opener = screen.getByRole('button', { name: 'Open sheet' })
  opener.focus()
  fireEvent.click(opener)

  const dialog = screen.getByRole('dialog', { name: 'Test sheet' })
  const rerenderButton = screen.getByRole('button', { name: 'Re-render 0' })
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

  rerenderButton.focus()
  fireEvent.click(rerenderButton)
  expect(screen.getByRole('button', { name: 'Re-render 1' })).toHaveFocus()

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(dialog).not.toBeInTheDocument()
  expect(opener).toHaveFocus()
  await expectNoAxeViolations(container)
})
```

Add a second test that focuses the last enabled button, presses Tab, and expects focus to wrap to Close; Shift+Tab from Close must wrap to the last button.

- [ ] **Step 2: Run the test and observe RED**

Run:

```powershell
npm.cmd test -- src/components/ui/Sheet.test.tsx
```

Expected: FAIL because a new inline `onClose` causes the effect to tear down on child re-render and reset focus.

- [ ] **Step 3: Stabilise focus and unique labelling**

In `Sheet`, add:

```tsx
const titleId = useId()
const onCloseRef = useRef(onClose)

useEffect(() => {
  onCloseRef.current = onClose
}, [onClose])
```

Use `onCloseRef.current()` in the document key handler, depend only on `[open]`, set `tabIndex={-1}` on the panel, set `aria-labelledby={titleId}`, and set the heading `id={titleId}`. On cleanup, restore focus only when the saved element remains connected:

```tsx
if (previouslyFocused.current?.isConnected) {
  previouslyFocused.current.focus()
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run:

```powershell
npm.cmd test -- src/components/ui/Sheet.test.tsx
git add src/components/ui/Sheet.tsx src/components/ui/Sheet.test.tsx
git commit -m "fix: stabilise sheet focus management"
```

Expected: all Sheet interaction tests PASS and axe reports no violations.

### Task 4: Correct card, filter, rating, and action-menu semantics

**Files:**

- Create: `src/features/recipes/components/RecipeCard.test.tsx`
- Modify: `src/features/recipes/components/RecipeCard.tsx`
- Create: `src/features/recipes/components/RecipeFilterChips.test.tsx`
- Modify: `src/features/recipes/components/RecipeFilterChips.tsx`
- Create: `src/components/ui/RatingStars.test.tsx`
- Modify: `src/components/ui/RatingStars.tsx`
- Create: `src/features/recipes/components/RecipeOverflowMenu.test.tsx`
- Modify: `src/features/recipes/components/RecipeOverflowMenu.tsx`

- [ ] **Step 1: Write failing axe tests for card and selection controls**

The card test renders one complete `RecipeListRow`, asserts a link named `View Berry recipe`, asserts a separate `Add to favourites` button, checks visible `Dessert` category text, and runs axe. The current card must fail axe's nested-interactive rule.

The filter test renders one category, asserts a labelled `group`, checks the selected button's `aria-pressed`, and runs axe. The current `radiogroup` with pressed buttons must fail its role assertion.

The rating test renders editable stars, asserts a `group` named `Rating`, asserts five native buttons with `aria-pressed`, activates the third with Enter, and runs axe.

- [ ] **Step 2: Run the tests and observe RED**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/RecipeCard.test.tsx src/features/recipes/components/RecipeFilterChips.test.tsx src/components/ui/RatingStars.test.tsx
```

Expected: FAIL for the nested link/button structure and the two mismatched radiogroup models.

- [ ] **Step 3: Refactor RecipeCard without changing its appearance**

Change the outer `Link` to an `article` retaining the existing card classes. Keep `FavouriteButton` as a sibling interactive element with `relative z-10`. Change the visible `View recipe` row into the only link:

```tsx
<Link
  to={`/recipe/${recipe.slug}`}
  aria-label={`View ${recipe.name} recipe`}
  className="flex items-center justify-between text-[13px] font-medium text-ink after:absolute after:inset-0 after:content-['']"
>
  View recipe
  <ArrowRight aria-hidden="true" ... />
</Link>
```

Give the article `relative` and keep the favourite button above the stretched link. The result has one stretched recipe link and one sibling favourite button, never one inside the other.

- [ ] **Step 4: Use button-group semantics for filters and ratings**

In `RecipeFilterChips`, replace `role="radiogroup"` with `role="group"`.

In editable `RatingStars`, replace the container role with:

```tsx
<div role="group" aria-label="Rating" className="inline-flex items-center gap-1">
```

Remove `role="radio"` and `aria-checked`; add `aria-pressed={star === value}` to each native button.

- [ ] **Step 5: Write the failing menu keyboard test**

Render `RecipeOverflowMenu` inside `ToastProvider`. Open it and assert:

- focus moves to Edit;
- ArrowDown moves to Add to shopping list;
- End moves to Delete;
- Home returns to Edit;
- Escape closes the menu and returns focus to Recipe actions;
- axe reports no violations while the menu is open.

- [ ] **Step 6: Run the menu test and observe RED**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/RecipeOverflowMenu.test.tsx
```

Expected: FAIL because focus currently remains on the trigger and arrow keys are ignored.

- [ ] **Step 7: Implement complete menu keyboard behaviour**

Add a trigger ref, an array of menu-item refs, and an effect that focuses item zero whenever `open` becomes true. Add `aria-controls` with a `useId()` menu ID.

Add a menu `onKeyDown` handler that:

```ts
const currentIndex = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement)

if (event.key === 'ArrowDown') {
  event.preventDefault()
  itemRefs.current[(currentIndex + 1) % items.length]?.focus()
}
if (event.key === 'ArrowUp') {
  event.preventDefault()
  itemRefs.current[(currentIndex - 1 + items.length) % items.length]?.focus()
}
if (event.key === 'Home') {
  event.preventDefault()
  itemRefs.current[0]?.focus()
}
if (event.key === 'End') {
  event.preventDefault()
  itemRefs.current[items.length - 1]?.focus()
}
if (event.key === 'Escape') {
  event.preventDefault()
  setOpen(false)
  triggerRef.current?.focus()
}
```

Assign each menu-item ref by index. Remove the document-level Escape handler but keep outside-pointer dismissal.

- [ ] **Step 8: Verify GREEN and commit**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/RecipeCard.test.tsx src/features/recipes/components/RecipeFilterChips.test.tsx src/components/ui/RatingStars.test.tsx src/features/recipes/components/RecipeOverflowMenu.test.tsx
git add src/components/ui/RatingStars.tsx src/components/ui/RatingStars.test.tsx src/features/recipes/components/RecipeCard.tsx src/features/recipes/components/RecipeCard.test.tsx src/features/recipes/components/RecipeFilterChips.tsx src/features/recipes/components/RecipeFilterChips.test.tsx src/features/recipes/components/RecipeOverflowMenu.tsx src/features/recipes/components/RecipeOverflowMenu.test.tsx
git commit -m "fix: correct recipe control keyboard semantics"
```

### Task 5: Complete the ingredient combobox keyboard model

**Files:**

- Create: `src/features/recipes/components/IngredientPicker.test.tsx`
- Modify: `src/features/recipes/components/IngredientPicker.tsx`

- [ ] **Step 1: Write failing combobox tests**

Mock `useIngredients` with Vanilla and Strawberry fixtures, mock usage counts with an empty map, and stub `IngredientEditSheet` as `null`.

Assert:

- the combobox owns a listbox through `aria-controls`;
- ArrowDown sets `aria-activedescendant` to Vanilla;
- a second ArrowDown sets it to Strawberry;
- Enter calls `onSelectIngredient` with Strawberry and closes the listbox;
- Escape closes without selecting;
- the open picker has zero axe violations.

- [ ] **Step 2: Run the tests and observe RED**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/IngredientPicker.test.tsx
```

Expected: FAIL because `aria-controls`, active-descendant state, and arrow/Enter/Escape behaviour are absent; axe also reports non-option actions inside the listbox.

- [ ] **Step 3: Add combobox state and keyboard handling**

Add `useId` and `type KeyboardEvent` to the React import, then add:

```tsx
const listboxId = useId()
const [activeIndex, setActiveIndex] = useState(0)
const flatOptions = useMemo(() => groups.flatMap(([, rows]) => rows), [groups])

function selectIngredient(ingredient: Ingredient) {
  onSelectIngredient(ingredient)
  setQuery(ingredient.name)
  setOpen(false)
}

function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    setOpen(true)
    if (flatOptions.length === 0) return
    setActiveIndex((index) => Math.min(index + (open ? 1 : 0), flatOptions.length - 1))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    setOpen(true)
    if (flatOptions.length === 0) return
    setActiveIndex((index) => Math.max(index - 1, 0))
  } else if (event.key === 'Enter' && open) {
    const active = flatOptions[activeIndex]
    if (active) {
      event.preventDefault()
      selectIngredient(active)
    }
  } else if (event.key === 'Escape' && open) {
    event.preventDefault()
    setOpen(false)
  }
}
```

Reset `activeIndex` to zero whenever the query changes.

- [ ] **Step 4: Connect the input and separate actions from the listbox**

Add to the input:

```tsx
aria-autocomplete="list"
aria-controls={listboxId}
aria-activedescendant={
  open && flatOptions[activeIndex] ? `${listboxId}-option-${flatOptions[activeIndex].id}` : undefined
}
onKeyDown={handleKeyDown}
```

Render a generic positioned popup. Inside it, render only ingredient groups and options in:

```tsx
<div id={listboxId} role="listbox" aria-label={ariaLabel}>
```

Give every category wrapper `role="group"` and `aria-label={CATEGORY_LABELS[category] ?? category}`. Give each option:

```tsx
id={`${listboxId}-option-${ingredient.id}`}
role="option"
tabIndex={-1}
aria-selected={ingredient.id === ingredientId}
```

Render “Add as a note” and “Create a new ingredient” buttons after the listbox as ordinary popup actions, not listbox children.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/IngredientPicker.test.tsx
git add src/features/recipes/components/IngredientPicker.tsx src/features/recipes/components/IngredientPicker.test.tsx
git commit -m "fix: make ingredient picker keyboard complete"
```

### Task 6: Make macro changes atomic and announced once

**Files:**

- Create: `src/features/recipes/components/MacroAnnouncements.test.tsx`
- Modify: `src/features/recipes/components/MacroPanel.tsx`
- Modify: `src/features/recipes/components/EditorMacroReadout.tsx`

- [ ] **Step 1: Write failing live-region tests**

Render `MacroPanel` with a full-tub result, then rerender at half scale. Assert the status has `aria-live="polite"`, `aria-atomic="true"`, and exactly:

```text
Recalculated for half tub: 200 kcal and 20g protein per tub.
```

Render `EditorMacroReadout`, rerender with changed macros, and assert its status is atomic and contains the four updated per-tub results.

- [ ] **Step 2: Run the tests and observe RED**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/MacroAnnouncements.test.tsx
```

Expected: FAIL because neither live region is marked atomic and the editor readout has no explicit status role.

- [ ] **Step 3: Add explicit atomic status semantics**

Change the hidden MacroPanel announcement to:

```tsx
<p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {liveSummary}
</p>
```

Add `role="status"` and `aria-atomic="true"` to the EditorMacroReadout root while retaining `aria-live="polite"`.

- [ ] **Step 4: Verify GREEN and commit**

Run:

```powershell
npm.cmd test -- src/features/recipes/components/MacroAnnouncements.test.tsx
git add src/features/recipes/components/MacroPanel.tsx src/features/recipes/components/EditorMacroReadout.tsx src/features/recipes/components/MacroAnnouncements.test.tsx
git commit -m "fix: announce macro recalculations atomically"
```

### Task 7: Run representative feature axe scans

**Files:**

- Create: `src/test/feature-accessibility.test.tsx`
- Modify only the exact component that a newly failing test identifies.

- [ ] **Step 1: Add representative compositions**

Create a test file that renders and scans:

- recipe: `RecipeCard`, `ServingToggle`, `MacroPanel`, and `IngredientList`;
- freezer: `TastingNoteForm`, `HistorySection`, and an open `Sheet`;
- shopping: `ShoppingLineRow`, `AddExtraField`, and `PlanChip`;
- reference: `MorePage`, an ingredient category heading/list composition, and `RatingStars`;
- settings: `Field` instances for text, number, select, and textarea controls plus the settings section landmarks.

Wrap router-dependent compositions in `MemoryRouter`, query-dependent compositions in a `QueryClientProvider` with `retry: false`, and toast-dependent compositions in `ToastProvider`. Use complete typed fixtures from `src/types/domain.ts`.

Each composition calls:

```tsx
await expectNoAxeViolations(container)
```

- [ ] **Step 2: Run the smoke suite and observe RED if another violation exists**

Run:

```powershell
npm.cmd test -- src/test/feature-accessibility.test.tsx
```

Expected: PASS after Tasks 2–6. If axe reports a violation, first narrow it to a new failing component test, then make the smallest production change that makes that test and this smoke suite pass.

- [ ] **Step 3: Commit the route-level regression coverage**

```powershell
git add src/test/feature-accessibility.test.tsx
git commit -m "test: cover feature accessibility compositions"
```

### Task 8: Real-browser audit and full verification

**Files:**

- Modify only files already named above if the real browser exposes a discrepancy not reproduced by jsdom.

- [ ] **Step 1: Run the full automated suite**

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Expected: all commands PASS with no warnings introduced by Task 43.

- [ ] **Step 2: Start the local application**

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL.

- [ ] **Step 3: Run full axe in a real browser**

Scan `/login` and `/styleguide` with the complete axe rule set, including colour contrast. For authenticated routes, use the connected session when available; otherwise use the deterministic feature compositions from Task 7 for DOM/ARIA coverage.

Expected: zero axe violations. Axe “incomplete” results must be reviewed manually rather than counted as passes.

- [ ] **Step 4: Complete the keyboard path**

Using Tab, Shift+Tab, Enter, Space, arrow keys where the component declares a menu or combobox, and Escape:

1. skip to main content;
2. traverse primary navigation;
3. open a recipe, toggle favourite, open and close recipe actions;
4. change serving size and confirm the macro announcement text changes;
5. open and close every sheet and confirm focus returns to its opener;
6. edit an ingredient line using the keyboard-only combobox;
7. operate freezer rating controls, shopping ticks, reference links, and settings fields;
8. submit an invalid form and confirm the error is announced and programmatically linked.

Expected: no focus loss, keyboard trap, unreachable control, or colour-only category cue.

- [ ] **Step 5: Check the final diff and status**

```powershell
git diff --check
git status --short
git log --oneline --decorate -8
```

Expected: no whitespace errors; only intentional Task 43 files are present; commits remain accessibility-focused.
