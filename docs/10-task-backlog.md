# 10 — Task backlog

48 tasks, in dependency order. Each is meant to be a single sitting for one person or one model: one branch, one pull request, titled `Task N: <name>`.

**How to work a task.** Read `CLAUDE.md`, then the spec listed under *Spec*, then do the task. Do not read the other documents — they are separated so that no task needs the whole picture in its head. Do not do work belonging to a later task, even if it seems small.

Phases 1–6 (tasks 1–35) produce a genuinely usable app. Everything after is refinement.

## Current status

- Tasks 1–43 are implemented.
- Task 44 is deferred until the protein powder, Greek yoghurt, quark and milk nutrition labels can be checked in the household cupboard. The app remains usable with approximate values meanwhile.
- Task 45 is implemented. Deployed builds generate the manifest, service worker, icons and update prompt.
- Task 46 is implemented in code; the real-device offline checklist remains to be recorded.
- Task 47 is ready but blocked on Netlify authentication.
- Task 48 remains a manual phone acceptance walkthrough.

| Phase | Tasks | Outcome |
|---|---|---|
| 1 · Foundations | 1–8 | Project, database, seeded data, login |
| 2 · Macro engine | 9–11 | Calculation working and tested |
| 3 · Design system | 12–16 | Components and navigation |
| 4 · Recipes | 17–24 | Browse, read, create, edit |
| 5 · Freezer | 25–30 | Batches, timers, ratings |
| 6 · Shopping | 31–35 | Planning and the list |
| 7 · Reference | 36–41 | Bases, method, ingredients, settings |
| 8 · Ship | 42–48 | Polish, offline, deploy |

---

## Phase 1 — Foundations

### Task 1 · Scaffold the project
**Depends on:** nothing · **Spec:** `docs/01-architecture.md`

Create the Vite + React + TypeScript project. Install exactly the dependencies listed in the architecture doc's stack table and no others. Configure ESLint, Prettier, `strict: true`, and the `@/` path alias for `src/`. Create the folder structure exactly as documented, with `.gitkeep` files in the empty ones.

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`.

**Done when:** `npm run dev` serves a placeholder page, and `lint`, `typecheck` and `build` all pass clean.

---

### Task 2 · Design tokens and global styles
**Depends on:** 1 · **Spec:** `docs/03-design-system.md`

Configure `tailwind.config.ts` with the colour, font, radius and shadow tokens. Add the three Google Fonts to `index.html` with `preconnect` and `display=swap`. Write `src/styles/globals.css` with the reset, base body styles and the dot-grid `body::before`.

Build a `/styleguide` route rendering every token — colour swatches with names, each type role, each radius. It is a development aid and it stays; every later task uses it to check work.

**Done when:** the styleguide renders, fonts load, the dot grid is visible, and no raw hex appears in any component.

---

### Task 3 · Supabase project and client
**Depends on:** 1 · **Spec:** `docs/01-architecture.md`

Create the Supabase project. Add `src/lib/supabase.ts` exporting one configured client, reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` and throwing a clear, named error if either is missing. Commit `.env.example`; confirm `.env` is git-ignored.

**Done when:** the client instantiates, a missing variable produces a readable error rather than a blank screen, and no key is committed.

---

### Task 4 · Database schema
**Depends on:** 3 · **Spec:** `docs/02-data-model.md`

Create `supabase/migrations/0001_init.sql` containing the migration exactly as written in the spec — every table, constraint, index, trigger, view and policy. Apply it.

**Done when:** every table exists, `insert into app_settings` has produced the single row, the two views return without error, and the `item_needs_weight` and `has_ingredient_or_text` constraints reject bad rows when tested by hand.

---

### Task 5 · Seed converter
**Depends on:** 4 · **Spec:** `docs/02-data-model.md` § Seeding

Write `scripts/generate-seed-sql.ts`. It reads the four files in `seed/`, resolves cross-references by slug and key, and writes idempotent SQL to `supabase/seed/`. Follow the six-step order in the spec, including `do nothing` on recipes and `do update` on reference data. Add an `npm run seed:generate` script.

Run it and apply the output.

**Done when:** the database holds 5 categories, 71 ingredients, 6 bases with their ingredient rows, and 40 recipes with their additions and mix-ins. Re-running the seed changes nothing and overwrites no edit.

---

### Task 6 · Lock down access
**Depends on:** 4 · **Spec:** `docs/02-data-model.md` § Row Level Security

Disable public signup in the Supabase dashboard. Create the household account by hand. Fix the seed-deletion policy properly — the spec explains why the version in migration 0001 does not actually block anything; drop `delete` from `household_all` on `ingredients` and add an explicit delete policy with `using (is_seed = false)`.

Verify by hand: an anonymous client can read nothing; an authenticated client can read and write everything except deleting a seeded ingredient.

**Done when:** all three checks pass and signup is confirmed off in the dashboard.

---

### Task 7 · Types
**Depends on:** 5 · **Spec:** `docs/02-data-model.md` § TypeScript types

Generate `src/types/database.types.ts` with the Supabase CLI. Add an `npm run types:generate` script. Write `src/types/domain.ts` with the hand-written shapes the app works with, deriving from the generated types wherever possible rather than duplicating them.

**Done when:** types are generated, `typecheck` passes, and the file carries a comment saying it is generated and must not be hand-edited.

---

### Task 8 · Authentication
**Depends on:** 3, 6 · **Spec:** `docs/01-architecture.md` § Authentication

`AuthProvider` in `src/app/providers.tsx` exposing `{ session, loading, signIn, signOut }`. A single login screen — email, password, submit, error display. No signup form and no password reset. A `RequireAuth` wrapper that redirects to login. A splash while `loading` is true, so an already-signed-in person never sees a flash of the login screen.

**Done when:** signing in reaches the app, the session survives a reload, signing out returns to login, and a wrong password gives a readable message.

---

## Phase 2 — The macro engine

### Task 9 · Units and the macro engine
**Depends on:** 7 · **Spec:** `docs/04-macro-engine.md` — read all of it

Write `src/lib/units.ts` (`toGrams`, `toMillilitres`, display formatting) and `src/lib/macros/` implementing `calculateMacros` exactly as specified. Pure functions only — no React import anywhere in the folder.

Write the Vitest suite. **Every golden vector in the spec must pass to the stated tolerance**, both milk variants, plus all six edge cases. Build fixtures from `seed/*.json` so the tests exercise real data.

The engine must never throw.

**Done when:** all golden vectors pass, all edge cases pass, and no test needs a network or a database.

---

### Task 10 · Reference data access
**Depends on:** 7, 8 · **Spec:** `docs/01-architecture.md` § Data flow

`src/lib/query-keys.ts` with the full key structure. `src/lib/api/` functions for ingredients, bases, categories and settings. Feature hooks `useIngredients`, `useBases`, `useCategories`, `useSettings`, all with `staleTime` of one hour.

**Done when:** a test component renders 71 ingredient names and 6 base names, and navigating away and back triggers no refetch.

---

### Task 11 · Binding macros to data
**Depends on:** 9, 10 · **Spec:** `docs/04-macro-engine.md`

`useRecipeMacros(recipe, { scale, excludeOptional })` in `src/features/recipes/hooks/`. It gathers ingredients, bases and settings from the reference hooks, builds the `MacroLine` arrays, calls `calculateMacros`, and memoises on the inputs. It contains no arithmetic of its own — all of that lives in the engine.

**Done when:** the hook returns a correct `MacroResult` for a seeded recipe, and changing the default milk setting changes the result without a page reload.

---

## Phase 3 — Design system and shell

### Task 12 · UI primitives, first batch
**Depends on:** 2 · **Spec:** `docs/03-design-system.md` § Components

`Button`, `IconButton`, `Card`, `Pill`, `Chip`, `Skeleton`. All variants and sizes from the spec. Minimum 44px touch targets. Visible focus rings. `aria-label` required by the type signature on `IconButton`.

Add every one to `/styleguide`, showing all variants.

**Done when:** all six render in every variant on the styleguide, are keyboard-operable with a visible focus ring, and contain no hardcoded colours.

---

### Task 13 · UI primitives, second batch
**Depends on:** 12 · **Spec:** `docs/03-design-system.md` § Components

`Sheet` (bottom sheet on phones, centred modal from 768px — focus trap, Escape to close, scroll lock, focus returned on close), `Field`, `EmptyState`, `ErrorState`, `RatingStars`, `Stepper`, `QuantityInput`.

`QuantityInput` combines a number input with a g/ml/item selector and shows a tsp helper when the ingredient carries `grams_per_tsp`.

**Done when:** all seven are on the styleguide, the Sheet traps focus and restores it, and the whole styleguide is navigable by keyboard alone.

---

### Task 14 · App shell and routing
**Depends on:** 8, 12 · **Spec:** `docs/03-design-system.md` § Layout

`createBrowserRouter` with lazy route components. `AppShell` with the top bar and the fixed bottom navigation — four items, `pb-[env(safe-area-inset-bottom)]`, active state on the current route. Above 768px the navigation moves to the top bar. Placeholder pages for all routes in `docs/05`–`docs/08`.

**Done when:** all four tabs navigate, active state is correct, nothing sits under the iPhone home indicator, and each route lazy-loads as its own chunk.

---

### Task 15 · Providers, errors and toasts
**Depends on:** 14 · **Spec:** `docs/01-architecture.md`

`QueryClientProvider` with sensible defaults (`retry: 1`, `refetchOnWindowFocus` on for batches, off elsewhere). A root error boundary showing a recoverable error screen rather than a white page. A minimal toast system — success, error, and an action slot for undo. No toast library; roughly 80 lines of context and a portal.

**Done when:** a thrown error in a route renders the boundary and offers a retry, and a toast with an undo action works.

---

### Task 16 · Recipe card
**Depends on:** 11, 12 · **Spec:** `docs/03-design-system.md` § Recipe card

The card exactly as drawn in the spec: tinted visual band with the two overlapping accent circles, favourite heart top-left, emoji top-right, category eyebrow, name, clamped profile, pills for base, kcal, protein and rating. Colours come from the category row via CSS custom properties.

Macros come from `useRecipeMacros`. Heart calls a callback and stops propagation.

**Done when:** all five category variants render correctly on the styleguide, macros match the golden vectors, and tapping the heart does not navigate.

---

## Phase 4 — Recipes

### Task 17 · Recipe list
**Depends on:** 16 · **Spec:** `docs/05-feature-recipes.md` § Recipe list

`RecipeListPage` at `/`. Fetch from `recipe_list_view`, render the responsive grid, handle loading with skeletons, error with a retry, and empty with an `EmptyState`. Result count in mono.

**Done when:** all 40 recipes render at all three breakpoints with correct macros, and the loading state shows skeleton cards rather than a spinner.

---

### Task 18 · Search, filters and sort
**Depends on:** 17 · **Spec:** `docs/05-feature-recipes.md` § Search

Sticky search field, debounced 150ms, matching name, profile, base name and ingredient `display` text. Horizontally scrollable filter chips: All, five categories, Favourites. Sort control with the four options, persisted to `localStorage`. Search term mirrored in the URL as `?q=`.

All client-side.

**Done when:** "pistachio" finds Roasted Pistachio, "almond extract" finds it too, filters combine with search, `?q=` survives a reload, and no-results shows a real empty state with a clear-filters action.

---

### Task 19 · Favouriting
**Depends on:** 17 · **Spec:** `docs/05-feature-recipes.md` § Favouriting

`toggleFavourite` in the api layer and `useToggleFavourite` with the optimistic pattern from the spec — cancel, snapshot, patch, roll back on error, settle with an invalidate.

**Done when:** the heart flips instantly, survives a reload, the Favourites filter reflects it, and a forced network failure rolls the UI back and shows a toast.

---

### Task 20 · Recipe detail
**Depends on:** 11, 13, 17 · **Spec:** `docs/05-feature-recipes.md` § Recipe detail

`/recipe/:slug`. Sections 1 and 4–8 from the spec: header with favourite and overflow menu, the base with its ingredients **including the derived milk line**, flavour additions, mix-ins with their optional toggles, method, and the tip. Sections 3 and 9 are later tasks — leave placeholders.

The derived milk line is the point of this screen. Render it as a real ingredient with its "topped up to your 525ml freezer fill line; mix-ins are added afterwards" annotation.

**Done when:** a seeded recipe renders completely, the derived milk quantity matches the golden vector, and toggling an optional mix-in off changes the ingredient list.

---

### Task 21 · Macro panel and scaling
**Depends on:** 20 · **Spec:** `docs/05-feature-recipes.md` § Scaling

Section 3 of the detail page: the macro table for per tub and per serving, all four macros, with the estimate caveat. The Full tub / Half tub / Custom toggle, custom opening a sheet with a millilitre input.

Scaling multiplies every quantity on the page. Apply the display rules from the spec — fractions for items, "a pinch" under 0.5g, never "0g". Announce recalculation to screen readers via a live region.

**Done when:** half tub halves every figure, custom fill recalculates correctly, `macro_override_kcal` displays instead of the computed value when set, and the change is announced.

---

### Task 22 · Recipe editor form
**Depends on:** 13, 20 · **Spec:** `docs/05-feature-recipes.md` § The editor

`/recipe/new` and `/recipe/:slug/edit`. React Hook Form plus a Zod schema covering every field and rule in the spec's field table. Slug auto-generates from the name and stays editable. Changing base warns that macros will move. Method override and macro override are collapsed disclosures. Unsaved-changes warning on navigation.

Ingredient lines are the next task — leave a placeholder.

**Done when:** validation matches the spec, the slug generates and de-duplicates, and navigating away from a dirty form warns.

---

### Task 23 · Ingredient line editor
**Depends on:** 22 · **Spec:** `docs/05-feature-recipes.md` § The ingredient line editor

The line editor for additions and mix-ins. Searchable combobox over the ingredient library grouped by category; quantity and unit; optional toggle; remove. No match offers both "add as a note" (free text) and "create a new ingredient". `display` auto-fills and stays editable. Reordering by drag **and** by up/down buttons — touch devices need the buttons.

The live macro readout pinned to the bottom of the editor, recalculating on every change.

**Done when:** lines can be added, edited, reordered on touch and pointer, and removed; free-text lines save and contribute no macros; the live readout updates as you type.

---

### Task 24 · Save, delete, duplicate
**Depends on:** 23 · **Spec:** `docs/05-feature-recipes.md` § Saving

`upsertRecipe` following the upsert → delete lines → insert lines order. Soft delete with a naming confirmation and a 10-second undo toast. Duplicate copying everything, appending " (copy)", deriving a fresh slug, and opening the editor.

**Done when:** a new recipe round-trips and shows correct macros; editing preserves ingredient order; deleting removes it from the list but leaves its batches; undo restores it.

---

## Phase 5 — Freezer

### Task 25 · Freezer screen
**Depends on:** 14 · **Spec:** `docs/06-feature-freezer.md` § The freezer screen

`/freezer` with the three sections plus collapsed history. Remember that "ready" is `status = 'freezing' and ready_at <= now()`, derived and never written. Countdowns via `date-fns`, re-rendering on a one-minute interval. Empty state when the freezer is empty.

**Done when:** a batch frozen 25 hours ago appears under Ready without anything having been written to it, and countdowns update without a reload.

---

### Task 26 · Log a batch
**Depends on:** 25 · **Spec:** `docs/06-feature-freezer.md` § Logging a batch

The sheet, reachable from recipe detail and from a floating action button on the freezer screen. Recipe, time (defaulting to now, with a reveal for a different time), optional notes. Shows the computed ready time before confirming. Never sends `ready_at` — the trigger owns it.

**Done when:** logging from a recipe takes two taps, ready time is correct, and a back-dated batch lands in the right section immediately.

---

### Task 27 · Spun and finished
**Depends on:** 26 · **Spec:** `docs/06-feature-freezer.md` § Marking spun

`markSpun` with the optional re-spin count, milk added and notes, and a "Just mark it spun" escape hatch that skips all of it. `markFinished`. A dismissible prompt to rate when a batch is finished.

**Done when:** a batch can be marked spun with zero input, the optional fields save when used, and finishing offers a rating prompt that can be dismissed.

---

### Task 28 · Ready banner
**Depends on:** 25, 17 · **Spec:** `docs/06-feature-freezer.md` § Home banner

The banner at the top of the recipe list when any batch is ready. Names the recipes, links to `/freezer`, uses `queryKeys.batches.active` with `refetchOnWindowFocus: true`. Absent entirely when nothing is ready.

**Done when:** it appears with the correct count and names, is absent when nothing is ready, and refreshes on window focus.

---

### Task 29 · Ratings and tasting notes
**Depends on:** 20, 27 · **Spec:** `docs/06-feature-freezer.md` § Ratings and tasting notes

Section 9 of the recipe detail page: average rating with its count, the note history newest first, an "Add a note" action. Creating from a batch or standalone. Stars plus text, with the example placeholder. Average from the `recipe_ratings` view; card display as `★ 4.5`.

**Done when:** a note can be created from a batch and from a recipe, the average updates on the card, batch-linked notes show which batch, and notes survive their batch being deleted.

---

### Task 30 · Insights
**Depends on:** 29 · **Spec:** `docs/06-feature-freezer.md` § Insights

Made-count, modal re-spin count, and median milk added, on the recipe detail page. Each appears only at three or more batches with the relevant data. Below the threshold, show nothing.

**Done when:** insights appear at three batches and not at two, and the median and mode are correct against hand-checked data.

---

## Phase 6 — Shopping

### Task 31 · The plan
**Depends on:** 14 · **Spec:** `docs/07-feature-shopping.md` § Plan section

`plan_items` CRUD and the plan section of `/shopping` — chips with multiplier steppers and remove buttons, plus an "Add recipes" sheet with searchable multi-select. "Add to shopping list" on the recipe detail overflow menu.

**Done when:** recipes add and remove, multipliers persist, adding an already-planned recipe does not duplicate it, and the sheet shows current selection state.

---

### Task 32 · Aggregation
**Depends on:** 11, 31 · **Spec:** `docs/07-feature-shopping.md` § Aggregation

`buildShoppingList` in `src/features/shopping/aggregate.ts`. Pure. It must use the **derived** fill quantity from `calculateMacros`, never the base's nominal amount. All the rules from the spec: canonical units, items rounded up, negligible ingredients listed without quantities, human rounding, free-text lines kept separate.

Vitest coverage with fixtures.

**Done when:** two recipes sum milk correctly using derived fill; Mango Lassi contributes 262ml and not 325ml; multipliers scale; items round up; every rule has a test.

---

### Task 33 · Shopping list UI
**Depends on:** 32 · **Spec:** `docs/07-feature-shopping.md` § The list

The grouped list in supermarket-route order, each line showing ingredient, total, and which recipes want it. Ticked lines dim and drop to the bottom of their group. "Skip optional extras" toggle at the top.

**Done when:** groups are in route order, quantities are human-rounded, source recipes are named, and the optional toggle changes the list.

---

### Task 34 · Ticks and extras
**Depends on:** 33 · **Spec:** `docs/07-feature-shopping.md` § Tick state

`shopping_checks` keyed by ingredient, `shopping_extras` for manual lines. "Add your own" field. "Clear ticks" with confirmation, clearing ticks only and never the plan.

**Done when:** ticks survive a reload and a plan change, extras add and tick and delete, and clearing ticks leaves the plan untouched.

---

### Task 35 · Instant ticking
**Depends on:** 34 · **Spec:** `docs/07-feature-shopping.md` § Ticking must feel instant

Optimistic updates for `setCheck` and `toggleExtra` — flip locally, write in the background, reconcile on error. No spinner, no disabled state, no waiting.

**Done when:** ticking responds with no perceptible delay on a throttled connection, and a forced failure rolls back with a toast.

---

## Phase 7 — Reference and settings

### Task 36 · More menu
**Depends on:** 14 · **Spec:** `docs/08-feature-reference-settings.md`

`/more` listing Bases, Method, Ingredients and Settings, with a line of description each.

**Done when:** all four navigate and the page reads clearly on a phone.

---

### Task 37 · Bases
**Depends on:** 11, 36 · **Spec:** `docs/08-feature-reference-settings.md` § Bases

`/bases` with the six cards — name, tagline, summary, ingredients, and computed base-only macros. Variations show their parent. `/bases/:key` allows editing quantities and swapping ingredients, warning with an accurate count of affected recipes before saving.

**Done when:** all six render with correct base-only macros, and editing a base changes the macros of every recipe using it.

---

### Task 38 · Method and technique notes
**Depends on:** 36 · **Spec:** `docs/08-feature-reference-settings.md` § Method

`/method` with the five numbered steps from `app_settings.standard_method` and the five technique notes as expandable cards, carried over from the original document. The milk guide card links to the milk setting.

**Done when:** all five steps and all five notes are present, the milk guide link works, and there are no personal names anywhere on the page.

---

### Task 39 · Ingredient library
**Depends on:** 36 · **Spec:** `docs/08-feature-reference-settings.md` § Ingredient library

`/ingredients`, grouped by category, searchable, showing kcal and protein per 100 and a badge on seeded rows. The dismissible calibration prompt at the top, with its shortcut to the four ingredients that matter most.

**Done when:** all 71 render grouped and searchable, seeded rows are marked, and the calibration prompt's shortcut filters to the four.

---

### Task 40 · Ingredient editor
**Depends on:** 39, 23 · **Spec:** `docs/08-feature-reference-settings.md` § Editing

The edit sheet with every field, Advanced disclosure for density and volume, per-item fields shown conditionally. Creating from the library and inline from the recipe editor — the inline route must return to the recipe editor with the new ingredient selected and the form intact. Deletion blocked when referenced, with the count; seeded ingredients never deletable.

**Done when:** editing an ingredient changes macros everywhere it is used, inline creation returns without losing the recipe form, and deletion rules hold.

---

### Task 41 · Settings and export
**Depends on:** 36 · **Spec:** `docs/08-feature-reference-settings.md` § Settings

All five settings with their controls. Freezer fill and default milk show a live preview of their effect on a sample recipe before saving. A note that freeze hours affects new batches only. Account section with email and sign-out. About section. JSON export of everything.

Saving invalidates `settings.all`, `recipes.all` and every `recipes.detail`.

**Done when:** switching default milk to skimmed lowers every recipe's calories, the preview is accurate, and export produces valid complete JSON.

---

## Phase 8 — Ship it

### Task 42 · States audit
**Depends on:** 41 · **Spec:** `CLAUDE.md` § Errors and loading

Walk every screen. Confirm each has a skeleton loading state, a retryable error state, and a useful empty state that says what to do next. Fix what is missing. No spinners, no bare "no results".

**Done when:** every screen has all three, verified by forcing each condition.

---

### Task 43 · Accessibility pass
**Depends on:** 42 · **Spec:** `docs/03-design-system.md` § Accessibility

Keyboard-navigate the whole app. Confirm focus rings, `aria-label`s on icon buttons, dialog semantics and focus return on sheets, live regions on macro recalculation, form errors tied with `aria-describedby`, and that category is conveyed by text and not colour alone. Run axe and fix what it finds.

**Done when:** the app is fully keyboard-operable, axe reports no violations, and a screen reader announces macro changes.

---

### Task 44 · Calibrate the ingredient values
**Depends on:** 41 · **Spec:** `docs/04-macro-engine.md` § Calibration

Read the labels on the protein powder, Greek yoghurt, quark and milk actually in the house. Correct those four in the ingredient library. Compare a handful of recipes against their `reference_kcal` and `reference_protein_g`. When the gap is comfortable, write migration `0002_drop_reference_macros.sql` removing both columns, and remove them from the seed data and the types.

This is the one task needing a human with a cupboard.

**Done when:** the four are corrected, computed values sit close to the references, and the reference columns are gone.

---

### Task 45 · Installable
**Depends on:** 43 · **Spec:** `docs/09-pwa-offline.md` § Installability

`vite-plugin-pwa` in `generateSW` mode with `registerType: 'prompt'`. The manifest as specified. Icons at 192, 512 and maskable 512 — the berry circle with a white "C". `CacheFirst` for Google Fonts. A "new version available" toast rather than a silent swap.

**Done when:** the app installs on a real iPhone and a real Android with the right icon and name, opens without browser chrome, and a new deployment prompts to reload.

---

### Task 46 · Offline
**Depends on:** 45 · **Spec:** `docs/09-pwa-offline.md` § Data offline

Persist the Query cache to IndexedDB with a version buster. Register the five permitted mutations with mutation keys for pausing and resumption. The offline banner, the pending-changes count, disabled blocked actions with explanations, and the stale-data notice. Use `onlineManager`, not `navigator.onLine` alone.

Work through the eight manual test steps in the spec, including step 7.

**Done when:** all eight steps pass on a real device, including a hard reload while offline.

---

### Task 47 · Deploy
**Depends on:** 46 · **Spec:** `docs/01-architecture.md` § Deployment

Connect the repo to Netlify. Build command, publish directory, environment variables in the production context. `public/_redirects` with the SPA fallback. Deploy previews on pull requests, production on merge to `main`. Confirm the initial JS bundle is under 200 KB gzipped, and fix the largest offenders if not.

**Done when:** production is live, deep links survive a refresh, previews build on pull requests, and the bundle is within budget.

---

### Task 48 · Acceptance walkthrough
**Depends on:** 47 · **Spec:** `docs/00-product-brief.md` § What "done" looks like

On a real phone, on the production URL, complete all seven journeys from the brief without touching a desktop. Record what breaks. Fix anything that stops a journey; log anything cosmetic as an issue.

Then check the whole app for personal names or per-person groupings in the UI, seed data and code.

**Done when:** all seven journeys complete on a phone, and the name check is clean.

---

## Notes on sequencing

**Genuinely parallel** once Phase 3 is done: Phase 4 (recipes), Phase 5 (freezer) and Phase 7 (reference) touch different feature folders. Phase 6 (shopping) needs Task 11 and Task 31, but not the rest of Phase 4.

**Do not start** Phase 8 before Phase 4 is complete. A service worker over a half-built app produces cache-shaped bugs that cost more to diagnose than the offline feature is worth.

**Task 9 is the one to get right.** Everything downstream displays its output. If the golden vectors do not pass exactly, stop and fix it rather than adjusting the tests.
