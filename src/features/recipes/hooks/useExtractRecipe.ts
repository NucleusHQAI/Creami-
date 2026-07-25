import { useMutation } from '@tanstack/react-query'
import { extractRecipe } from '@/lib/api/recipe-import'

export function useExtractRecipe() {
  return useMutation({ mutationFn: extractRecipe })
}
