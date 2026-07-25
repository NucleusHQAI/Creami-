import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { upsertRecipe, type RecipeIngredientLineInput, type RecipeInput } from '@/lib/api/recipes'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/app/ToastProvider'
import { ensureUniqueSlug, slugify } from '@/lib/slug'
import type { IngredientUnit, RecipeListRow, RecipeWithLines } from '@/types/domain'

/**
 * Duplicates a recipe: copies every field and ingredient line, appends
 * " (copy)" to the name, derives a fresh unique slug, saves it, then opens
 * the editor for it — per docs/05 § Duplicating.
 */
export function useDuplicateRecipe() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (recipe: RecipeWithLines) => {
      const existing = queryClient.getQueryData<RecipeListRow[]>(queryKeys.recipes.all) ?? []
      const takenSlugs = new Set(
        existing.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)),
      )
      const newName = `${recipe.name} (copy)`
      const newSlug = ensureUniqueSlug(slugify(newName), takenSlugs)

      const ingredients: RecipeIngredientLineInput[] = [...recipe.ingredients]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((line) => ({
          ingredientId: line.ingredient_id,
          freeText: line.free_text,
          role: line.role as 'addition' | 'mixin',
          quantity: line.quantity,
          unit: line.unit as IngredientUnit | null,
          display: line.display,
          optional: line.optional,
        }))

      const input: RecipeInput = {
        slug: newSlug,
        name: newName,
        categoryId: recipe.category_id,
        baseId: recipe.base_id,
        profile: recipe.profile,
        tip: recipe.tip,
        mixinNote: recipe.mixin_note,
        methodOverride: recipe.method_override,
        macroOverrideKcal: recipe.macro_override_kcal,
        macroOverrideProteinG: recipe.macro_override_protein_g,
        isFavourite: false,
        ingredients,
      }

      return upsertRecipe(input)
    },
    onSuccess: (newRecipe) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.withLines })
      showToast(`Duplicated as "${newRecipe.name}"`)
      navigate(`/recipe/${newRecipe.slug}/edit`)
    },
    onError: () => showToast("Couldn't duplicate recipe — try again", { variant: 'error' }),
  })
}
