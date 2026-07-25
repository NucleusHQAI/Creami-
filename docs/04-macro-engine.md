# 04 — The macro engine

Lives in `src/lib/macros/`. Pure functions, no React, no data fetching, no imports from anywhere except `src/types` and `src/lib/units.ts`. It is the one part of this app where being quietly wrong costs the most, so it is specified in full and tested against fixed vectors.

## The problem it solves

A CREAMi Deluxe recipe is not a fixed list of quantities. It is a base, plus blended flavour additions, plus **milk topped up to the 525ml freezer fill line**. Mix-ins are added after spinning, on top of that frozen-base volume. That distinction is what makes naive calculation wrong.

Take the fruit base. It nominally lists 325ml of milk. Put 160g of mango in and the tub is fuller, so less milk goes in — but a naive calculator still counts 325ml and overstates both calories and protein. Put nothing in and it needs more.

So the fill ingredient's quantity is **derived, not read**. The engine works out how much room the base ingredients and blended additions take up, then fills the rest of the 525ml frozen base with milk. Mix-ins still contribute macros, but do not reduce the milk because they are added afterwards. This is exactly what a person does at the worktop, and it is why a mango tub genuinely has fewer calories than a plain vanilla one despite having fruit in it.

## Algorithm

```
Inputs:  base (with ingredients), recipe ingredients, ingredient library,
         settings (max_fill_ml, default milk, servings_per_tub), scale

1. Collect lines
   lines = base.ingredients (excluding the fill ingredient)
         + recipe.additions
         + recipe.mixins (excluding optional ones the user has toggled off)

2. Substitute the milk
   Any line whose ingredient is the base's fill ingredient is swapped for
   settings.default_milk_ingredient. This is the global milk swap: change
   the setting, every recipe recalculates.

3. Scale
   Multiply every quantity by `scale` (1 = full tub). Item quantities scale
   too and may become fractional — half a digestive is a real thing.

4. Occupied frozen-base volume
   For each base or addition line, if counts_toward_volume:
       grams  = toGrams(quantity, unit, ingredient)
       volume = grams / density_g_per_ml
   Sum them.

   Mix-in lines are excluded from occupied volume because they are added after
   spinning. They remain in the macro total.

5. Derived fill
   targetFill  = max_fill_ml × scale
   fillVolume  = max(0, targetFill − occupiedVolume)

   If fillVolume is 0 the base mixture overflows the freezer-fill target. Return it as a warning
   rather than an error — the numbers are still the best available, and the
   cook needs telling, not blocking.

6. Total
   Sum macrosFor(line) across every line, plus macrosFor(fill ingredient at
   fillVolume ml).

7. Per serving
   Divide by settings.servings_per_tub × scale.
```

### `toGrams(quantity, unit, ingredient)`

```ts
switch (unit) {
  case 'g':    return quantity
  case 'ml':   return quantity * ingredient.density_g_per_ml
  case 'item': return quantity * (ingredient.grams_per_item ?? 0)
}
```

### `macrosFor(line)`

```ts
if (ingredient.negligible) return ZERO

const factor =
  ingredient.basis === 'per_item'
    ? (unit === 'item' ? quantity : toGrams(...) / ingredient.grams_per_item)
    : ingredient.basis === 'per_100ml'
      ? (toGrams(...) / ingredient.density_g_per_ml) / 100
      : toGrams(...) / 100

return {
  kcal:      ingredient.kcal      * factor,
  protein_g: ingredient.protein_g * factor,
  carbs_g:   ingredient.carbs_g   * factor,
  fat_g:     ingredient.fat_g     * factor,
}
```

`negligible` is why "a pinch of salt", "2 drops of peppermint extract" and "1/8 tsp xanthan gum" cost nothing. They are still displayed in the ingredient list — they simply contribute no macros, which is the honest answer at those quantities.

### Rounding

Round **once**, at the very end, for display only. Never round intermediate values — rounding 40 line items individually accumulates real error.

- kcal: whole numbers
- protein, carbs, fat: one decimal
- derived fill volume: whole millilitres

## Types

```ts
// src/lib/macros/types.ts

export type Unit = 'g' | 'ml' | 'item'
export type Basis = 'per_100g' | 'per_100ml' | 'per_item'

export interface Ingredient {
  id: string
  slug: string
  name: string
  basis: Basis
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  density_g_per_ml: number
  grams_per_item: number | null
  negligible: boolean
  counts_toward_volume: boolean
}

export interface MacroLine {
  ingredientId: string | null   // null → free text, contributes nothing
  quantity: number | null
  unit: Unit | null
  optional: boolean
  role: 'base' | 'addition' | 'mixin'
}

export interface MacroSettings {
  maxFillMl: number
  servingsPerTub: number
  defaultMilkIngredientId: string | null
}

export interface Macros {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface MacroResult {
  perTub: Macros
  perServing: Macros
  fillVolumeMl: number        // derived milk, in ml
  occupiedVolumeMl: number    // base and blended additions only
  overflows: boolean          // frozen-base volume exceeded the target
  excludedLines: string[]     // ingredient ids skipped, with reasons in `warnings`
  warnings: string[]
}
```

## Public surface

```ts
// src/lib/macros/index.ts

export function calculateMacros(input: {
  baseLines: MacroLine[]
  fillIngredientId: string
  recipeLines: MacroLine[]
  ingredients: Map<string, Ingredient>
  settings: MacroSettings
  scale?: number                 // default 1
  excludeOptional?: boolean      // default false
}): MacroResult
```

One entry point. Everything else in the folder is internal.

## Golden test vectors

These are computed from the seed data with `max_fill_ml = 525`, `scale = 1`, optional mix-ins **included in macros but excluded from occupied frozen-base volume**. They are not illustrative — the implementation must reproduce them, and Task 9's tests assert them directly.

Tolerance: ±0.5 kcal and ±0.1g, to allow for floating-point ordering.

### With `default_milk = skimmed-milk`

| Recipe | Derived fill (ml) | kcal | Protein | Carbs | Fat |
|---|---:|---:|---:|---:|---:|
| `vanilla-custard` | 252.7 | 409 | 63.2 | 29.7 | 3.6 |
| `mango-lassi` | 107.4 | 399 | 55.1 | 37.7 | 3.0 |
| `double-chocolate-brownie` | 222.7 | 479 | 64.6 | 32.6 | 9.0 |
| `cookies-and-cream` | 252.7 | 431 | 63.4 | 32.1 | 5.1 |
| `pina-colada` | 47.4 | 457 | 53.1 | 33.8 | 11.3 |

### With `default_milk = semi-skimmed-milk`

| Recipe | Derived fill (ml) | kcal | Protein | Carbs | Fat |
|---|---:|---:|---:|---:|---:|
| `vanilla-custard` | 252.7 | 447 | 63.2 | 29.2 | 7.9 |
| `mango-lassi` | 107.4 | 415 | 55.1 | 37.5 | 4.9 |
| `double-chocolate-brownie` | 222.7 | 513 | 64.6 | 32.2 | 12.8 |
| `cookies-and-cream` | 252.7 | 469 | 63.4 | 31.6 | 9.4 |
| `pina-colada` | 47.4 | 464 | 53.1 | 33.7 | 12.1 |

Two things worth noticing, because they confirm the algorithm rather than contradict it:

- **Derived fill is identical across both milks.** Milk type changes macros, not volume. If a test shows fill volume moving when the milk changes, the substitution is happening in the wrong order.
- **Piña Colada derives only 47ml.** It carries 140g of pineapple *and* 80ml of coconut milk in the frozen base, so there is genuinely little room left. The toasted-coconut mix-in is added afterwards and does not displace milk.

Also assert these edge cases:

| Case | Expected |
|---|---|
| `scale = 0.5` on `vanilla-custard` | Every figure exactly half, `fillVolumeMl` 126.4 |
| `excludeOptional = true` on `pina-colada` | Toasted coconut dropped, kcal falls by ~32.5 and fill stays unchanged |
| Base and addition lines that exceed 525ml | `overflows: true`, `fillVolumeMl: 0`, still returns totals |
| A mix-in at any quantity | Included in macros, excluded from occupied volume and overflow |
| A line with `ingredientId: null` | Skipped silently, listed in `warnings` |
| An ingredient missing from the map | Skipped, added to `excludedLines`, never throws |
| `negligible` ingredient at any quantity | Contributes exactly zero |

The engine must never throw. Bad data produces a warning and a best-effort number, because a recipe screen that crashes is worse than one showing an approximate figure with a note on it.

## Calibration

The values in `seed/ingredients.json` are approximate UK supermarket figures. The original document's per-recipe estimates are seeded into `recipes.reference_kcal` and `reference_protein_g` so the two can be compared.

Measured across all 40 recipes with skimmed milk, computed values run about **+20 kcal** and **+6g protein** above the original estimates. That gap is expected and mostly explains itself: the protein powder default of 75g per 100g is on the generous side, and the original's figures were themselves rough. Neither number is wrong enough to matter for the decision anyone actually makes with it.

Task 44 covers narrowing it:

1. Read the labels on the protein powder, yoghurt, quark and milk actually in the house.
2. Correct those four ingredients in the app's ingredient library.
3. Re-check a handful of recipes against the reference columns.
4. Once the gap is comfortable, drop `reference_kcal` and `reference_protein_g` from the schema.

Four ingredients account for most of the total in every recipe. Correcting those gets nearly all the available accuracy; there is no point grinding through all 71.

## Where macros are displayed

| Place | Shows |
|---|---|
| Recipe card | kcal per tub, protein per tub |
| Recipe detail | Full table: per tub and per serving, all four macros |
| Recipe detail | Derived milk quantity, as a real ingredient line: "Skimmed milk — 253ml (to the 525ml freezer fill line; mix-ins added afterwards)" |
| Recipe editor | Live recalculation as lines are added |
| Scale toggle | Recomputes everything, announced to screen readers |

Always show the estimate caveat near any macro table. The original document was straight about this and the app should be too: brands vary, mix-ins vary, and these are calculations rather than measurements.

If `macro_override_kcal` is set on a recipe, display it instead of the computed value, with a small marker indicating it was entered by hand.
