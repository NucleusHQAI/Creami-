# 08 — Reference, ingredient library and settings

Everything behind the "More" tab. Less glamorous than the recipe screens, but the ingredient library is what makes the macro calculator worth having, and the settings are what make the milk guide actionable.

## Routes

| Route | Screen |
|---|---|
| `/more` | Menu |
| `/bases` | The six base formulas |
| `/bases/:key` | One base, editable |
| `/method` | The standard method and the technique notes |
| `/ingredients` | The ingredient library |
| `/settings` | Settings |

---

## Bases — `/bases`

The four base cards from the original document, now six and now real data.

Each card: name, tagline, summary, the ingredient list with quantities, and computed macros for the base alone (with no flavourings, so the fill ingredient tops up to the full 680ml). That last figure is genuinely useful — it is the floor for any recipe on that base.

Variations show their parentage: "Chocolate creamy — a variation of Everyday creamy".

Tapping through to `/bases/:key` allows editing quantities and swapping ingredients. **Changing a base changes every recipe built on it**, so warn plainly, naming the count: "This will change the macros of 14 recipes."

Keep the base ordering from the seed data — Everyday first, because it is the answer most of the time.

---

## Method — `/method`

Static reference, carried over from the original document because it is good and because it is the thing you look up when something has gone wrong.

**The five steps**, as a numbered list, sourced from `app_settings.standard_method`:

1. **Blend** — blend the base and flavour additions until completely smooth.
2. **Fill** — top up only to the Deluxe MAX FILL line, roughly 680ml.
3. **Freeze** — freeze flat for at least 24 hours with the surface level.
4. **Process** — use LITE ICE CREAM. Add 15–30ml milk and RE-SPIN if powdery.
5. **Mix-in** — make a narrow hole to the bottom, add the extras, run MIX-IN once.

**The technique notes**, as expandable cards. Carried over verbatim in substance:

| Note | Content |
|---|---|
| Using xanthan gum | 1/8 tsp per tub, maximum. Mix it through the protein powder before blending so it disperses. More is not better — too much makes the finished ice cream stretchy. |
| Quark and cottage cheese | Not the same product. Quark is naturally smooth; cottage cheese has curds and tastes saltier. Fat-free cottage cheese substitutes gram for gram but must be blended completely smooth first. Quark stays the first choice for cheesecake texture. |
| The milk guide | Semi-skimmed is the sensible starting point while learning the texture. Move to skimmed afterwards to cut calories while keeping far more body and protein than an almond-milk base. For light fruit tubs, swap no more than 150–200ml of dairy milk for unsweetened almond milk. |
| Why whey and casein | A blend gives more body than whey alone. Whey works, but the yoghurt or quark and the xanthan matter more for texture if you use it. |
| Macros are estimates | Calculated from an editable ingredient library using typical UK values. Brands and mix-ins change the totals — check your own labels when it matters. |

The milk guide card links straight to the milk setting, so reading the advice and acting on it is one tap. That connection is the whole reason for keeping the guidance in an app rather than a document.

---

## Ingredient library — `/ingredients`

71 seeded ingredients plus whatever gets added. This screen is where the calculator gets corrected, so make editing pleasant.

### List

Grouped by ingredient category, searchable. Each row shows name, kcal and protein per 100, and a badge on seeded rows.

### Editing

A sheet with every field:

| Field | Notes |
|---|---|
| Name | required |
| Category | select |
| Basis | per 100g / per 100ml / per item |
| kcal, protein, carbs, fat | required, per the basis |
| Grams per item | shown and required only when basis is per item |
| Density (g per ml) | default 1.0, in an "Advanced" disclosure |
| Grams per tsp | optional, powers the spoon helper |
| Negligible | switch, explained: "contributes no meaningful macros at recipe quantities" |
| Counts toward volume | switch, in Advanced |
| Notes | free text, shown in the library |

Editing an ingredient changes every recipe using it. Show the count before saving.

### Creating

From this screen, and inline from the recipe editor's ingredient picker. The inline route must return to the recipe editor with the new ingredient selected — sending someone to a different screen mid-edit and losing their work is how a feature gets abandoned.

Sensible defaults: basis `per_100g`, density 1.0, negligible off.

### Deleting

Only allowed when no recipe or base references the ingredient. Otherwise explain: "Used by 3 recipes. Remove it from those first." Seeded ingredients cannot be deleted at all — they can be edited, which is the thing anyone actually wants.

### Calibration prompt

At the top of the library, a dismissible card:

> **Check your labels.** These values are typical UK figures, not your brands. Correcting your protein powder, yoghurt, quark and milk will fix most of the difference. [Show me those four →]

This is the fastest path from "the numbers are roughly right" to "the numbers are right", and it takes about five minutes. See `docs/04-macro-engine.md`.

---

## Settings — `/settings`

| Setting | Control | Default | Effect |
|---|---|---|---|
| MAX FILL volume | number, ml | 680 | Recalculates every recipe's derived fill and macros |
| Default milk | ingredient select, dairy only | Semi-skimmed | Swaps the fill ingredient everywhere |
| Freeze hours | number | 24 | Used by the trigger for new batches |
| Servings per tub | number | 2 | Divides the per-serving figures |
| Standard method | textarea | the five steps | Shown on recipes with no override |

MAX FILL and default milk both move every number in the app. Show a live preview — "Vanilla Custard: 458 kcal → 517 kcal" — before the change is saved. It makes the consequence obvious instead of surprising.

Changing freeze hours affects **new** batches only. Existing ones keep the `ready_at` they were given. Say so on the screen.

Also on this page:

- **Account** — the signed-in email, and a sign-out button.
- **About** — version, a link to this repo, and the estimate caveat.
- **Export** — download everything as JSON. Not a sync mechanism, just a way to have a copy. Roughly forty lines of code and it means the recipe collection is never trapped.

## Data access

```ts
// src/lib/api/ingredients.ts
export function fetchIngredients(): Promise<Ingredient[]>
export function upsertIngredient(input: IngredientInput): Promise<Ingredient>
export function deleteIngredient(id: string): Promise<void>
export function countIngredientUsage(id: string): Promise<{ recipes: number; bases: number }>

// src/lib/api/bases.ts
export function fetchBases(): Promise<BaseWithIngredients[]>
export function updateBase(id: string, input: BaseInput): Promise<void>
export function countBaseUsage(id: string): Promise<number>

// src/lib/api/settings.ts
export function fetchSettings(): Promise<AppSettings>
export function updateSettings(input: Partial<AppSettings>): Promise<AppSettings>
```

Settings and reference data get `staleTime: 1000 * 60 * 60`. Changing settings invalidates `settings.all`, `recipes.all` and every `recipes.detail` — macros everywhere depend on them.

## Acceptance

- All six bases display with correct ingredients and computed base-only macros.
- Editing a base warns with an accurate count of affected recipes.
- The method and all five technique notes are present, with no personal names.
- An ingredient can be created inline from the recipe editor without losing the form.
- Correcting an ingredient's protein changes the macros of every recipe using it.
- Changing default milk from semi-skimmed to skimmed lowers every recipe's calories.
- Seeded ingredients cannot be deleted but can be edited.
- Export produces valid, complete JSON.
