import { describe, expect, it } from 'vitest'
import { adaptRecipe } from '@/features/recipes/import/adapt-recipe'
import type { AdaptationRuleData, ExtractedRecipe } from '@/features/recipes/import/types'
import type { BaseWithIngredients, Category, Ingredient } from '@/types/domain'

function ingredient(
  id: string,
  name: string,
  category: string,
  basis: Ingredient['basis'] = 'per_100g',
): Ingredient {
  return {
    id,
    slug: id,
    name,
    category,
    basis,
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    density_g_per_ml: 1,
    grams_per_item: basis === 'per_item' ? 10 : null,
    grams_per_tsp: name === 'Cocoa powder' ? 2.5 : null,
    negligible: false,
    counts_toward_volume: true,
    notes: null,
    is_seed: true,
    created_at: '',
    updated_at: '',
  }
}

const ingredients = [
  ingredient('milk', 'Semi-skimmed milk', 'dairy', 'per_100ml'),
  ingredient('protein', 'Vanilla whey/casein blend', 'protein'),
  ingredient('yoghurt', '0% Greek yoghurt', 'dairy'),
  ingredient('cream-cheese', 'Light cream cheese', 'dairy'),
  ingredient('vanilla-extract', 'Vanilla extract', 'flavour', 'per_100ml'),
  ingredient('sprinkles', 'Sprinkles', 'confectionery'),
  ingredient('strawberries', 'Strawberries', 'fruit'),
  ingredient('digestive', 'Light digestive biscuit', 'biscuit', 'per_item'),
  ingredient('cocoa-powder', 'Cocoa powder', 'flavour'),
  ingredient('pb-powder', 'Powdered peanut butter', 'flavour'),
]

function base(id: string, key: string, name: string, ingredientIds: string[]): BaseWithIngredients {
  return {
    id,
    key,
    name,
    tagline: null,
    summary: null,
    guidance: null,
    is_variation_of: null,
    fill_ingredient_id: 'milk',
    sort_order: ['everyday', 'fruit', 'choc', 'cheesecake'].indexOf(key),
    created_at: '',
    updated_at: '',
    ingredients: ingredientIds.map((ingredientId, index) => ({
      id: `${id}-${ingredientId}`,
      base_id: id,
      ingredient_id: ingredientId,
      quantity: 1,
      unit: 'g',
      note: null,
      sort_order: index,
      ingredient: ingredients.find((item) => item.id === ingredientId) ?? ingredients[0],
    })) as BaseWithIngredients['ingredients'],
  }
}

const bases = [
  base('base-everyday', 'everyday', 'Everyday creamy', ['milk', 'protein', 'yoghurt']),
  base('base-fruit', 'fruit', 'Fruit and yoghurt', ['milk', 'protein', 'yoghurt']),
  base('base-choc', 'choc', 'Chocolate creamy', ['milk', 'protein', 'yoghurt']),
  base('base-cheesecake', 'cheesecake', 'Cheesecake', [
    'milk',
    'protein',
    'yoghurt',
    'cream-cheese',
  ]),
]

const categories: Category[] = [
  { id: 'classic', key: 'classic', label: '', emoji: null, accent: '', tint: '', sort_order: 0 },
  { id: 'fruit', key: 'fruit', label: '', emoji: null, accent: '', tint: '', sort_order: 1 },
  { id: 'bakery', key: 'bakery', label: '', emoji: null, accent: '', tint: '', sort_order: 2 },
  {
    id: 'chocolate',
    key: 'chocolate',
    label: '',
    emoji: null,
    accent: '',
    tint: '',
    sort_order: 3,
  },
]

const rules: AdaptationRuleData[] = [
  {
    id: 'birthday',
    match_term: 'birthday cake',
    action: 'base_hint',
    replacement_ingredient_id: null,
    suggested_base_id: 'base-everyday',
    suggested_role: null,
    reason: 'Everyday base',
    priority: 100,
  },
  {
    id: 'cheesecake',
    match_term: 'cheesecake',
    action: 'base_hint',
    replacement_ingredient_id: null,
    suggested_base_id: 'base-cheesecake',
    suggested_role: null,
    reason: 'Cheesecake base',
    priority: 120,
  },
  {
    id: 'chocolate',
    match_term: 'chocolate',
    action: 'base_hint',
    replacement_ingredient_id: null,
    suggested_base_id: 'base-choc',
    suggested_role: null,
    reason: 'Chocolate base',
    priority: 100,
  },
  {
    id: 'milk-rule',
    match_term: 'milk',
    action: 'base_hint',
    replacement_ingredient_id: null,
    suggested_base_id: 'base-everyday',
    suggested_role: null,
    reason: 'Covered by base',
    priority: 10,
  },
  {
    id: 'protein-rule',
    match_term: 'protein powder',
    action: 'base_hint',
    replacement_ingredient_id: null,
    suggested_base_id: 'base-everyday',
    suggested_role: null,
    reason: 'Covered by base',
    priority: 20,
  },
  {
    id: 'pudding',
    match_term: 'pudding mix',
    action: 'omit',
    replacement_ingredient_id: null,
    suggested_base_id: null,
    suggested_role: null,
    reason: 'Base supplies structure',
    priority: 100,
  },
  {
    id: 'graham',
    match_term: 'graham cracker',
    action: 'map',
    replacement_ingredient_id: 'digestive',
    suggested_base_id: null,
    suggested_role: 'mixin',
    reason: 'UK digestive replacement',
    priority: 100,
  },
  {
    id: 'pb2',
    match_term: 'pb2',
    action: 'map',
    replacement_ingredient_id: 'pb-powder',
    suggested_base_id: null,
    suggested_role: 'addition',
    reason: 'Generic UK replacement',
    priority: 100,
  },
]

function source(name: string, lines: string[]): ExtractedRecipe {
  return {
    source: { url: null, title: name, site: null, retrievedAt: null },
    name,
    description: null,
    recipeYield: null,
    ingredients: lines.map((original) => ({ original })),
  }
}

function adapt(recipe: ExtractedRecipe) {
  return adaptRecipe({ recipe, bases, ingredients, categories, rules })
}

describe('adaptRecipe', () => {
  it('adapts birthday cake around the everyday base', () => {
    const result = adapt(
      source('Birthday Cake', [
        '1 cup milk',
        '2 tbsp protein powder',
        '1 tbsp instant pudding mix',
        '1 tsp vanilla extract',
        '20 g sprinkles',
      ]),
    )
    expect(result.values.baseId).toBe('base-everyday')
    expect(result.values.additions.map((line) => line.ingredientId)).toContain('vanilla-extract')
    expect(result.values.mixins.map((line) => line.ingredientId)).toContain('sprinkles')
    expect(result.decisions.filter((decision) => decision.kind === 'covered_by_base')).toHaveLength(
      3,
    )
  })

  it('adapts strawberry cheesecake without duplicating base dairy', () => {
    const result = adapt(
      source('Strawberry Cheesecake', [
        '100 g strawberries',
        '100 g light cream cheese',
        '2 items graham crackers',
      ]),
    )
    expect(result.values.baseId).toBe('base-cheesecake')
    expect(result.values.additions.map((line) => line.ingredientId)).toContain('strawberries')
    expect(result.values.mixins.map((line) => line.ingredientId)).toContain('digestive')
    expect(result.values.additions.map((line) => line.ingredientId)).not.toContain('cream-cheese')
  })

  it('maps PB2 and selects the chocolate base', () => {
    const result = adapt(source('Chocolate Peanut Butter', ['2 tbsp cocoa powder', '20 g PB2']))
    expect(result.values.baseId).toBe('base-choc')
    expect(result.values.additions.map((line) => line.ingredientId)).toContain('pb-powder')
  })

  it('leaves solid cups and unknown brands unresolved', () => {
    const result = adapt(
      source('Mystery flavour', ['1 cup sprinkles', '20 g Mystery Crunch Brand']),
    )
    expect(result.warnings).toHaveLength(2)
    expect(result.values.mixins).toHaveLength(0)
  })

  it('always leaves macro overrides empty', () => {
    const result = adapt(source('Nutrition says 900 kcal', ['20 g sprinkles']))
    expect(result.values.macroOverrideKcal).toBeNull()
    expect(result.values.macroOverrideProteinG).toBeNull()
  })
})
