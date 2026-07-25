// Every query key used by the app, in one place — components never write a
// key inline, or the cache invalidation gets it wrong somewhere down the line.

export type RecipeSort = 'category' | 'name' | 'recent' | 'rating' | 'madeCount'

export interface RecipeFilters {
  search?: string
  categoryKey?: string | null
  favouritesOnly?: boolean
  sort?: RecipeSort
}

export const queryKeys = {
  recipes: {
    // The recipe_list_view rows — everything the list, its filters and the
    // favourite-toggle optimistic patch operate on.
    all: ['recipes'] as const,
    // Search/filter/sort are all client-side (docs/05 § Search — "forty rows
    // is nothing"), so `list(filters)` exists for callers that want a stable
    // key to describe a filter combination, but no query fetches per-filter —
    // `useRecipes` fetches `all` once and derives the filtered view in memory.
    list: (filters: RecipeFilters) => ['recipes', 'list', filters] as const,
    // Keyed by slug — the identifier the detail/edit routes actually use.
    detail: (slug: string) => ['recipes', 'detail', slug] as const,
    // Full recipes with resolved base + ingredient lines. recipe_list_view
    // deliberately excludes macros (docs/02) and ingredient `display` text,
    // both of which the list needs — for per-card macros, and so search can
    // match "almond extract" the way docs/05 requires. One extra query for
    // all non-archived recipes beats forty individual detail fetches.
    withLines: ['recipes', 'withLines'] as const,
    // Total batches per recipe, for the "Most made" sort only — fetched lazily.
    madeCounts: ['recipes', 'madeCounts'] as const,
  },
  categories: { all: ['categories'] as const },
  adaptationRules: { all: ['adaptationRules'] as const },
  ingredients: {
    all: ['ingredients'] as const,
    // Usage count for one ingredient — the delete guard in IngredientEditSheet.
    usage: (id: string) => ['ingredients', 'usage', id] as const,
    // Usage counts across every ingredient in one round trip — the recipe
    // editor's ingredient picker, which needs "most-used first" for all of them.
    usageCounts: ['ingredients', 'usageCounts'] as const,
  },
  bases: {
    all: ['bases'] as const,
    usage: (id: string) => ['bases', 'usage', id] as const,
  },
  batches: {
    all: ['batches'] as const,
    active: ['batches', 'active'] as const,
    history: ['batches', 'history'] as const,
    forRecipe: (recipeId: string) => ['batches', 'recipe', recipeId] as const,
  },
  recipeOptions: { all: ['recipeOptions'] as const },
  tastingNotes: {
    forRecipe: (recipeId: string) => ['tastingNotes', 'recipe', recipeId] as const,
  },
  recipeRatings: {
    forRecipe: (recipeId: string) => ['recipeRatings', 'recipe', recipeId] as const,
  },
  shopping: {
    plan: ['shopping', 'plan'] as const,
    extras: ['shopping', 'extras'] as const,
    checks: ['shopping', 'checks'] as const,
    recipeOptions: ['shopping', 'recipeOptions'] as const,
  },
  settings: {
    all: ['settings'] as const,
    // The one seeded recipe used to preview the effect of MAX FILL and
    // default-milk changes on the Settings screen before saving.
    previewRecipe: ['settings', 'previewRecipe'] as const,
  },
} as const

export const mutationKeys = {
  toggleFavourite: ['toggleFavourite'] as const,
  setCheck: ['setCheck'] as const,
  toggleExtra: ['toggleExtra'] as const,
  markSpun: ['markSpun'] as const,
  markFinished: ['markFinished'] as const,
} as const
