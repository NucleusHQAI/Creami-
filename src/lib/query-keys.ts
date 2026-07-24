// Every query key used by the app, in one place — components never write a
// key inline, or the cache invalidation gets it wrong somewhere down the line.

export interface RecipeFilters {
  search?: string
  categoryKey?: string | null
  favouritesOnly?: boolean
  sort?: 'name' | 'kcal' | 'protein' | 'rating'
}

export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    list: (filters: RecipeFilters) => ['recipes', 'list', filters] as const,
    detail: (id: string) => ['recipes', 'detail', id] as const,
  },
  categories: { all: ['categories'] as const },
  ingredients: { all: ['ingredients'] as const },
  bases: { all: ['bases'] as const },
  batches: {
    all: ['batches'] as const,
    active: ['batches', 'active'] as const,
  },
  tastingNotes: {
    forRecipe: (recipeId: string) => ['tastingNotes', 'recipe', recipeId] as const,
  },
  shopping: {
    plan: ['shopping', 'plan'] as const,
    extras: ['shopping', 'extras'] as const,
    checks: ['shopping', 'checks'] as const,
  },
  settings: { all: ['settings'] as const },
} as const
