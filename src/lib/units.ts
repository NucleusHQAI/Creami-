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

/** Formats an item-based quantity as a whole number plus a fraction glyph where possible. */
function formatItemQuantity(quantity: number): string {
  const whole = Math.floor(quantity)
  const remainder = Math.round((quantity - whole) * 100) / 100

  if (remainder === 0) {
    return String(whole)
  }

  const glyph = FRACTION_GLYPHS[String(remainder)]
  const fraction = glyph ?? remainder.toFixed(2).replace(/^0/, '')

  return whole > 0 ? `${whole}${fraction}` : fraction
}

/**
 * Formats a quantity for display. Item quantities render as whole numbers
 * with a fraction glyph; anything under half a gram or millilitre reads as
 * "a pinch" rather than a number that looks precise but isn't; nothing ever
 * renders as a bare "0".
 */
export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === 'item') {
    return formatItemQuantity(quantity)
  }

  if (quantity > 0 && quantity < 0.5) {
    return 'a pinch'
  }

  const rounded = Math.round(quantity)
  return `${rounded}${unit}`
}

/**
 * Rounds a shopping-list total for a human, not a lab: whole numbers below
 * 50, the nearest 5 from there up to a litre or kilo, then one decimal in
 * litres or kilos beyond that. Nobody measures 347ml of milk into a trolley.
 * Item counts don't go through this — they round up wherever they're
 * totalled, because that has to be true of the number itself, not just its
 * display.
 */
export function formatShoppingQuantity(quantity: number, unit: 'g' | 'ml'): string {
  if (quantity >= 1000) {
    const large = Math.round(quantity / 100) / 10
    return `${large}${unit === 'ml' ? 'L' : 'kg'}`
  }

  const rounded = quantity > 50 ? Math.round(quantity / 5) * 5 : Math.round(quantity)
  return `${rounded}${unit}`
}
