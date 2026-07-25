export type Unit = 'g' | 'ml' | 'item'
export type Basis = 'per_100g' | 'per_100ml' | 'per_item'

export interface Ingredient {
  id: string
  slug: string
  name: string
  basis: Basis
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  density_g_per_ml: number
  grams_per_item: number | null
  negligible: boolean
  counts_toward_volume: boolean
}

export interface MacroLine {
  ingredientId: string | null // null → free text, contributes nothing
  quantity: number | null
  unit: Unit | null
  optional: boolean
  role: 'base' | 'addition' | 'mixin'
}

export interface MacroSettings {
  maxFillMl: number
  servingsPerTub: number
  defaultMilkIngredientId: string | null
}

export interface Macros {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface MacroResult {
  perTub: Macros
  perServing: Macros
  fillVolumeMl: number // derived milk in the frozen base, in ml
  occupiedVolumeMl: number
  overflows: boolean // base ingredients and additions exceeded the freezer-fill target
  excludedLines: string[] // ingredient ids skipped, with reasons in `warnings`
  warnings: string[]
}
