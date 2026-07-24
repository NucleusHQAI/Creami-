// Pure aggregation — no React, no Supabase. Turns the plan into a grouped
// shopping list. See docs/07-feature-shopping.md § Aggregation.

import { calculateMacros } from '@/lib/macros'
import type { Ingredient as MacroIngredient, MacroLine, MacroSettings, Unit } from '@/lib/macros/types'
import { toGrams, toMillilitres } from '@/lib/units'
import type { Ingredient } from '@/types/domain'
import type {
  PlanItemWithRecipe,
  PlanRecipeLine,
  ShoppingFreeTextLine,
  ShoppingGroup,
  ShoppingIngredientLine,
  ShoppingLine,
  ShoppingRecipeRef,
} from '@/features/shopping/types'

// Supermarket-route order. Every ingredient category in the schema
// (docs/02-data-model.md) maps into exactly one of these; anything that
// doesn't recognise falls into "Other" rather than being dropped.
const GROUP_ORDER: Array<{ key: string; label: string; categories: string[] }> = [
  { key: 'fresh', label: 'Fresh (fruit)', categories: ['fruit'] },
  { key: 'dairy', label: 'Dairy', categories: ['dairy'] },
  { key: 'protein', label: 'Protein and powders', categories: ['protein'] },
  {
    key: 'store-cupboard',
    label: 'Store cupboard (flavour, texture, sweet)',
    categories: ['flavour', 'texture', 'sweet'],
  },
  { key: 'biscuits', label: 'Biscuits and confectionery', categories: ['biscuit', 'confectionery'] },
  { key: 'nuts', label: 'Nuts', categories: ['nuts', 'nut-butter'] },
  { key: 'other', label: 'Other', categories: [] },
]

function groupKeyForCategory(category: string): string {
  return GROUP_ORDER.find((group) => group.categories.includes(category))?.key ?? 'other'
}

function toMacroIngredient(ingredient: Ingredient): MacroIngredient {
  return {
    id: ingredient.id,
    slug: ingredient.slug,
    name: ingredient.name,
    basis: ingredient.basis as MacroIngredient['basis'],
    kcal: ingredient.kcal,
    protein_g: ingredient.protein_g,
    carbs_g: ingredient.carbs_g,
    fat_g: ingredient.fat_g,
    density_g_per_ml: ingredient.density_g_per_ml,
    grams_per_item: ingredient.grams_per_item,
    negligible: ingredient.negligible,
    counts_toward_volume: ingredient.counts_toward_volume,
  }
}

/** The canonical unit a shopping line is bought in, from the ingredient's basis. */
function canonicalUnit(ingredient: Ingredient): Unit {
  if (ingredient.basis === 'per_100ml') return 'ml'
  if (ingredient.basis === 'per_item') return 'item'
  return 'g'
}

/** Converts a resolved line's quantity into the ingredient's canonical unit. */
function toCanonicalQuantity(quantity: number, unit: Unit, ingredient: Ingredient): number {
  if (ingredient.basis === 'per_item') {
    if (unit === 'item') return quantity
    if (!ingredient.grams_per_item) return 0
    return toGrams(quantity, unit, ingredient) / ingredient.grams_per_item
  }
  if (ingredient.basis === 'per_100ml') {
    return toMillilitres(quantity, unit, ingredient)
  }
  return toGrams(quantity, unit, ingredient)
}

interface Accumulator {
  ingredient: Ingredient
  quantity: number
  recipes: Map<string, ShoppingRecipeRef>
}

function addContribution(
  accumulators: Map<string, Accumulator>,
  ingredient: Ingredient,
  canonicalQuantity: number,
  ref: ShoppingRecipeRef,
): void {
  const existing = accumulators.get(ingredient.id)
  if (existing) {
    existing.quantity += canonicalQuantity
    existing.recipes.set(ref.recipeId, ref)
    return
  }
  accumulators.set(ingredient.id, {
    ingredient,
    quantity: canonicalQuantity,
    recipes: new Map([[ref.recipeId, ref]]),
  })
}

export interface BuildShoppingListInput {
  plan: PlanItemWithRecipe[]
  ingredients: Map<string, Ingredient>
  settings: MacroSettings
  includeOptional: boolean
}

export function buildShoppingList(input: BuildShoppingListInput): ShoppingGroup[] {
  const { plan, ingredients, settings, includeOptional } = input
  const excludeOptional = !includeOptional

  const macroIngredients = new Map<string, MacroIngredient>()
  for (const [id, ingredient] of ingredients) {
    macroIngredients.set(id, toMacroIngredient(ingredient))
  }

  const accumulators = new Map<string, Accumulator>()
  const freeTextLines: ShoppingFreeTextLine[] = []

  for (const item of plan) {
    const { recipe } = item
    const scale = item.multiplier
    const ref: ShoppingRecipeRef = { recipeId: item.recipe_id, name: recipe.name, multiplier: scale }

    const baseLines: MacroLine[] = recipe.baseLines.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity,
      unit: line.unit,
      optional: false,
      role: 'base',
    }))

    const recipeLines: MacroLine[] = recipe.lines.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity,
      unit: line.unit,
      optional: line.optional,
      role: line.role,
    }))

    // The derived fill is the whole point — reuse the macro engine's own
    // figure rather than recomputing it, so this can never drift from what
    // the recipe detail page shows.
    const macroResult = calculateMacros({
      baseLines,
      fillIngredientId: recipe.fillIngredientId,
      recipeLines,
      ingredients: macroIngredients,
      settings,
      scale,
      excludeOptional,
    })

    // Replicate the engine's own line collection (drop the base's nominal
    // fill row, drop toggled-off optionals, substitute the fill ingredient
    // for the configured default milk) so every individual ingredient
    // contribution can be aggregated, not just the totals.
    const collected: MacroLine[] = [
      ...baseLines.filter((line) => line.ingredientId !== recipe.fillIngredientId),
      ...recipeLines.filter((line) => includeOptional || !line.optional),
    ]

    for (const line of collected) {
      if (line.ingredientId === null || line.quantity === null || line.unit === null) continue
      const resolvedIngredientId =
        line.ingredientId === recipe.fillIngredientId
          ? settings.defaultMilkIngredientId
          : line.ingredientId
      if (!resolvedIngredientId) continue
      const ingredient = ingredients.get(resolvedIngredientId)
      if (!ingredient) continue

      const quantity = toCanonicalQuantity(line.quantity * scale, line.unit, ingredient)
      addContribution(accumulators, ingredient, quantity, ref)
    }

    // Free-text lines never resolve to an ingredient — keep them separate,
    // tagged with the recipe they came from, honouring the same optional
    // toggle.
    for (const line of recipe.lines) {
      if (line.ingredientId !== null) continue
      if (line.optional && excludeOptional) continue
      freeTextLines.push(toFreeTextLine(item.id, freeTextLines.length, line, ref))
    }

    // The derived fill, attributed to the default milk ingredient.
    if (settings.defaultMilkIngredientId && macroResult.fillVolumeMl > 0) {
      const milk = ingredients.get(settings.defaultMilkIngredientId)
      if (milk) {
        addContribution(accumulators, milk, macroResult.fillVolumeMl, ref)
      }
    }
  }

  return toGroups(accumulators, freeTextLines)
}

function toFreeTextLine(
  planItemId: string,
  index: number,
  line: PlanRecipeLine,
  ref: ShoppingRecipeRef,
): ShoppingFreeTextLine {
  return {
    kind: 'freeText',
    id: `${planItemId}-freetext-${index}`,
    text: line.display,
    recipeId: ref.recipeId,
    recipeName: ref.name,
  }
}

function toGroups(
  accumulators: Map<string, Accumulator>,
  freeTextLines: ShoppingFreeTextLine[],
): ShoppingGroup[] {
  const groups = new Map<string, ShoppingGroup>(
    GROUP_ORDER.map((group) => [group.key, { key: group.key, label: group.label, lines: [] }]),
  )

  for (const accumulator of accumulators.values()) {
    const { ingredient } = accumulator
    const unit = canonicalUnit(ingredient)
    // Items can't be bought fractionally — round the *number itself* up,
    // not just its display. Negligible ingredients show with no quantity
    // at all: "0.7g of xanthan gum" is a useless thing to read in a shop.
    const quantity = ingredient.negligible
      ? null
      : unit === 'item'
        ? Math.ceil(accumulator.quantity)
        : accumulator.quantity

    const line: ShoppingIngredientLine = {
      kind: 'ingredient',
      ingredientId: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      quantity,
      unit: ingredient.negligible ? null : unit,
      recipes: Array.from(accumulator.recipes.values()),
    }

    const group = groups.get(groupKeyForCategory(ingredient.category))
    group?.lines.push(line)
  }

  const other = groups.get('other')
  other?.lines.push(...freeTextLines)

  for (const group of groups.values()) {
    group.lines.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  }

  return GROUP_ORDER.map((group) => groups.get(group.key)).filter(
    (group): group is ShoppingGroup => group !== undefined && group.lines.length > 0,
  )
}

function sortKey(line: ShoppingLine): string {
  return line.kind === 'ingredient' ? line.name : line.text
}
