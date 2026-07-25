import { useMemo } from 'react'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useBases } from '@/features/reference/hooks/useBases'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { toMacroIngredient } from '@/features/recipes/hooks/useRecipeMacros'
import { calculateMacros } from '@/lib/macros'
import type { MacroLine, MacroResult, Unit } from '@/lib/macros/types'

export interface DraftMacroLine {
  ingredientId: string | null
  quantity: number | null
  unit: Unit | null
  optional: boolean
}

/**
 * The recipe editor's pinned live macro readout (docs/05 § The ingredient
 * line editor). Unlike useRecipeMacros, there's no saved RecipeWithLines to
 * bind to yet — this builds the same MacroLine shape straight from the
 * form's current additions/mixins, still delegating all arithmetic to
 * src/lib/macros.
 */
export function useDraftRecipeMacros(
  baseId: string | undefined,
  lines: DraftMacroLine[],
): MacroResult | undefined {
  const { data: ingredients } = useIngredients()
  const { data: bases } = useBases()
  const { data: settings } = useSettings()

  return useMemo(() => {
    if (!ingredients || !bases || !settings || !baseId) {
      return undefined
    }
    const base = bases.find((b) => b.id === baseId)
    if (!base) {
      return undefined
    }

    const ingredientMap = new Map(ingredients.map((i) => [i.id, toMacroIngredient(i)]))

    const baseLines: MacroLine[] = base.ingredients.map((line) => ({
      ingredientId: line.ingredient_id,
      quantity: line.quantity,
      unit: line.unit as Unit,
      optional: false,
      role: 'base',
    }))

    const recipeLines: MacroLine[] = lines.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity,
      unit: line.unit,
      optional: line.optional,
      role: 'addition',
    }))

    return calculateMacros({
      baseLines,
      fillIngredientId: base.fill_ingredient_id,
      recipeLines,
      ingredients: ingredientMap,
      settings: {
        maxFillMl: settings.max_fill_ml,
        servingsPerTub: settings.servings_per_tub,
        defaultMilkIngredientId: settings.default_milk_ingredient_id,
      },
    })
  }, [baseId, lines, ingredients, bases, settings])
}
