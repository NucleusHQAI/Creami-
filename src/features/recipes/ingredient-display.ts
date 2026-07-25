import { formatQuantity } from '@/lib/units'
import type { Unit } from '@/lib/macros/types'
import type { BaseIngredient, Ingredient, RecipeIngredient } from '@/types/domain'

export interface IngredientLineDisplay {
  id: string
  /** Ingredient name, or the free-text note when there is no matched ingredient. */
  label: string
  /** Scaled, formatted quantity — null for free-text lines, which have nothing to scale. */
  quantity: string | null
  isFreeText: boolean
  optional: boolean
}

/**
 * Describes one recipe ingredient line for display, at the given scale.
 * Recomputes the quantity from `quantity`/`unit` rather than trusting the
 * stored `display` string, which is a fixed piece of text (e.g. "1 tsp
 * vanilla bean paste") that can't itself scale — docs/05 § Scaling requires
 * every quantity on the page to multiply by `scale`.
 */
export function describeRecipeLine(
  line: RecipeIngredient & { ingredient: Ingredient | null },
  scale: number,
): IngredientLineDisplay {
  if (!line.ingredient) {
    return {
      id: line.id,
      label: line.free_text ?? line.display,
      quantity: null,
      isFreeText: true,
      optional: line.optional,
    }
  }

  const quantity =
    line.quantity !== null && line.unit !== null
      ? formatQuantity(line.quantity * scale, line.unit as Unit)
      : null

  return {
    id: line.id,
    label: line.ingredient.name,
    quantity,
    isFreeText: false,
    optional: line.optional,
  }
}

/** Same idea for a base's fixed ingredient lines (no optional/free-text concept there). */
export function describeBaseLine(
  line: BaseIngredient & { ingredient: Ingredient },
  scale: number,
): IngredientLineDisplay {
  return {
    id: line.id,
    label: line.ingredient.name,
    quantity: formatQuantity(line.quantity * scale, line.unit as Unit),
    isFreeText: false,
    optional: false,
  }
}
