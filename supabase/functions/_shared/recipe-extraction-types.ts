export interface ExtractedRecipePayload {
  source: {
    url: string | null
    title: string | null
    site: string | null
    retrievedAt: string | null
  }
  name: string
  description: string | null
  recipeYield: string | null
  ingredients: Array<{ original: string }>
}
