import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildShoppingList } from '@/features/shopping/aggregate'
import type {
  PlanItemWithRecipe,
  PlanRecipeLine,
  ShoppingIngredientLine,
} from '@/features/shopping/types'
import type { MacroSettings, Unit } from '@/lib/macros/types'
import type { Ingredient } from '@/types/domain'

// Fixtures come from the real seed data, the same way src/lib/macros/calculate.test.ts
// does — an ingredient's "id" is just its slug, since the aggregator only
// cares that it's a stable key.

const seedRoot = resolve(__dirname, '../../../seed')

interface SeedIngredient {
  slug: string
  name: string
  category: string
  basis: 'per_100g' | 'per_100ml' | 'per_item'
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  density_g_per_ml?: number
  grams_per_item?: number
  negligible?: boolean
  counts_toward_volume?: boolean
}

interface SeedBaseLine {
  ingredient: string
  quantity: number
  unit: Unit
}

interface SeedBase {
  key: string
  fill_ingredient: string
  ingredients: SeedBaseLine[]
}

interface SeedRecipeLine {
  ingredient?: string
  free_text?: string
  quantity?: number
  unit?: Unit
  optional?: boolean
  display: string
}

interface SeedRecipe {
  slug: string
  name: string
  base: string
  additions: SeedRecipeLine[]
  mixins: SeedRecipeLine[]
}

const seedIngredients: SeedIngredient[] = JSON.parse(
  readFileSync(resolve(seedRoot, 'ingredients.json'), 'utf-8'),
).ingredients
const seedBases: SeedBase[] = JSON.parse(
  readFileSync(resolve(seedRoot, 'bases.json'), 'utf-8'),
).bases
const seedRecipes: SeedRecipe[] = JSON.parse(
  readFileSync(resolve(seedRoot, 'recipes.json'), 'utf-8'),
).recipes

const ingredientMap = new Map<string, Ingredient>(
  seedIngredients.map((seed) => [
    seed.slug,
    {
      id: seed.slug,
      slug: seed.slug,
      name: seed.name,
      category: seed.category,
      basis: seed.basis,
      kcal: seed.kcal,
      protein_g: seed.protein_g,
      carbs_g: seed.carbs_g,
      fat_g: seed.fat_g,
      density_g_per_ml: seed.density_g_per_ml ?? 1.0,
      grams_per_item: seed.grams_per_item ?? null,
      grams_per_tsp: null,
      negligible: seed.negligible ?? false,
      counts_toward_volume: seed.counts_toward_volume ?? true,
      notes: null,
      is_seed: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ]),
)

function findBase(key: string): SeedBase {
  const base = seedBases.find((b) => b.key === key)
  if (!base) throw new Error(`Fixture error: base ${key} not found`)
  return base
}

function findRecipe(slug: string): SeedRecipe {
  const recipe = seedRecipes.find((r) => r.slug === slug)
  if (!recipe) throw new Error(`Fixture error: recipe ${slug} not found`)
  return recipe
}

function toRecipeLines(recipe: SeedRecipe): PlanRecipeLine[] {
  const toLine = (line: SeedRecipeLine, role: 'addition' | 'mixin'): PlanRecipeLine => ({
    ingredientId: line.ingredient ?? null,
    quantity: line.quantity ?? null,
    unit: line.unit ?? null,
    optional: line.optional ?? false,
    role,
    display: line.display,
  })
  return [
    ...recipe.additions.map((line) => toLine(line, 'addition')),
    ...recipe.mixins.map((line) => toLine(line, 'mixin')),
  ]
}

/** Builds a plan item from seed data, with an optional override or addition of lines. */
function buildPlanItem(
  recipeSlug: string,
  multiplier: number,
  extraLines: PlanRecipeLine[] = [],
): PlanItemWithRecipe {
  const recipe = findRecipe(recipeSlug)
  const base = findBase(recipe.base)
  return {
    id: `plan-${recipeSlug}`,
    recipe_id: recipeSlug,
    multiplier,
    created_at: '2026-01-01T00:00:00Z',
    recipe: {
      id: recipeSlug,
      name: recipe.name,
      fillIngredientId: base.fill_ingredient,
      baseLines: base.ingredients.map((line) => ({
        ingredientId: line.ingredient,
        quantity: line.quantity,
        unit: line.unit,
      })),
      lines: [...toRecipeLines(recipe), ...extraLines],
    },
  }
}

const skimmedSettings: MacroSettings = {
  maxFillMl: 525,
  servingsPerTub: 2,
  defaultMilkIngredientId: 'skimmed-milk',
}

function findIngredientLine(
  groups: ReturnType<typeof buildShoppingList>,
  ingredientId: string,
): ShoppingIngredientLine | undefined {
  for (const group of groups) {
    for (const line of group.lines) {
      if (line.kind === 'ingredient' && line.ingredientId === ingredientId) return line
    }
  }
  return undefined
}

describe('buildShoppingList — derived fill, not the nominal amount', () => {
  it('gives Mango Lassi 107ml of milk, not the fruit base nominal 325ml', () => {
    const groups = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const milk = findIngredientLine(groups, 'skimmed-milk')
    expect(milk).toBeDefined()
    expect(milk?.quantity).not.toBeNull()
    expect(Math.abs((milk?.quantity ?? 0) - 107.4)).toBeLessThanOrEqual(0.2)
    expect(milk?.quantity).not.toBeCloseTo(325, 0)
  })

  it("uses the base's fill ingredient when no default milk has been configured", () => {
    const groups = buildShoppingList({
      plan: [buildPlanItem('vanilla-custard', 1)],
      ingredients: ingredientMap,
      settings: { ...skimmedSettings, defaultMilkIngredientId: null },
      includeOptional: true,
    })

    const milk = findIngredientLine(groups, 'semi-skimmed-milk')
    expect(milk).toBeDefined()
    expect(milk?.quantity).toBeGreaterThan(0)
  })
})

describe('buildShoppingList — summing across recipes', () => {
  it('sums milk correctly across two planned recipes', () => {
    const groups = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 1), buildPlanItem('vanilla-custard', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const milk = findIngredientLine(groups, 'skimmed-milk')
    // Mango Lassi ~107.4ml + Vanilla Custard ~252.7ml, from the golden vectors.
    expect(Math.abs((milk?.quantity ?? 0) - (107.4 + 252.7))).toBeLessThanOrEqual(0.5)
    expect(milk?.recipes.map((r) => r.name).sort()).toEqual(
      ['Mango Lassi', 'Vanilla Custard'].sort(),
    )
  })
})

describe('buildShoppingList — multiplier scaling', () => {
  it('doubles a recipe contribution at multiplier 2', () => {
    const single = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })
    const doubled = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 2)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const singleMilk = findIngredientLine(single, 'skimmed-milk')?.quantity ?? 0
    const doubledMilk = findIngredientLine(doubled, 'skimmed-milk')?.quantity ?? 0
    expect(doubledMilk).toBeCloseTo(singleMilk * 2, 0)

    const singleMango = findIngredientLine(single, 'mango')?.quantity ?? 0
    const doubledMango = findIngredientLine(doubled, 'mango')?.quantity ?? 0
    expect(doubledMango).toBe(singleMango * 2)

    const ref = findIngredientLine(doubled, 'mango')?.recipes[0]
    expect(ref?.multiplier).toBe(2)
  })
})

describe('buildShoppingList — item ingredients round up', () => {
  it('rounds a fractional item total up to a whole one', () => {
    const extra: PlanRecipeLine = {
      ingredientId: 'oreo-thin',
      quantity: 1.2,
      unit: 'item',
      optional: false,
      role: 'mixin',
      display: 'test fixture line',
    }
    const groups = buildShoppingList({
      plan: [buildPlanItem('vanilla-custard', 1, [extra])],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const oreo = findIngredientLine(groups, 'oreo-thin')
    expect(oreo?.quantity).toBe(2)
    expect(oreo?.unit).toBe('item')
  })

  it('rounds the combined total up rather than rounding each line first', () => {
    // Two lines of 0.5 items each sum to a whole 1 — rounding each line up
    // individually would overbuy at 2.
    const half: PlanRecipeLine = {
      ingredientId: 'oreo-thin',
      quantity: 0.5,
      unit: 'item',
      optional: false,
      role: 'mixin',
      display: 'half a biscuit, twice',
    }
    const groups = buildShoppingList({
      plan: [buildPlanItem('vanilla-custard', 1, [half, half])],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    expect(findIngredientLine(groups, 'oreo-thin')?.quantity).toBe(1)
  })
})

describe('buildShoppingList — negligible ingredients', () => {
  it('lists a negligible ingredient with no quantity', () => {
    const groups = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const xanthan = findIngredientLine(groups, 'xanthan-gum')
    expect(xanthan).toBeDefined()
    expect(xanthan?.quantity).toBeNull()
    expect(xanthan?.unit).toBeNull()
  })
})

describe('buildShoppingList — free-text lines', () => {
  it('keeps a free-text line separate and tagged with its recipe, uncombined with an identical one', () => {
    const freeText: PlanRecipeLine = {
      ingredientId: null,
      quantity: null,
      unit: null,
      optional: false,
      role: 'addition',
      display: 'A squeeze of whatever citrus is in the fruit bowl',
    }
    const groups = buildShoppingList({
      plan: [
        buildPlanItem('mango-lassi', 1, [freeText]),
        buildPlanItem('vanilla-custard', 1, [freeText]),
      ],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const freeTextLines = groups
      .flatMap((group) => group.lines)
      .filter((line) => line.kind === 'freeText')
    expect(freeTextLines).toHaveLength(2)
    expect(freeTextLines.map((line) => (line.kind === 'freeText' ? line.recipeName : ''))).toEqual(
      expect.arrayContaining(['Mango Lassi', 'Vanilla Custard']),
    )
  })
})

describe('buildShoppingList — optional mix-ins', () => {
  it('drops an optional mix-in and its own quantity when the toggle is off', () => {
    const withOptional = buildShoppingList({
      plan: [buildPlanItem('vanilla-custard', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })
    const withoutOptional = buildShoppingList({
      plan: [buildPlanItem('vanilla-custard', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: false,
    })

    expect(findIngredientLine(withOptional, 'wafer-pieces')).toBeDefined()
    expect(findIngredientLine(withoutOptional, 'wafer-pieces')).toBeUndefined()
  })
})

describe('buildShoppingList — group order', () => {
  it('orders groups in supermarket-route order, not alphabetically', () => {
    const groups = buildShoppingList({
      plan: [buildPlanItem('mango-lassi', 1), buildPlanItem('cookies-and-cream', 1)],
      ingredients: ingredientMap,
      settings: skimmedSettings,
      includeOptional: true,
    })

    const labels = groups.map((group) => group.label)
    const routeOrder = [
      'Fresh (fruit)',
      'Dairy',
      'Protein and powders',
      'Store cupboard (flavour, texture, sweet)',
      'Biscuits and confectionery',
      'Nuts',
      'Other',
    ]
    const presentInRouteOrder = routeOrder.filter((label) => labels.includes(label))
    expect(labels).toEqual(presentInRouteOrder)
  })
})

describe('buildShoppingList — empty plan', () => {
  it('returns no groups for an empty plan', () => {
    expect(
      buildShoppingList({
        plan: [],
        ingredients: ingredientMap,
        settings: skimmedSettings,
        includeOptional: true,
      }),
    ).toEqual([])
  })
})
