import { z } from 'zod'
import type { RecipeIngredientLineInput, RecipeInput } from '@/lib/api/recipes'
import type { IngredientUnit, RecipeWithLines } from '@/types/domain'

export const ingredientLineSchema = z
  .object({
    ingredientId: z.string().nullable(),
    freeText: z.string().nullable(),
    quantity: z.number().nullable(),
    unit: z.enum(['g', 'ml', 'item']).nullable(),
    display: z.string().trim().min(1, 'Add a description for this line'),
    optional: z.boolean(),
  })
  .refine((line) => line.ingredientId !== null || (line.freeText?.trim().length ?? 0) > 0, {
    message: 'Pick an ingredient, or add it as a note',
    path: ['ingredientId'],
  })

export const recipeFormSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(80, 'Keep it under 80 characters'),
  slug: z
    .string()
    .trim()
    .min(1, 'A slug is required')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only'),
  categoryId: z.string().min(1, 'Choose a category'),
  baseId: z.string().min(1, 'Choose a base'),
  profile: z.string().max(200, 'Keep it under 200 characters').optional(),
  additions: z.array(ingredientLineSchema),
  mixins: z.array(ingredientLineSchema),
  mixinNote: z.string().optional(),
  tip: z.string().optional(),
  methodOverride: z.string().optional(),
  macroOverrideKcal: z.number().min(0, "Can't be negative").nullable(),
  macroOverrideProteinG: z.number().min(0, "Can't be negative").nullable(),
})

export type RecipeFormValues = z.infer<typeof recipeFormSchema>
export type IngredientLineFormValue = z.infer<typeof ingredientLineSchema>

export function emptyIngredientLine(): IngredientLineFormValue {
  return {
    ingredientId: null,
    freeText: null,
    quantity: null,
    unit: 'g',
    display: '',
    optional: false,
  }
}

export function defaultFormValues(): RecipeFormValues {
  return {
    name: '',
    slug: '',
    categoryId: '',
    baseId: '',
    profile: '',
    additions: [],
    mixins: [],
    mixinNote: '',
    tip: '',
    methodOverride: '',
    macroOverrideKcal: null,
    macroOverrideProteinG: null,
  }
}

/** Loads an existing recipe into the form's shape. */
export function recipeToFormValues(recipe: RecipeWithLines): RecipeFormValues {
  const toLine = (line: RecipeWithLines['ingredients'][number]): IngredientLineFormValue => ({
    ingredientId: line.ingredient_id,
    freeText: line.free_text,
    quantity: line.quantity,
    unit: line.unit as IngredientUnit | null,
    display: line.display,
    optional: line.optional,
  })

  const sorted = [...recipe.ingredients].sort((a, b) => a.sort_order - b.sort_order)

  return {
    name: recipe.name,
    slug: recipe.slug,
    categoryId: recipe.category_id,
    baseId: recipe.base_id,
    profile: recipe.profile ?? '',
    additions: sorted.filter((line) => line.role === 'addition').map(toLine),
    mixins: sorted.filter((line) => line.role === 'mixin').map(toLine),
    mixinNote: recipe.mixin_note ?? '',
    tip: recipe.tip ?? '',
    methodOverride: recipe.method_override ?? '',
    macroOverrideKcal: recipe.macro_override_kcal,
    macroOverrideProteinG: recipe.macro_override_protein_g,
  }
}

export interface FormValuesToInputOptions {
  id?: string
  isFavourite: boolean
  imagePath: string | null
}

/** Builds the payload for upsertRecipe from the form's current values. */
export function formValuesToInput(
  values: RecipeFormValues,
  options: FormValuesToInputOptions,
): RecipeInput {
  function toLineInput(
    line: IngredientLineFormValue,
    role: 'addition' | 'mixin',
  ): RecipeIngredientLineInput {
    const isFreeText = line.ingredientId === null
    return {
      ingredientId: line.ingredientId,
      freeText: isFreeText ? line.freeText : null,
      role,
      quantity: isFreeText ? null : line.quantity,
      unit: isFreeText ? null : line.unit,
      display: line.display.trim(),
      optional: line.optional,
    }
  }

  return {
    id: options.id,
    slug: values.slug.trim(),
    name: values.name.trim(),
    categoryId: values.categoryId,
    baseId: values.baseId,
    profile: values.profile?.trim() || null,
    tip: values.tip?.trim() || null,
    mixinNote: values.mixinNote?.trim() || null,
    methodOverride: values.methodOverride?.trim() || null,
    imagePath: options.imagePath,
    macroOverrideKcal: values.macroOverrideKcal,
    macroOverrideProteinG: values.macroOverrideProteinG,
    isFavourite: options.isFavourite,
    ingredients: [
      ...values.additions.map((line) => toLineInput(line, 'addition')),
      ...values.mixins.map((line) => toLineInput(line, 'mixin')),
    ],
  }
}
