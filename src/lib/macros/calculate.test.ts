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
  return { maxFillMl: 525, servingsPerTub: 2, defaultMilkIngredientId: milkSlug }
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
  { slug: 'vanilla-custard', fillMl: 252.7, kcal: 409, protein: 63.2, carbs: 29.7, fat: 3.6 },
  { slug: 'mango-lassi', fillMl: 107.4, kcal: 399, protein: 55.1, carbs: 37.7, fat: 3 },
  {
    slug: 'double-chocolate-brownie',
    fillMl: 222.7,
    kcal: 479,
    protein: 64.6,
    carbs: 32.6,
    fat: 9,
  },
  {
    slug: 'cookies-and-cream',
    fillMl: 252.7,
    kcal: 431,
    protein: 63.4,
    carbs: 32.1,
    fat: 5.1,
  },
  {
    slug: 'pina-colada',
    fillMl: 47.4,
    kcal: 457,
    protein: 53.1,
    carbs: 33.8,
    fat: 11.3,
  },
]

const semiSkimmedVectors: GoldenVector[] = [
  { slug: 'vanilla-custard', fillMl: 252.7, kcal: 447, protein: 63.2, carbs: 29.2, fat: 7.9 },
  { slug: 'mango-lassi', fillMl: 107.4, kcal: 415, protein: 55.1, carbs: 37.5, fat: 4.9 },
  {
    slug: 'double-chocolate-brownie',
    fillMl: 222.7,
    kcal: 513,
    protein: 64.6,
    carbs: 32.2,
    fat: 12.8,
  },
  {
    slug: 'cookies-and-cream',
    fillMl: 252.7,
    kcal: 469,
    protein: 63.4,
    carbs: 31.6,
    fat: 9.4,
  },
  {
    slug: 'pina-colada',
    fillMl: 47.4,
    kcal: 464,
    protein: 53.1,
    carbs: 33.7,
    fat: 12.1,
  },
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
    expect(half.fillVolumeMl).toBeCloseTo(126.4, 0)
    expect(Math.abs(half.fillVolumeMl - 126.4)).toBeLessThanOrEqual(0.1)
    expect(Math.abs(half.perTub.kcal * 2 - full.perTub.kcal)).toBeLessThanOrEqual(1)
    expect(Math.abs(half.perTub.protein_g * 2 - full.perTub.protein_g)).toBeLessThanOrEqual(0.11)
    expect(Math.abs(half.perTub.carbs_g * 2 - full.perTub.carbs_g)).toBeLessThanOrEqual(0.11)
    expect(Math.abs(half.perTub.fat_g * 2 - full.perTub.fat_g)).toBeLessThanOrEqual(0.11)
  })

  it('drops the toasted coconut without changing the frozen-base fill on pina-colada', () => {
    const withOptional = computeFor('pina-colada', 'skimmed-milk')
    const withoutOptional = computeFor('pina-colada', 'skimmed-milk', { excludeOptional: true })
    const kcalDrop = withOptional.perTub.kcal - withoutOptional.perTub.kcal
    expect(withoutOptional.fillVolumeMl).toBe(withOptional.fillVolumeMl)
    expect(kcalDrop).toBeGreaterThanOrEqual(32)
    expect(kcalDrop).toBeLessThanOrEqual(33)
  })

  it('counts a mix-in in macros without letting it displace the 525ml frozen base', () => {
    const withoutMixin = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })
    const withMixin = calculateMacros({
      baseLines: [],
      fillIngredientId: 'semi-skimmed-milk',
      recipeLines: [
        {
          ingredientId: 'wafer-pieces',
          quantity: 50,
          unit: 'g',
          optional: false,
          role: 'mixin',
        },
      ],
      ingredients: ingredientMap,
      settings: settingsWithMilk('skimmed-milk'),
    })

    expect(withMixin.fillVolumeMl).toBe(525)
    expect(withMixin.fillVolumeMl).toBe(withoutMixin.fillVolumeMl)
    expect(withMixin.perTub.kcal).toBeGreaterThan(withoutMixin.perTub.kcal)
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
