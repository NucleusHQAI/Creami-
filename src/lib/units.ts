import type { Unit } from '@/lib/macros/types'

export interface UnitConvertible {
  density_g_per_ml: number
  grams_per_item: number | null
}

/** Converts a quantity in the given unit to grams for the given ingredient. */
export function toGrams(quantity: number, unit: Unit, ingredient: UnitConvertible): number {
  switch (unit) {
    case 'g':
      return quantity
    case 'ml':
      return quantity * ingredient.density_g_per_ml
    case 'item':
      return quantity * (ingredient.grams_per_item ?? 0)
  }
}

/** Converts a quantity in the given unit to millilitres for the given ingredient. */
export function toMillilitres(quantity: number, unit: Unit, ingredient: UnitConvertible): number {
  return toGrams(quantity, unit, ingredient) / ingredient.density_g_per_ml
}

const FRACTION_GLYPHS: Record<string, string> = {
  '0.25': '¼',
  '0.5': '½',
  '0.75': '¾',
  '0.33': '⅓',
  '0.67': '⅔',
}

/** Formats an item-based quantity as a whole number plus a clean fraction glyph where possible. */
function formatItemQuantity(quantity: number): string {
  const whole = Math.floor(quantity)
  const remainder = Math.round((quantity - whole) * 100) / 100

  if (remainder === 0) {
    return String(whole)
  }

  const glyph = FRACTION_GLYPHS[String(remainder)]
  if (glyph) {
    return whole > 0 ? `${whole}${glyph}` : glyph
  }

  // Not a clean fraction — one decimal place on the whole quantity.
  return String(Math.round(quantity * 10) / 10)
}

/**
 * Formats a quantity for display, per docs/05-feature-recipes.md "Scaling":
 * item quantities render as whole numbers with a clean fraction glyph where
 * possible, else one decimal; g/ml under 10 keep one decimal, 10 and over
 * round to whole numbers; anything under half a gram or millilitre reads as
 * "a pinch" rather than a number that looks precise but isn't; nothing ever
 * renders as a bare "0g"/"0ml".
 */
export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === 'item') {
    return formatItemQuantity(quantity)
  }

  if (quantity < 0.5) {
    return 'a pinch'
  }

  if (quantity < 10) {
    const oneDecimal = Math.round(quantity * 10) / 10
    return `${oneDecimal}${unit}`
  }

  return `${Math.round(quantity)}${unit}`
}
