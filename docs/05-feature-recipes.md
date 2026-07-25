# 05 — Recipes

The heart of the app. Browsing, searching, favouriting, reading, creating and editing.

## Routes

| Route | Screen |
|---|---|
| `/` | Recipe list — the app's home |
| `/recipe/:slug` | Recipe detail |
| `/recipe/:slug/edit` | Editor |
| `/recipe/new` | Editor, empty |

Slugs in URLs rather than ids, so links are readable and shareable between two phones.

---

## Recipe list

The screen that gets opened most. It must be fast and it must not make anyone think.

### Layout, top to bottom

1. **Ready-to-spin banner** — only when at least one batch has passed its `ready_at`. "2 tubs ready to spin", tapping goes to `/freezer`. This is the single most useful thing the app can tell someone, so it sits above everything.
2. **Search field** — sticky under the top bar. Placeholder "Search flavours, e.g. pistachio or coffee".
3. **Filter chips** — horizontally scrollable: All, the five categories, ♡ Favourites. Single-select, matching the original.
4. **Result count** — "40 recipes", mono, small.
5. **The grid** — 1 column on phones, 2 from 768px, 3 from 1100px.

### Search

Client-side. Forty rows is nothing; do not send this to the database.

Match case-insensitively against name, profile, base name, and the `display` text of every ingredient line — so "pistachio" finds Roasted Pistachio, and so does "almond extract". Debounce 150ms. Keep the search term in the URL as `?q=` so a refresh does not lose it.

Empty result gets a real `EmptyState`: "No flavours match 'xyz'" with a "Clear filters" button, not a shrug.

### Sorting

Default is category order, then name. A small sort control offers: Name, Recently added, Highest rated, Most made. Persist the choice in `localStorage` — this is a UI preference, not data, and is the one legitimate use of `localStorage` in the app.

### Favouriting

The heart on the card. One tap, optimistic — flip the UI immediately, then write. On failure, revert and show a toast.

```ts
useMutation({
  mutationFn: toggleFavourite,
  onMutate: async ({ id, next }) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.recipes.all })
    const previous = queryClient.getQueryData(queryKeys.recipes.all)
    queryClient.setQueryData(queryKeys.recipes.all, (old) =>
      old?.map((r) => (r.id === id ? { ...r, is_favourite: next } : r)),
    )
    return { previous }
  },
  onError: (_e, _v, ctx) => queryClient.setQueryData(queryKeys.recipes.all, ctx?.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
})
```

The heart must `stopPropagation` or every favourite also navigates.

---

## Recipe detail

### Order on the page

1. **Header** — category eyebrow, name, profile line, favourite button, overflow menu (Edit, Add to shopping list, Log a batch, Duplicate, Delete).
2. **Serving toggle** — Full tub / Half tub / Custom. Custom opens a sheet with a millilitre input. Everything below recalculates.
3. **Macro panel** — kcal, protein, carbs, fat, for both per tub and per serving. Estimate caveat underneath.
4. **The base** — name, summary, and the full ingredient list, *including the derived milk line*.
5. **Flavour additions** — the recipe's `addition` lines.
6. **Mix-in** — the `mixin` lines plus `mixin_note`. Optional lines carry a toggle that recalculates macros when switched off.
7. **Method** — `method_override` if present, otherwise `standard_method` from settings, rendered as the five numbered steps.
8. **Best result** — the `tip`.
9. **Ratings and notes** — average, the note history, and an "Add a note" action. Full spec in `docs/06-feature-freezer.md`.
10. **Actions** — "Log a batch" and "Add to shopping list", full width, easy to hit.

### The derived milk line

This is the detail that makes the app more useful than the document it replaces. Show it as a real ingredient, visually distinguished:

```
  Skimmed milk ......................... 253ml
  ↳ topped up to your 525ml freezer fill line; mix-ins are added afterwards
```

It moves when the recipe or the fill setting changes. Mix-ins are included in the macros but never reduce this milk quantity because they are added after spinning.

### Scaling

`scale` is component state, not persisted. Full tub is 1, half tub 0.5, custom is `ml / max_fill_ml`.

Every quantity on the page multiplies by it. Display sensibly:

- Under 10g, one decimal; otherwise whole numbers.
- Items become fractions where clean: 0.5 renders as "½", 1.5 as "1½". Otherwise one decimal.
- Never show "0g" — show "a pinch" for anything under 0.5g.

---

## The editor

Used for both new and existing recipes. React Hook Form plus a Zod schema; the schema is the single definition of what a valid recipe is.

### Fields

| Field | Control | Rules |
|---|---|---|
| Name | text | required, 2–80 chars |
| Slug | text | auto-generated from name, editable, unique, lowercase and hyphens |
| Category | select | required |
| Base | select | required. Changing it shows the base's ingredients and warns that macros will move |
| Profile | textarea | optional, max 200 |
| Recipe photo | file picker | optional JPG, PNG or WebP, maximum 5 MB. Shows a preview and supports replace/remove |
| Additions | line editor | see below |
| Mix-ins | line editor | same |
| Mix-in note | textarea | optional |
| Tip | textarea | optional |
| Method override | textarea | optional, collapsed by default |
| Macro override | two numbers | optional, collapsed, with a warning that it replaces the calculation |

### The ingredient line editor

The part most likely to be built badly, so:

Each line is a row: **ingredient picker → quantity → unit → optional toggle → remove**.

- The picker is a searchable combobox over the ingredient library, grouped by ingredient category, with the most-used at the top.
- If nothing matches, offer two things: "Add '<text>' as a note" (creates a `free_text` line, no macros) and "Create a new ingredient" (opens a sheet, spec in `docs/08-feature-reference-settings.md`).
- The unit selector offers g, ml and item, defaulting to whatever suits the ingredient's basis.
- Where the ingredient has `grams_per_tsp`, a small "tsp" helper converts as you type — people think in spoons.
- `display` auto-fills as "12g cocoa powder" but stays editable, so "a generous pinch of cinnamon" survives.
- Lines reorder by drag on pointer devices and by up/down buttons on touch. Do not ship drag-only.

**A live macro readout sits pinned at the bottom of the editor** and updates on every change. Watching the protein number move as you add things is most of the value of having a calculator at all.

### Saving

Upload a newly selected photo to the public `recipe-images` bucket under a unique path, then upsert the recipe, delete its existing `recipe_ingredients`, and insert the new set. If the recipe save fails, remove the new upload. After a successful replacement or removal, delete the previous uploaded object. Bundled seed artwork remains local.

On success, go to the detail page and invalidate `recipes.all` and `recipes.detail(id)`.

Warn before navigating away from an edited form.

### Deleting

Soft delete — set `archived_at`. Confirmation sheet names the recipe. Seeded recipes delete like any other; the seed script will not resurrect them.

Undo via a toast for 10 seconds after deleting. Cheap to build, and it prevents the one genuinely annoying mistake.

### Duplicating

Copies everything, appends " (copy)" to the name, derives a fresh slug, opens the editor. Bundled seed artwork may be shared safely; an uploaded photo is not copied, so the variation can choose its own. This is how a variation gets made, and it will be used more than "new recipe" is.

---

## Data access

```ts
// src/lib/api/recipes.ts
export function fetchRecipeList(): Promise<RecipeListItem[]>       // recipe_list_view
export function fetchRecipe(slug: string): Promise<RecipeDetail>   // + ingredients, base, notes
export function upsertRecipe(input: RecipeInput): Promise<Recipe>
export function archiveRecipe(id: string): Promise<void>
export function restoreRecipe(id: string): Promise<void>
export function toggleFavourite(id: string, next: boolean): Promise<void>
```

`fetchRecipe` needs one nested select rather than four round trips:

```ts
supabase
  .from('recipes')
  .select(`
    *,
    category:categories(*),
    base:bases(*, base_ingredients(*, ingredient:ingredients(*))),
    recipe_ingredients(*, ingredient:ingredients(*)),
    tasting_notes(*)
  `)
  .eq('slug', slug)
  .is('archived_at', null)
  .single()
```

## Acceptance

- All 40 seeded recipes appear, correctly categorised, with computed macros.
- Search finds a recipe by flavour name, by ingredient, and by base.
- Favouriting survives a reload and feels instant.
- A new recipe can be created end to end and shows correct macros.
- The half-tub toggle halves every quantity and every macro.
- Deleting hides a recipe from the list but leaves its batch history intact.
- No personal names anywhere on any screen.
