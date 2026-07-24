// Shapes specific to the shopping feature. Kept out of src/types/domain.ts
// because they describe a normalised read (plan item + its resolved recipe
// lines) rather than a database row, and other features don't need them.

import type { Unit } from '@/lib/macros/types'
import type { PlanItem } from '@/types/domain'

/** One line from a base, as needed to build a MacroLine. */
export interface PlanBaseLine {
  ingredientId: string
  quantity: number
  unit: Unit
}

/** One addition or mix-in line from a recipe, as needed to build a MacroLine. */
export interface PlanRecipeLine {
  ingredientId: string | null
  quantity: number | null
  unit: Unit | null
  optional: boolean
  role: 'addition' | 'mixin'
  display: string
}

/** A plan item's recipe, flattened to exactly what aggregation needs. */
export interface PlanRecipe {
  id: string
  name: string
  fillIngredientId: string
  baseLines: PlanBaseLine[]
  lines: PlanRecipeLine[]
}

export interface PlanItemWithRecipe extends PlanItem {
  recipe: PlanRecipe
}

/** A recipe wanting a given ingredient, and how much of it (via its multiplier). */
export interface ShoppingRecipeRef {
  recipeId: string
  name: string
  multiplier: number
}

export interface ShoppingIngredientLine {
  kind: 'ingredient'
  ingredientId: string
  name: string
  category: string
  /** Canonical quantity — ml, g, or whole items rounded up. Null for negligible ingredients. */
  quantity: number | null
  unit: Unit | null
  recipes: ShoppingRecipeRef[]
}

/** A free-text recipe line — never combined with anything else. */
export interface ShoppingFreeTextLine {
  kind: 'freeText'
  id: string
  text: string
  recipeId: string
  recipeName: string
}

export type ShoppingLine = ShoppingIngredientLine | ShoppingFreeTextLine

export interface ShoppingGroup {
  key: string
  label: string
  lines: ShoppingLine[]
}

/** A minimal recipe row for the "Add recipes" sheet's multi-select list. */
export interface RecipeOption {
  id: string
  name: string
  slug: string
  categoryLabel: string
}
