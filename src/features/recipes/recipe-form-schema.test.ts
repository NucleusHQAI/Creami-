import { describe, expect, it } from 'vitest'
import {
  formValuesToInput,
  recipeFormSchema,
  recipeToFormValues,
} from '@/features/recipes/recipe-form-schema'
import type { RecipeWithLines } from '@/types/domain'

function buildRecipe(): RecipeWithLines {
  return {
    id: 'recipe-1',
    image_path: null,
    slug: 'vanilla-custard',
    name: 'Vanilla Custard',
    category_id: 'cat-1',
    base_id: 'base-1',
    profile: 'Proper vanilla.',
    tip: 'Add salt.',
    mixin_note: null,
    method_override: null,
    is_favourite: false,
    is_seed: true,
    macro_override_kcal: null,
    macro_override_protein_g: null,
    reference_kcal: null,
    reference_protein_g: null,
    archived_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: {
      id: 'cat-1',
      key: 'classic',
      label: 'Creamy classics',
      accent: '#d49b29',
      tint: '#fff1cf',
      emoji: null,
      sort_order: 1,
    },
    base: {
      id: 'base-1',
      key: 'everyday',
      name: 'Everyday creamy',
      tagline: null,
      summary: null,
      guidance: null,
      is_variation_of: null,
      fill_ingredient_id: 'ing-milk',
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    ingredients: [
      {
        id: 'line-2',
        recipe_id: 'recipe-1',
        ingredient_id: 'ing-1',
        role: 'addition',
        quantity: 5,
        unit: 'g',
        display: '1 tsp vanilla bean paste',
        optional: false,
        free_text: null,
        sort_order: 1,
        ingredient: null,
      },
      {
        id: 'line-1',
        recipe_id: 'recipe-1',
        ingredient_id: null,
        role: 'addition',
        quantity: null,
        unit: null,
        display: 'a squeeze of something',
        optional: false,
        free_text: 'a squeeze of something',
        sort_order: 0,
        ingredient: null,
      },
    ],
  }
}

function at<T>(list: T[], index: number): T {
  const item = list[index]
  if (item === undefined) {
    throw new Error(`Expected an item at index ${index}`)
  }
  return item
}

describe('recipeToFormValues', () => {
  it('splits lines by role and preserves sort order', () => {
    const values = recipeToFormValues(buildRecipe())
    expect(values.additions).toHaveLength(2)
    expect(at(values.additions, 0).display).toBe('a squeeze of something')
    expect(at(values.additions, 1).display).toBe('1 tsp vanilla bean paste')
    expect(values.mixins).toHaveLength(0)
  })

  it('falls back nullable text fields to empty strings for the form', () => {
    const values = recipeToFormValues(buildRecipe())
    expect(values.mixinNote).toBe('')
    expect(values.methodOverride).toBe('')
  })
})

describe('formValuesToInput', () => {
  it('round-trips a recipe through form values and back to an input', () => {
    const values = recipeToFormValues(buildRecipe())
    const input = formValuesToInput(values, {
      id: 'recipe-1',
      isFavourite: false,
      imagePath: null,
    })

    expect(input.id).toBe('recipe-1')
    expect(input.name).toBe('Vanilla Custard')
    expect(input.ingredients).toHaveLength(2)
    expect(at(input.ingredients, 0)).toMatchObject({
      ingredientId: null,
      freeText: 'a squeeze of something',
    })
    expect(at(input.ingredients, 1)).toMatchObject({
      ingredientId: 'ing-1',
      quantity: 5,
      unit: 'g',
    })
  })

  it('clears quantity/unit for free-text lines even if stale values are present', () => {
    const values = recipeToFormValues(buildRecipe())
    values.additions[0] = { ...at(values.additions, 0), quantity: 3, unit: 'g' }
    const input = formValuesToInput(values, { isFavourite: false, imagePath: null })
    expect(at(input.ingredients, 0)).toMatchObject({ quantity: null, unit: null })
  })
})

describe('recipeFormSchema', () => {
  it('rejects a slug with uppercase or spaces', () => {
    const result = recipeFormSchema.safeParse({
      ...recipeToFormValues(buildRecipe()),
      slug: 'Not A Slug',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an ingredient line with neither ingredient nor free text', () => {
    const values = recipeToFormValues(buildRecipe())
    values.additions.push({
      ingredientId: null,
      freeText: null,
      quantity: null,
      unit: null,
      display: 'something',
      optional: false,
    })
    const result = recipeFormSchema.safeParse(values)
    expect(result.success).toBe(false)
  })

  it('accepts a valid recipe', () => {
    const result = recipeFormSchema.safeParse(recipeToFormValues(buildRecipe()))
    expect(result.success).toBe(true)
  })
})
