// The shapes the app actually works with. Derived from the generated
// database types wherever possible — never duplicate a column list here.

import type { Tables } from '@/types/database.types'

export type Category = Tables<'categories'>
export type Ingredient = Tables<'ingredients'>
export type Base = Tables<'bases'>
export type BaseIngredient = Tables<'base_ingredients'>
export type Recipe = Tables<'recipes'>
export type RecipeIngredient = Tables<'recipe_ingredients'>
export type Batch = Tables<'batches'>
export type TastingNote = Tables<'tasting_notes'>
export type PlanItem = Tables<'plan_items'>
export type ShoppingExtra = Tables<'shopping_extras'>
export type ShoppingCheck = Tables<'shopping_checks'>
export type AppSettings = Tables<'app_settings'>
export type RecipeListRow = Tables<'recipe_list_view'>
export type RecipeRatingsRow = Tables<'recipe_ratings'>

export type IngredientUnit = 'g' | 'ml' | 'item'
export type IngredientBasis = 'per_100g' | 'per_100ml' | 'per_item'
export type RecipeIngredientRole = 'addition' | 'mixin'
export type BatchStatus = 'freezing' | 'ready' | 'spun' | 'finished'

/** A base with its ingredient lines resolved, as read from the API layer. */
export interface BaseWithIngredients extends Base {
  ingredients: Array<BaseIngredient & { ingredient: Ingredient }>
}

/** A recipe with its base, category and ingredient lines resolved. */
export interface RecipeWithLines extends Recipe {
  category: Category
  base: Base
  ingredients: Array<RecipeIngredient & { ingredient: Ingredient | null }>
}
