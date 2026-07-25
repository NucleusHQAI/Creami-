# Task 49 Online Recipe Adaptation Implementation Plan

> **For the implementing agent:** Work through the checklist in order. Preserve all pre-existing worktree changes, read `AGENTS.md`, and read every repository document named below before changing production code.

**Goal:** Let the household use an online recipe as inspiration, rebuild it around an existing CREAMi base and the curated UK ingredient library, review the result, and save it as a normal recipe with macros calculated by the app.

**Architecture:** Keep the existing Vite/React/TanStack Query/Supabase boundaries. An authenticated Supabase Edge Function fetches a URL and extracts structured recipe data, but never writes to the database and never supplies macro totals. Pure client-side functions convert units, match ingredients, select a suggested base and produce an editable `RecipeFormValues` draft. The existing recipe editor, ingredient library and macro engine remain authoritative. Source attribution is stored separately after the recipe is saved.

**Tech stack:** React 18, TypeScript strict mode, React Hook Form, Zod, TanStack Query 5, Supabase Postgres/Auth/Edge Functions, Tailwind, Vitest.

**Branch / PR:** Use one `codex/` branch and one pull request titled `Task 49: adapt online recipes`.

---

## Product and Macro Contract

The feature is an adaptation assistant, not a like-for-like importer.

```mermaid
flowchart LR
    A["Recipe URL or pasted ingredients"] --> B["Extract source facts"]
    B --> C["Select existing base"]
    C --> D["Map, replace or omit source ingredients"]
    D --> E["Populate normal recipe editor"]
    E --> F["Existing macro engine"]
    F --> G["Human review and save"]
```

Macros must always be calculated from:

1. The selected base and its current `base_ingredients`.
2. Matched additions and mix-ins from the current `ingredients` library.
3. The quantities and units in the adapted draft.
4. Current settings: `max_fill_ml`, `default_milk_ingredient_id` and `servings_per_tub`.
5. The milk volume derived by `calculateMacros` after all other volume-contributing lines are counted.

The source website's nutrition values must not be imported, used as overrides or compared during calculation. The URL extractor should not return nutrition values at all. `macroOverrideKcal` and `macroOverrideProteinG` must remain `null` in every generated draft.

Free-text or unresolved source lines contribute no macros, matching current behaviour. They must be presented as unresolved, not silently treated as zero-calorie ingredients.

The adaptation rules should prefer ingredients already present in the app. They must never create a new ingredient automatically. “Cheap and easy to buy” means using the curated household library and generic UK substitutions; live supermarket prices and availability scraping are out of scope.

---

## Scope

### Included

- A visible `Add recipe` action from the recipe list.
- `Adapt from an online recipe` within the existing new-recipe screen.
- URL extraction using Schema.org `Recipe` JSON-LD.
- A paste-ingredients fallback for blocked, unsupported, video or social sources.
- Conservative American-to-metric conversion.
- Data-driven UK substitutions and base suggestions.
- A review summary explaining what was used, replaced, covered by the base or left unresolved.
- Population of the existing editor and its live macro readout.
- Source attribution on the saved recipe.
- Auth, URL-fetch safety, loading, error, empty and offline states.

### Excluded

- Automatic saving.
- Importing or trusting source nutrition totals.
- Copying the source method into `method_override`; adapted recipes use the household's standard method unless the user edits it manually.
- AI or an external model in the first version.
- Image download or photo storage.
- Browser extensions, share-sheet integration or automatic clipboard reading.
- Scraping supermarket prices or claiming a real-time cheapest product.
- Automatic creation of ingredients, bases or categories.
- General DOM scraping of arbitrary recipe prose when JSON-LD is absent. Use the paste fallback instead.

---

## Preflight

- [ ] Read:
  - `AGENTS.md`
  - `docs/00-product-brief.md`
  - `docs/01-architecture.md`
  - `docs/02-data-model.md`
  - `docs/04-macro-engine.md`
  - `docs/05-feature-recipes.md`
  - `docs/08-feature-reference-settings.md`
  - `docs/09-pwa-offline.md`
- [ ] Run `git status --short` and preserve all unrelated modifications and untracked files.
- [ ] Confirm the current baseline with:
  - `npm.cmd test`
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
- [ ] Check the installed Supabase CLI using `supabase --version` and discover function/migration commands with `--help`; do not guess current flags.
- [ ] Re-check the current Supabase Edge Function changelog and official authentication/CORS documentation before implementing the function.
- [ ] Do not edit anything in `seed/`. The existing recipe, ingredient, category and base seed data is finished.

If the baseline fails because of existing work, record the exact failure before adding Task 49 changes. Do not “fix” unrelated code as part of this task.

---

### Task 1: Write the Feature Specification and Backlog Entry

**Files:**

- Create: `docs/11-feature-online-recipe-adaptation.md`
- Modify: `docs/00-product-brief.md`
- Modify: `docs/10-task-backlog.md`

- [ ] **Step 1: Add the feature specification**

Record the goal, user flow, macro contract, adaptation decisions, UK substitution policy, error/offline states, source attribution, security limits and acceptance journeys from this plan.

- [ ] **Step 2: Update product scope**

Remove `Importing recipes from URLs` from the product brief's out-of-scope list. Replace it with the narrower exclusions above so the product brief and implementation agree.

- [ ] **Step 3: Add Task 49 to the backlog**

Add `Task 49 · Adapt online recipes`, depending on the existing recipe editor, ingredient library, settings and deployment work. Point it at `docs/11-feature-online-recipe-adaptation.md`.

**Done when:** The feature has one canonical specification and the existing documentation no longer contradicts it.

---

### Task 2: Add Source Attribution and Adaptation Rules to the Database

**Files:**

- Create: a migration generated with `supabase migration new <descriptive-name>`
- Modify: `src/types/database.types.ts` by regeneration only
- Modify: `src/types/domain.ts`
- Modify: `src/lib/api/export.ts`
- Modify: `src/lib/api/export.test.ts`

- [ ] **Step 1: Generate a migration using the current CLI**

Do not invent a migration filename. Check for the existing untracked `0004_set_default_milk.sql` before creating anything and avoid collisions.

- [ ] **Step 2: Add `recipe_sources`**

Suggested columns:

- `id uuid primary key`
- `recipe_id uuid not null references recipes(id) on delete cascade`
- `source_url text`
- `source_title text`
- `source_site text`
- `adaptation_summary text`
- `retrieved_at timestamptz`
- `created_at timestamptz not null default now()`

Require at least a URL or a title. Add an index on `recipe_id`. Do not store the downloaded page, raw HTML or a full copy of the source method.
When a URL is present, constrain and validate it as `http` or `https`.

Allow more than one source per recipe at the schema level, even though the first UI creates one at a time.

- [ ] **Step 3: Add `adaptation_rules`**

Suggested columns:

- `id uuid primary key`
- `match_term text not null`
- `action text not null`: `map`, `omit` or `base_hint`
- `replacement_ingredient_id uuid references ingredients(id) on delete restrict`
- `suggested_base_id uuid references bases(id) on delete restrict`
- `suggested_role text`: `addition` or `mixin`
- `reason text not null`
- `priority int not null default 0`
- `is_seed boolean not null default false`
- timestamps consistent with the existing reference tables

Add constraints so:

- `map` requires a replacement ingredient.
- `base_hint` requires a suggested base.
- A role, when present, is valid.
- Normalised `match_term` values are unique.

- [ ] **Step 4: Seed only the adaptation rules**

Seed the new table in the migration, resolving ingredient and base references by slug/key. Do not alter `seed/ingredients.json`, `seed/bases.json` or `seed/recipes.json`.

Initial rules should cover at least:

- `yogurt` to `0% Greek yoghurt`
- `PB2` to `Powdered peanut butter`
- `graham cracker` to `Light digestive biscuit`
- `instant pudding mix` / `sugar-free pudding mix` as omitted because the chosen base supplies structure and sweetness
- `heavy cream`, `half-and-half` and `Cool Whip` as covered by choosing an appropriate base rather than copied directly
- cheesecake, coconut, chocolate/cocoa and fruit terms as base hints
- common US branded descriptions only where there is an unambiguous generic ingredient already in the library

Every omission or replacement needs a short British-English reason suitable for display.

- [ ] **Step 5: Add RLS and Data API permissions**

Enable RLS on both tables. Match the repository's single-authenticated-household policy, with no anonymous access. Explicitly grant Data API table privileges to `authenticated` if the project's Data API settings require them; RLS and grants are separate.

- [ ] **Step 6: Regenerate types and extend export**

Regenerate `database.types.ts`; never hand-edit it. Add both tables to the complete JSON export and its test.

- [ ] **Step 7: Verify the migration**

Run the migration locally, query both tables as authenticated and anonymous callers, and run the Supabase database advisors. Confirm:

- Authenticated reads work.
- Anonymous reads return no rows/access.
- Invalid rule combinations fail their constraints.
- Seed rules resolve to real existing ingredient/base IDs.
- Deleting a recipe removes its source rows.

**Done when:** Provenance and substitution knowledge are stored as protected data, generated types compile, and the complete export includes both tables.

---

### Task 3: Define and Test the Import Contracts and Unit Normalisation

**Files:**

- Create: `src/features/recipes/import/types.ts`
- Create: `src/features/recipes/import/extraction-schema.ts`
- Create: `src/features/recipes/import/normalise-source-line.ts`
- Create: `src/features/recipes/import/normalise-source-line.test.ts`
- Create: `src/features/recipes/import/fixtures/` with small, original test fixtures

- [ ] **Step 1: Define typed wire and draft contracts**

Include:

- `ExtractedRecipe`
- `ExtractedRecipeSource`
- `ExtractedIngredientLine`
- `AdaptationDecision`
- `AdaptationWarning`
- `AdaptedRecipeDraft`
- `RecipeSourceInput`

Use a Zod schema at the browser boundary so an unexpected function response cannot enter the editor unchecked.

The extracted response should contain source metadata, name, short description, yield and ingredient lines. Deliberately exclude source macros and full method text.

- [ ] **Step 2: Add failing unit-parser tests**

Cover:

- Integers and decimals.
- Fractions such as `1/2`, `1 1/2`, `½` and `1½`.
- Metric `g`, `kg`, `ml` and `l`.
- US mass `oz` and `lb`.
- US volume `tsp`, `tbsp`, `fl oz` and `cup`.
- Item counts.
- Parenthetical notes and preparation text such as `crushed`, `divided` and `to taste`.
- Missing quantities.
- Ranges such as `1-2 tbsp`, which must be flagged for review rather than silently choosing one end.

- [ ] **Step 3: Implement conservative conversions**

Use standard US conversion constants internally:

- Weight ounces and pounds can convert directly to grams.
- Fluid ounces and liquid cups can convert to millilitres.
- A mapped per-100ml liquid may use the millilitre result.
- A solid teaspoon/tablespoon may convert only when the ingredient has `grams_per_tsp`.
- A solid cup must remain unresolved unless the library later gains a trustworthy ingredient-specific conversion.

Do not use one generic cup-to-grams conversion. Preserve the original source line in every decision so the user can check it.

- [ ] **Step 4: Keep parsing pure**

No React, Supabase or network imports in this folder. Return typed results with warnings rather than throwing for ordinary ambiguity.

**Done when:** Common American measurements normalise correctly, ambiguous solid-volume and range inputs are visibly unresolved, and all parser tests pass.

---

### Task 4: Build the Pure Adaptation Engine

**Files:**

- Create: `src/features/recipes/import/adapt-recipe.ts`
- Create: `src/features/recipes/import/adapt-recipe.test.ts`
- Create or modify fixture files under `src/features/recipes/import/fixtures/`

- [ ] **Step 1: Write failing end-to-end adaptation tests**

Use small original fixtures, not copied web pages:

1. American birthday-cake recipe:
   - Suggest `Everyday creamy`.
   - Treat milk, protein powder and pudding mix as covered by the base.
   - Keep vanilla flavouring and sprinkles as mapped lines.
2. Strawberry cheesecake:
   - Suggest `Cheesecake`.
   - Keep strawberries and a digestive-style mix-in.
   - Do not duplicate cream cheese/yoghurt already in the base.
3. Chocolate peanut butter:
   - Suggest `Chocolate creamy`.
   - Map PB2 to powdered peanut butter.
4. Solid ingredient measured in cups:
   - Keep it unresolved.
5. Unknown branded ingredient:
   - Never create an ingredient.
   - Return an unresolved warning.
6. Source nutrition:
   - Cannot affect the draft and leaves both macro overrides `null`.

- [ ] **Step 2: Implement matching in a conservative order**

1. Normalise spelling, punctuation and case.
2. Match exact current ingredient names and slugs.
3. Apply the highest-priority matching `adaptation_rules`.
4. Treat uncertain similarity matches only as suggestions, never automatic mappings.
5. Return unknown lines as unresolved.

- [ ] **Step 3: Suggest a base**

Score data-driven `base_hint` rules against the source name and ingredient text. Use a deterministic tie-breaker. Default to `Everyday creamy` when no specialised base has a clear lead.

The result is a suggestion; the normal base selector remains editable.

- [ ] **Step 4: Remove structural duplication**

After selecting a base, compare mapped source ingredients with that base's ingredient rows. Milk/fill ingredient, yoghurt, protein, xanthan, sweetener, salt, cream cheese or coconut milk already present in the selected base should be marked `covered_by_base` and excluded from recipe additions.

Do not hardcode seed quantities. Read all base and ingredient facts from the supplied data.

- [ ] **Step 5: Suggest category and recipe roles**

Prefer category in this order:

1. Clear coffee term.
2. Clear chocolate term.
3. Clear fruit term/base.
4. Clear biscuit, cake or dessert term.
5. Creamy classics.

Use rule-suggested roles first. Otherwise, whole confectionery, biscuits, nuts and pieces usually become mix-ins; fruit purees, cocoa, coffee, extracts and spreads usually become additions. Keep the role editable.

- [ ] **Step 6: Produce normal form values**

Return `RecipeFormValues` compatible data:

- Generated unique-ready slug candidate, but final uniqueness still uses the existing slug helper.
- Suggested base/category IDs.
- Short profile derived from the source title/description without copying long prose.
- Matched additions and mix-ins.
- Empty `methodOverride`.
- `null` macro overrides.

Return the form values alongside the full decision list and warnings.

**Done when:** The engine is deterministic, pure, thoroughly tested and converts source inspiration into a normal editor draft without doing macro arithmetic.

---

### Task 5: Add the Authenticated URL Extraction Function

**Files:**

- Create: `supabase/functions/extract-recipe/index.ts`
- Create: `supabase/functions/extract-recipe/deno.json`
- Create: focused shared parser/security helpers under `supabase/functions/_shared/`
- Create: function parser/security tests using the current supported Supabase/Deno test workflow
- Modify: `supabase/config.toml` only if required by the current CLI

- [ ] **Step 1: Create the function using the current CLI**

Use `supabase functions new --help` first. Pin function-only dependencies to exact verified versions in `deno.json`; do not add them to the browser bundle.

- [ ] **Step 2: Require the signed-in household user**

Use the current documented authenticated-user pattern and retain platform JWT verification. Do not expose a public function and do not use a service-role key.

- [ ] **Step 3: Add strict request validation**

Accept only a JSON object containing one `http` or `https` URL. Reject:

- Other schemes.
- Embedded credentials.
- `localhost`.
- Loopback, private, link-local and reserved literal IP addresses.
- Hostnames which resolve to loopback, private, link-local or reserved addresses.
- Ports outside ordinary HTTP/HTTPS unless there is a documented reason.

- [ ] **Step 4: Fetch defensively**

Use:

- A short timeout.
- A small response-size limit.
- An HTML content-type requirement.
- A limited redirect count.
- URL and host revalidation after every redirect.
- A clear user agent.

Do not log page content or auth tokens. Return stable error codes for invalid URL, blocked host, timeout, too large, unsupported content and no structured recipe.

- [ ] **Step 5: Parse Schema.org Recipe JSON-LD**

Support:

- A single object.
- An array of objects.
- `@graph`.
- `@type` as a string or array.
- `recipeIngredient` as strings or simple structured values.
- `name`, `description`, `recipeYield` and canonical/source metadata.

If there are multiple Recipe objects, select the most complete one deterministically. Do not fall back to copying arbitrary page prose.

- [ ] **Step 6: Handle browser invocation**

Use the current Supabase CORS helper/pattern and handle preflight requests. Return only the validated `ExtractedRecipe` contract.

- [ ] **Step 7: Test the function**

Test:

- Each JSON-LD shape.
- Malformed JSON-LD.
- No Recipe object.
- Redirect revalidation.
- Blocked local/private targets.
- Timeout, non-HTML and oversized responses.
- Unauthenticated invocation.
- CORS preflight.

Use mocked fetches for deterministic tests. Add one local live-function request through the documented `supabase functions serve` workflow.

**Done when:** A signed-in user can extract a supported recipe page, unsafe targets are rejected, and the function performs no database writes.

---

### Task 6: Add Client APIs, Query Keys and Hooks

**Files:**

- Create: `src/lib/api/recipe-import.ts`
- Create: `src/features/recipes/hooks/useExtractRecipe.ts`
- Create: `src/features/recipes/hooks/useAdaptationRules.ts`
- Create: `src/lib/api/recipe-sources.ts`
- Create: adjacent API/hook tests
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Fetch adaptation rules through the API layer**

Add one stable query key and one hook. Components must not call Supabase directly.

- [ ] **Step 2: Invoke and validate extraction**

`extractRecipe(url)` should call `supabase.functions.invoke`, translate stable function error codes into useful British-English messages, and validate successful data with the Zod schema.

Use a TanStack mutation for the on-demand extraction action.

- [ ] **Step 3: Add source persistence**

Add `insertRecipeSource(input)` in the API layer. It runs only after the recipe itself has saved and receives the returned recipe ID.

If source persistence fails after the recipe succeeds:

- Do not claim the whole save failed.
- Navigate to the saved recipe.
- Show a specific warning that the recipe was saved but its source link could not be attached.
- Log enough context to diagnose the source failure without logging downloaded content.

- [ ] **Step 4: Test API boundaries**

Assert correct function payloads, response validation, stable error translation, rule reads and source-row inserts.

**Done when:** UI code has typed hooks for extraction/rules/source saving and no direct Supabase access.

---

### Task 7: Add the Adaptation UI to the Existing Editor

**Files:**

- Create: `src/features/recipes/components/AdaptRecipeSheet.tsx`
- Create: `src/features/recipes/components/AdaptationReviewPanel.tsx`
- Create: adjacent component tests
- Modify: `src/features/recipes/pages/RecipeEditPage.tsx`
- Modify: `src/features/recipes/pages/RecipeListPage.tsx`

- [ ] **Step 1: Add the recipe-list entry point**

Add a clear `Add recipe` button near the recipe-list heading. It links to `/recipe/new`. Also use it in the true empty state.

- [ ] **Step 2: Add the new-recipe adaptation action**

On `/recipe/new` only, add `Adapt from an online recipe` as a secondary action. Editing an existing recipe must not show it.

- [ ] **Step 3: Build the accessible sheet**

Offer:

- `Recipe link`
- `Paste ingredients`

The link path calls the Edge Function. Paste mode accepts an optional source URL/title and bypasses network extraction.

Handle:

- Loading with recipe-line skeletons.
- Retryable extraction errors.
- Empty/invalid paste input.
- Offline state with an explanation.
- Closing and focus return through the existing accessible `Sheet`.

- [ ] **Step 4: Adapt against current reference data**

The page supplies current bases, ingredients, categories and adaptation rules to the pure engine. It should never use seed imports or hardcoded nutrition values.

- [ ] **Step 5: Populate the current form**

On `Use this adaptation`:

- Generate a unique slug using the existing helpers.
- Reset/populate the normal recipe form.
- Preserve a pending `RecipeSourceInput`.
- Mark the page as having unsaved imported work so navigation protection still fires.
- Keep every normal editor field editable.

If the existing new-recipe form is already dirty, confirm before replacing it.

- [ ] **Step 6: Display adaptation decisions**

Above the populated form, show grouped decisions:

- `Using`
- `UK replacements`
- `Covered by your base`
- `Needs attention`

Each row names the source line and reason. Do not rely on colour alone.

Unresolved lines should not be silently inserted. Show the original line and direct the user to choose an existing ingredient, explicitly add it as a no-macro note, or ignore it.

- [ ] **Step 7: Confirm live macro behaviour**

The existing `useDraftRecipeMacros` and `EditorMacroReadout` must update immediately from the populated base/additions/mix-ins. Do not add a second macro calculation path.

Add copy near the review:

> Macros are calculated from your selected base and ingredient library, not the source website.

- [ ] **Step 8: Add component tests**

Cover keyboard/focus behaviour, link and paste paths, dirty-form confirmation, offline blocking, loading/error states, populated form values, unresolved warnings and live macro readout integration.

Run axe against the sheet and representative populated review state.

**Done when:** A user can extract or paste inspiration, understand every adaptation decision, edit it in the existing form and see app-calculated macros before saving.

---

### Task 8: Save and Display Source Attribution

**Files:**

- Modify: `src/features/recipes/hooks/useSaveRecipe.ts`
- Modify: `src/features/recipes/pages/RecipeEditPage.tsx`
- Modify: `src/lib/api/recipes.ts` only where source fetch composition requires it
- Create: `src/features/recipes/components/RecipeSourceCard.tsx`
- Create: adjacent tests
- Modify: `src/features/recipes/pages/RecipeDetailPage.tsx`
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Attach the pending source after recipe creation**

After `upsertRecipe` succeeds, insert the source row using the returned ID. Clear the pending source only after the attempt completes.

Manual recipes continue through the exact existing save path with no source write.

- [ ] **Step 2: Fetch source attribution with recipe detail**

Extend the detail read with source rows, ordered oldest first. Keep list queries unchanged.

- [ ] **Step 3: Display a compact source card**

On recipe detail, show:

- `Inspired by`
- Source title/site.
- Safe external link when a URL exists.
- The short adaptation summary.

Render a link only after re-validating that its saved URL uses `http` or `https`. Use `rel="noopener noreferrer"` for a new-tab external link. Do not display copied source method or raw HTML.

- [ ] **Step 4: Test success and partial failure**

Assert:

- Adapted recipe save creates both recipe and source records.
- Manual recipe save creates no source.
- Source insertion failure reports the partial failure accurately.
- Detail renders source attribution and safe link attributes.
- Unsafe or malformed saved source text is rendered as text, never as a clickable link.

**Done when:** Adapted recipes retain clear provenance without changing macro or shopping behaviour.

---

### Task 9: Full Verification and Acceptance

**Files:**

- Verify all Task 49 production and test files.
- Update documentation only with findings directly related to Task 49.

- [ ] **Step 1: Run focused tests**

Run the parser, adaptation engine, API, hook, sheet, editor and source-card tests.

- [ ] **Step 2: Run all repository checks**

Run:

- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Expected: all pass with no `any`, non-null assertions, lint suppressions or unrelated dependency upgrades.

- [ ] **Step 3: Run Supabase verification**

- Migration list is correct.
- Advisors have no new findings.
- Authenticated/anonymous table access matches the single-household model.
- The function rejects unauthenticated and unsafe URL requests.
- No service-role or secret key is present in browser code or committed files.

- [ ] **Step 4: Complete browser journeys**

On a phone-sized viewport:

1. Adapt an American birthday-cake recipe from JSON-LD.
2. Confirm source milk/protein/pudding are covered by the base rather than duplicated.
3. Confirm sprinkles remain a mix-in.
4. Confirm macros appear from the app before saving.
5. Change the selected base and see macros move.
6. Adapt strawberry cheesecake using pasted ingredients.
7. See a solid-cup measurement and unknown brand flagged.
8. Resolve or intentionally omit the warnings.
9. Save and follow the `Inspired by` source link.
10. Attempt the flow offline and receive a clear explanation.

- [ ] **Step 5: Regression checks**

Confirm:

- Manual recipe creation still works.
- Existing recipe editing still works.
- Existing macro golden vectors remain exact.
- Shopping aggregation uses adapted ingredients and derived milk normally.
- Recipe search finds adapted ingredient display text.
- Export includes recipe sources and adaptation rules.
- No personal names or American spellings leak into UI copy.

**Done when:** The online source influences the flavour draft, while the selected base, UK ingredient library and existing macro engine remain the only authorities for the saved recipe.

---

## Implementation References

- Schema.org Recipe structured data: <https://schema.org/Recipe>
- Supabase Edge Functions: <https://supabase.com/docs/guides/functions>
- Supabase Edge Function authentication: <https://supabase.com/docs/guides/functions/auth>
- Supabase browser CORS guidance: <https://supabase.com/docs/guides/functions/cors>

Re-check these at implementation time because the Supabase CLI, runtime and recommended authentication helpers change.
