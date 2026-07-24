# 07 — Planning and the shopping list

Pick the recipes to make, get one sensible list. Replaces the original document's static tick-list, which had the right idea but could not know what you were actually planning to cook.

## Two halves

**The plan** is a set of recipes with multipliers, in `plan_items`.

**The list** is derived from the plan, aggregated by ingredient, merged with any manually added extras.

The list is computed on the client every render. It is not stored, and it must not be — a stored list goes stale the moment the plan changes, and then you are reconciling two sources of truth in a shopping app, which nobody wants.

Only the **tick state** is persisted, in `shopping_checks` (keyed by ingredient) and on `shopping_extras`.

## The screen — `/shopping`

### Plan section

Chips for each planned recipe, each with a multiplier stepper and a remove button.

```
  MAKING NEXT
  [ Cinnamon Roll  ×1  ✕ ]  [ Mango Lassi  ×2  ✕ ]  [ + Add recipes ]
```

"Add recipes" opens a sheet with a searchable, multi-select recipe list. Already-planned ones show as selected.

Recipes also reach the plan from a recipe detail page's "Add to shopping list".

### The list

Grouped by ingredient category, in shopping-route order rather than alphabetically — the order things appear in a supermarket:

1. Fresh (fruit)
2. Dairy
3. Protein and powders
4. Store cupboard (flavour, texture, sweet)
5. Biscuits and confectionery
6. Nuts
7. Other

Each line shows the ingredient, the total quantity, and which recipes want it:

```
  DAIRY
  ☐  Skimmed milk           1,050ml     Cinnamon Roll, Mango Lassi ×2
  ☐  0% Greek yoghurt          570g     Cinnamon Roll, Mango Lassi ×2
  ☑  Fat-free quark            175g     Lemon Cheesecake
```

Ticked lines drop to the bottom of their group, dimmed. Do not remove them — people un-tick things.

At the bottom: a free-text "Add your own" field writing to `shopping_extras`, and a "Clear ticks" button (which clears ticks only, never the plan).

## Aggregation

The interesting part, and the part with edge cases.

```
For each plan item:
  scale = multiplier
  lines = base ingredients (with the fill ingredient DERIVED, not nominal)
        + recipe additions
        + recipe mix-ins
  for each line:
    convert to a canonical amount and add it to the running total for that ingredient
```

### Rules

**Use the derived fill quantity, not the nominal one.** The macro engine already works out that Mango Lassi takes 262ml of milk rather than the base's nominal 325ml. Reuse `calculateMacros`'s `fillVolumeMl` — do not recompute it, and do not use the base row. Getting this wrong means buying the wrong amount of milk, which is the single most consequential number on the list.

**Canonical units per ingredient.** Pick one and convert into it:

- `per_100ml` ingredients → millilitres
- `per_100g` ingredients → grams
- `per_item` ingredients → items, rounded **up** to whole ones (you cannot buy 1.5 digestives)

**Negligible ingredients still appear.** Salt, xanthan and extracts contribute no macros but you still have to own them. Show them without a quantity — just "Xanthan gum", because "0.7g of xanthan gum" is a useless thing to read in a shop.

**Round for humans.** Over 1000ml or 1000g, show one decimal in litres or kilograms: "1.1L", "1.2kg". Below that, round to the nearest 5 for anything over 50, and to the nearest 1 below. Nobody measures 347ml of milk into a trolley.

**Free-text lines** (`ingredient_id is null`) appear as their own uncombinable entries, tagged with the recipe they came from.

**Optional mix-ins are included** by default, with a global "Skip optional extras" toggle at the top of the list.

## Tick state

Keyed by `ingredient_id`, which stays stable as the plan changes. Add a recipe and the quantities move but the ticks survive — correct, because you already bought the milk.

Extras carry their own `is_checked`.

"Clear ticks" deletes all `shopping_checks` rows and unchecks every extra. Confirm first, since it is annoying to redo.

## Data access

```ts
// src/lib/api/shopping.ts
export function fetchPlan(): Promise<PlanItem[]>              // with nested recipes + ingredients
export function addToPlan(recipeId: string): Promise<void>
export function setPlanMultiplier(recipeId: string, multiplier: number): Promise<void>
export function removeFromPlan(recipeId: string): Promise<void>
export function clearPlan(): Promise<void>

export function fetchExtras(): Promise<ShoppingExtra[]>
export function addExtra(label: string, category?: string): Promise<ShoppingExtra>
export function toggleExtra(id: string, next: boolean): Promise<void>
export function deleteExtra(id: string): Promise<void>

export function fetchChecks(): Promise<Record<string, boolean>>
export function setCheck(ingredientId: string, next: boolean): Promise<void>   // upsert
export function clearChecks(): Promise<void>
```

Aggregation is a pure function in `src/features/shopping/aggregate.ts`, tested independently:

```ts
export function buildShoppingList(input: {
  plan: PlanItemWithRecipe[]
  ingredients: Map<string, Ingredient>
  settings: MacroSettings
  includeOptional: boolean
}): ShoppingGroup[]
```

Pure, so it can be tested with fixtures and no database.

## Ticking must feel instant

Optimistic, always. Standing in a shop on bad signal, a checkbox that waits for a round trip is broken. Flip locally, write in the background, and reconcile on error.

Combined with the offline outbox in `docs/09-pwa-offline.md`, ticking works with no connection at all — which is the actual use case, because supermarkets have terrible signal.

## Acceptance

- Adding two recipes produces one list with milk correctly summed.
- Milk quantities use derived fill, so Mango Lassi contributes 262ml and not 325ml.
- Setting a multiplier of 2 doubles that recipe's contribution.
- Ticking survives a reload and a plan change.
- Item ingredients round up to whole items.
- Negligible ingredients appear without a quantity.
- Removing a recipe from the plan removes its contribution but leaves ticks alone.
- Ticking works offline.
