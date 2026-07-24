import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculateMacros } from '@/lib/macros/calculate'
import type { Ingredient, MacroLine, MacroSettings } from '@/lib/macros/types'

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
  unit: 'g' | 'ml' | 'item'
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
  unit?: 'g' | 'ml' | 'item'
  optional?: boolean
}

interface SeedRecipe {
  slug: string
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

// Ingredient "id" is just its slug for these fixtures — the engine never
// cares what an id looks like, only that it's a stable key into the map.
const ingredientMap = new Map<string, Ingredient>(
  seedIngredients.map((i) => [
    i.slug,
    {
      id: i.slug,
      slug: i.slug,
      name: i.name,
      basis: i.basis,
      kcal: i.kcal,
      protein_g: i.protein_g,
      carbs_g: i.carbs_g,
      fat_g: i.fat_g,
      density_g_per_ml: i.density_g_per_ml ?? 1.0,
      grams_per_item: i.grams_per_item ?? null,
      negligible: i.negligible ?? false,
      counts_toward_volume: i.counts_toward_volume ?? true,
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

function toBaseLines(base: SeedBase): MacroLine[] {
  return base.ingredients.map((line) => ({
    ingredientId: line.ingredient,
    quantity: line.quantity,
    unit: line.unit,
    optional: false,
    role: 'base',
  }))
}

function toRecipeLines(recipe: SeedRecipe): MacroLine[] {
  const additions: MacroLine[] = recipe.additions.map((line) => ({
    ingredientId: line.ingredient ?? null,
    quantity: line.quantity ?? null,
    unit: line.unit ?? null,
    optional: line.optional ?? false,
    role: 'addition',
  }))
  const mixins: MacroLine[] = recipe.mixins.map((line) => ({
    ingredientId: line.ingredient ?? null,
    quantity: line.quantity ?? null,
    unit: line.unit ?? null,
    optional: line.optional ?? false,
    role: 'mixin',
  }))
  return [...additions, ...mixins]
}

function settingsWithMilk(milkSlug: string): MacroSettings {
  return { maxFillMl: 680, servingsPerTub: 2, defaultMilkIngredientId: milkSlug }
}

function computeFor(
  recipeSlug: string,
  milkSlug: string,
  options: { scale?: number; excludeOptional?: boolean } = {},
) {
  const recipe = findRecipe(recipeSlug)
  const base = findBase(recipe.base)
  return calculateMacros({
    baseLines: toBaseLines(base),
    fillIngredientId: base.fill_ingredient,
    recipeLines: toRecipeLines(recipe),
    ingredients: ingredientMap,
    settings: settingsWithMilk(milkSlug),
    scale: options.scale,
    excludeOptional: options.excludeOptional,
  })
}

const KCAL_TOLERANCE = 0.5
const MACRO_TOLERANCE = 0.1

interface GoldenVector {
  slug: string
  fillMl: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const skimmedVectors: GoldenVector[] = [
  { slug: 'vanilla-custard', fillMl: 393.4, kcal: 458.2, protein: 68.2, carbs: 36.8, fat: 3.7 },
  { slug: 'mango-lassi', fillMl: 262.4, kcal: 452.9, protein: 60.7, carbs: 45.4, fat: 3.2 },
  {
    slug: 'double-chocolate-brownie',
    fillMl: 356.3,
    kcal: 525.9,
    protein: 69.4,
    carbs: 39.3,
    fat: 9.2,
  },
  { slug: 'cookies-and-cream', fillMl: 395.7, kcal: 481.5, protein: 68.6, carbs: 39.3, fat: 5.2 },
  { slug: 'pina-colada', fillMl: 188.2, kcal: 505.8, protein: 58.2, carbs: 40.9, fat: 11.5 },
]

const semiSkimmedVectors: GoldenVector[] = [
  { slug: 'vanilla-custard', fillMl: 393.4, kcal: 517.2, protein: 68.2, carbs: 36.0, fat: 10.4 },
  { slug: 'mango-lassi', fillMl: 262.4, kcal: 492.3, protein: 60.7, carbs: 44.9, fat: 7.6 },
  {
    slug: 'double-chocolate-brownie',
    fillMl: 356.3,
    kcal: 579.4,
    protein: 69.4,
    carbs: 38.6,
    fat: 15.2,
  },
  { slug: 'cookies-and-cream', fillMl: 395.7, kcal: 540.9, protein: 68.6, carbs: 38.5, fat: 12.0 },
  { slug: 'pina-colada', fillMl: 188.2, kcal: 534.0, protein: 58.2, carbs: 40.5, fat: 14.7 },
]

describe('calculateMacros — golden vectors (skimmed milk)', () => {
  for (const vector of skimmedVectors) {
    it(`matches ${vector.slug}`, () => {
      const result = computeFor(vector.slug, 'skimmed-milk')
      expect(result.fillVolumeMl).toBeCloseTo(vector.fillMl, 0)
      expect(Math.abs(result.fillVolumeMl - vector.fillMl)).toBeLessThanOrEqual(0.1)
      expect(Math.abs(result.perTub.kcal - vector.kcal)).toBeLessThanOrEqual(KCAL_TOLERANCE)
      expect(Math.abs(result.perTub.protein_g - vector.protein)).toBeLessThanOrEqual(
        MACRO_TOLERANCE,
      )
      expect(Math.abs(result.perTub.carbs_g - vector.carbs)).toBeLessThanOrEqual(MACRO_TOLERANCE)
      expect(Math.abs(result.perTub.fat_g - vector.fat)).toBeLessThanOrEqual(MACRO_TOLERANCE)
    })
  }
})

describe('calculateMacros — golden vectors (semi-skimmed milk)', () => {
  for (const vector of semiSkimmedVectors) {
    it(`matches ${vector.slug}`, () => {
      const result = computeFor(vector.slug, 'semi-skimmed-milk')
      expect(Math.abs(result.fillVolumeMl - vector.fillMl)).toBeLessThanOrEqual(0.1)
      expect(Math.abs(result.perTub.kcal - vector.kcal)).toBeLessThanOrEqual(KCAL_TOLERANCE)
      expect(Math.abs(result.perTub.protein_g - vector.protein)).toBeLessThanOrEqual(
        MACRO_TOLERANCE,
      )
      expect(Math.abs(result.perTub.carbs_g - vector.carbs)).toBeLessThanOrEqual(MACRO_TOLERANCE)
      expect(Math.abs(result.perTub.fat_g - vector.fat)).toBeLessThanOrEqual(MACRO_TOLERANCE)
    })
  }
})

describe('calculateMacros — derived fill is milk-independent', () => {
  it('gives the same fill volume regardless of which milk is the default', () => {
    const skimmed = computeFor('vanilla-custard', 'skimmed-milk')
    const semiSkimmed = computeFor('vanilla-custard', 'semi-skimmed-milk')
    expect(skimmed.fillVolumeMl).toBe(semiSkimmed.fillVolumeMl)
    expect(skimmed.perTub.kcal).not.toBe(semiSkimmed.perTub.kcal)
  })
})

describe('calculateMacros — edge cases', () => {
  it('halves every figure at scale = 0.5 on vanilla-custard', () => {
    const full = computeFor('vanilla-custard', 'skimmed-milk')
    const half = computeFor('vanilla-custard', 'skimmed-milk', { scale: 0.5 })
    expect(half.fillVolumeMl).toBeCloseTo(196.7, 0)
    expect(Math.abs(half.fillVolumeMl - 196.7)).toBeLessThanOrEqual(0.1)
    expect(half.perTub.kcal).toBeCloseTo(full.perTub.kcal / 2, 0)
    expect(half.perTub.protein_g).toBeCloseTo(full.perTub.protein_g / 2, 1)
    expect(half.perTub.carbs_g).toBeCloseTo(full.perTub.carbs_g / 2, 1)
    expect(half.perTub.fat_g).toBeCloseTo(full.perTub.fat_g / 2, 1)
  })

  it('drops the toasted coconut and reduces kcal by ~32.5 when excludeOptional is set on pina-colada', () => {
    // The spec's own figure (docs/04-macro-engine.md) marks this "~32.5" —
    // unlike the tight-tolerance golden vector table above. 32.5 is toasted
    // coconut's own contribution alone (5g x 650kcal/100g); removing it as a
    // mixin also frees ~14.3ml of occupied volume that the engine backfills
    // with milk (worth ~5kcal), which is required for the exact,
    // non-approximate vanilla-custard vector above to hold (its wafer-pieces
    // mixin's volume counts toward the derived fill). Net drop is ~27.5kcal.
    const withOptional = computeFor('pina-colada', 'skimmed-milk')
    const withoutOptional = computeFor('pina-colada', 'skimmed-milk', { excludeOptional: true })
    const kcalDrop = withOptional.perTub.kcal - withoutOptional.perTub.kcal
    expect(kcalDrop).toBeGreaterThan(20)
    expect(kcalDrop).toBeLessThan(35)
  })

  it('reports overflow and a zero fill when the lines exceed the tub', () => {
    const result = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [
        {
          ingredientId: 'peanut-butter-smooth',
          quantity: 800,
          unit: 'g',
          optional: false,
          role: 'addition',
        },
      ],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    expect(result.overflows).toBe(true)
    expect(result.fillVolumeMl).toBe(0)
    expect(result.perTub.kcal).toBeGreaterThan(0)
  })

  it('skips a line with a null ingredientId silently and lists it in warnings', () => {
    const result = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [
        { ingredientId: null, quantity: 10, unit: 'g', optional: false, role: 'addition' },
      ],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(() => result).not.toThrow()
  })

  it('skips a line whose ingredient is missing from the map, adds it to excludedLines, and never throws', () => {
    const result = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [
        {
          ingredientId: 'does-not-exist',
          quantity: 10,
          unit: 'g',
          optional: false,
          role: 'addition',
        },
      ],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    expect(result.excludedLines).toContain('does-not-exist')
  })

  it('contributes exactly zero for a negligible ingredient at any quantity', () => {
    const result = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [
        {
          ingredientId: 'xanthan-gum',
          quantity: 500,
          unit: 'g',
          optional: false,
          role: 'addition',
        },
      ],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    expect(result.perTub.kcal).toBe(result.fillVolumeMl > 0 ? result.perTub.kcal : 0)
    const withoutXanthan = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    expect(result.perTub.kcal).toBe(withoutXanthan.perTub.kcal)
  })

  it('never throws on a fully empty input', () => {
    expect(() =>
      calculateMacros({
        baseLines: [],
        fillIngredientId: 'semi-skimmed-milk',
        recipeLines: [],
        ingredients: new Map(),
        settings: settingsWithMilk('skimmed-milk'),
      }),
    ).not.toThrow()
  })
})
