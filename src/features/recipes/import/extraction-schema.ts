import { z } from 'zod'

const nullableTrimmedString = z.string().trim().min(1).nullable()

export const extractedRecipeSchema = z.object({
  source: z.object({
    url: nullableTrimmedString,
    title: nullableTrimmedString,
    site: nullableTrimmedString,
    retrievedAt: z.string().datetime().nullable(),
  }),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).nullable(),
  recipeYield: z.string().trim().max(100).nullable(),
  ingredients: z
    .array(
      z.object({
        original: z.string().trim().min(1).max(500),
      }),
    )
    .min(1),
})
