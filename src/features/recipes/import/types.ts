import type { RecipeFormValues } from '@/features/recipes/recipe-form-schema'
import type { IngredientUnit } from '@/types/domain'

export interface ExtractedRecipeSource {
  url: string | null
  title: string | null
  site: string | null
  retrievedAt: string | null
}

export interface ExtractedIngredientLine {
  original: string
}

export interface ExtractedRecipe {
  source: ExtractedRecipeSource
  name: string
  description: string | null
  recipeYield: string | null
  ingredients: ExtractedIngredientLine[]
}

export type AdaptationDecisionKind = 'mapped' | 'replaced' | 'covered_by_base' | 'unresolved'

export interface AdaptationDecision {
  kind: AdaptationDecisionKind
  sourceLine: string
  reason: string
  ingredientId: string | null
  ingredientName: string | null
  role: 'addition' | 'mixin' | null
}

export interface AdaptationWarning {
  sourceLine: string
  message: string
}

export interface RecipeSourceInput {
  sourceUrl: string | null
  sourceTitle: string | null
  sourceSite: string | null
  adaptationSummary: string | null
  retrievedAt: string | null
}

export interface AdaptedRecipeDraft {
  values: RecipeFormValues
  decisions: AdaptationDecision[]
  warnings: AdaptationWarning[]
  source: RecipeSourceInput
}

export type SourceUnit =
  IngredientUnit | 'kg' | 'l' | 'oz' | 'lb' | 'tsp' | 'tbsp' | 'fl_oz' | 'cup'

export interface NormalisedSourceLine {
  original: string
  ingredientText: string
  sourceQuantity: number | null
  sourceUnit: SourceUnit | null
  quantity: number | null
  unit: IngredientUnit | null
  warning: string | null
}

export interface AdaptationRuleData {
  id: string
  match_term: string
  action: 'map' | 'omit' | 'base_hint'
  replacement_ingredient_id: string | null
  suggested_base_id: string | null
  suggested_role: 'addition' | 'mixin' | null
  reason: string
  priority: number
}
