# Task 43 Accessibility Pass Design

## Goal

Make the application fully keyboard-operable and ensure its important state changes and validation messages are conveyed to assistive technology. Axe must report no violations for the audited UI, and the repository must retain automated checks that catch regressions.

## Scope

The pass covers every route and the shared controls used by those routes. It specifically verifies:

- visible focus indicators on every interactive element;
- accessible names for icon-only controls;
- correct dialog semantics, focus trapping, Escape handling, and focus return for sheets;
- polite, meaningful announcements when recipe macros are recalculated;
- form errors connected to their controls with `aria-describedby` and `aria-invalid`;
- category information presented as text rather than colour alone;
- valid landmarks, heading structure, current-navigation state, and custom-control semantics;
- valid interactive structure, with no buttons nested inside links or similar keyboard traps.

Changes outside accessibility are out of scope. There will be no visual redesign, feature work, dependency upgrades, or unrelated refactoring.

## Approach

Use a hybrid audit:

1. Add `axe-core` as the sole accessibility-specific development dependency.
2. Add a small Vitest helper that runs axe against rendered UI and reports the complete violation details when a check fails.
3. Add focused regression tests for shared primitives and representative states of every screen, using deterministic data fixtures and mocked data hooks where a page normally requires Supabase.
4. Add direct interaction tests for behaviour axe cannot prove, including sheet focus movement and return, keyboard operation, macro announcement updates, and form error relationships.
5. Run the application locally for a final browser keyboard pass and an axe scan of the rendered public surfaces. Authenticated feature screens are covered through their deterministic route-level renders when a live authenticated backend is unavailable.

This keeps the audit repeatable without introducing a new end-to-end framework, an accessibility-only production route, or backend test credentials.

## Test Infrastructure

`src/test/accessibility.ts` will expose a typed helper around `axe-core`. Tests will use the existing Testing Library and jsdom setup.

Accessibility tests will live beside the component or screen they protect. Broad checks will cover:

- the app shell and navigation;
- login and form error presentation;
- sheets and their opening controls;
- recipe cards, recipe detail macros, and recipe editing;
- freezer, shopping, reference, and settings screen compositions;
- shared buttons, fields, selection controls, and status messaging.

The suite will assert an empty `violations` array. Interaction tests will use real DOM focus and keyboard events rather than testing implementation details.

## Production Changes

Production changes will be limited to findings demonstrated by a failing test or axe result. Likely correction points include:

- adding a skip link and a stable main-content target;
- marking the active navigation destination with `aria-current`;
- removing nested interactive elements from recipe cards while preserving the same visual layout;
- making sheet labelling identifiers unique and ensuring focus remains contained even when a sheet has no enabled control;
- stabilising sheet focus restoration across re-renders;
- improving combobox, menu, radiogroup, disclosure, and switch semantics where the current keyboard behaviour does not match the declared role;
- associating raw form errors with their controls;
- making live-region output concise and atomic so a changed macro result is announced once.

No correction will be made solely because it is adjacent to an accessibility change.

## Verification

Completion requires:

1. Every new accessibility test is first observed failing for the intended reason.
2. Focus and keyboard interaction tests pass.
3. All axe checks report zero violations.
4. Macro changes produce a changed polite live-region message containing the new scale and result.
5. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass.
6. A final keyboard traversal confirms that all controls can be reached, activated, escaped, and returned to in a logical order.

## Branch and Baseline

Implementation is isolated on `codex/task-43-accessibility`. The branch includes the completed Task 42 states audit and the later recipe-ingredient seed fix. Before Task 43 changes, all 84 existing tests pass.
