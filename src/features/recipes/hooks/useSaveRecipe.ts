import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertRecipe, type RecipeInput } from '@/lib/api/recipes'
import {
  isUploadedRecipeImage,
  removeRecipeImage,
  uploadRecipeImage,
} from '@/lib/api/recipe-images'
import { queryKeys } from '@/lib/query-keys'

export interface SaveRecipeVariables {
  input: RecipeInput
  imageFile: File | null
  previousImagePath: string | null
}

async function saveRecipeWithPhoto({ input, imageFile, previousImagePath }: SaveRecipeVariables) {
  let uploadedImagePath: string | null = null

  if (imageFile) {
    uploadedImagePath = await uploadRecipeImage(imageFile)
  }

  try {
    const recipe = await upsertRecipe({
      ...input,
      imagePath: uploadedImagePath ?? input.imagePath,
    })

    if (isUploadedRecipeImage(previousImagePath) && previousImagePath !== recipe.image_path) {
      try {
        await removeRecipeImage(previousImagePath)
      } catch (error) {
        console.error('Recipe saved, but the previous photo could not be removed.', {
          path: previousImagePath,
          error,
        })
      }
    }

    return recipe
  } catch (error) {
    if (uploadedImagePath) {
      try {
        await removeRecipeImage(uploadedImagePath)
      } catch (cleanupError) {
        console.error('Recipe save failed and its newly uploaded photo could not be removed.', {
          path: uploadedImagePath,
          error: cleanupError,
        })
      }
    }
    throw error
  }
}

/**
 * Saves a recipe (create or edit — `input.id` decides which). On success,
 * invalidates the list, the search/macro source, and this recipe's detail
 * cache, per docs/05 § Saving.
 */
export function useSaveRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveRecipeWithPhoto,
    onSuccess: (recipe) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.withLines })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipe.slug) })
    },
  })
}
