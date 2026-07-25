import type { Ingredient } from '@/types/domain'
import type { NormalisedSourceLine, SourceUnit } from '@/features/recipes/import/types'

const FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
}

const UNIT_ALIASES: Array<[RegExp, SourceUnit]> = [
  [/^(?:kilograms?|kilogrammes?|kgs?)\b/i, 'kg'],
  [/^(?:grams?|grammes?|g)\b/i, 'g'],
  [/^(?:millilit(?:er|re)s?|mls?)\b/i, 'ml'],
  [/^(?:lit(?:er|re)s?|l)\b/i, 'l'],
  [/^(?:fluid ounces?|fl\.?\s*oz)\b/i, 'fl_oz'],
  [/^(?:ounces?|oz)\b/i, 'oz'],
  [/^(?:pounds?|lbs?)\b/i, 'lb'],
  [/^(?:teaspoons?|tsp)\b/i, 'tsp'],
  [/^(?:tablespoons?|tbsp)\b/i, 'tbsp'],
  [/^(?:cups?)\b/i, 'cup'],
  [/^(?:items?|pieces?|whole)\b/i, 'item'],
]

const PREPARATION_WORDS =
  /\b(?:crushed|divided|chopped|diced|sliced|softened|melted|drained|packed|optional|to taste|for serving)\b.*$/i

function parseFraction(value: string): number | null {
  const trimmed = value.trim()
  const unicodeOnly = FRACTIONS[trimmed]
  if (unicodeOnly !== undefined) return unicodeOnly

  const joinedUnicode = trimmed.match(/^(\d+)([¼½¾⅓⅔⅛⅜⅝⅞])$/)
  if (joinedUnicode) {
    const whole = Number(joinedUnicode[1])
    const fraction = FRACTIONS[joinedUnicode[2] ?? '']
    return fraction === undefined ? null : whole + fraction
  }

  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const whole = Number(mixed[1])
    const numerator = Number(mixed[2])
    const denominator = Number(mixed[3])
    return denominator === 0 ? null : whole + numerator / denominator
  }

  const fraction = trimmed.match(/^(\d+)\/(\d+)$/)
  if (fraction) {
    const numerator = Number(fraction[1])
    const denominator = Number(fraction[2])
    return denominator === 0 ? null : numerator / denominator
  }

  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

function readQuantity(input: string): {
  quantity: number | null
  rest: string
  range: boolean
} {
  const trimmed = input.trim()
  const range = trimmed.match(
    /^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔⅛⅜⅝⅞])\s*(?:-|–|to)\s*(\d+(?:\.\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])(?=\s|$)/i,
  )
  if (range) {
    return {
      quantity: parseFraction(range[1] ?? ''),
      rest: trimmed.slice(range[0].length).trim(),
      range: true,
    }
  }

  const quantity = trimmed.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔⅛⅜⅝⅞])(?=\s|$)/,
  )
  if (!quantity) return { quantity: null, rest: trimmed, range: false }

  return {
    quantity: parseFraction(quantity[1] ?? ''),
    rest: trimmed.slice(quantity[0].length).trim(),
    range: false,
  }
}

function readUnit(input: string): { unit: SourceUnit | null; rest: string } {
  for (const [pattern, unit] of UNIT_ALIASES) {
    const match = input.match(pattern)
    if (match) {
      return { unit, rest: input.slice(match[0].length).trim() }
    }
  }
  return { unit: null, rest: input }
}

function cleanIngredientText(input: string): string {
  return input
    .replace(/^[\s,.-]+/, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(PREPARATION_WORDS, '')
    .replace(/,\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function convert(
  quantity: number | null,
  sourceUnit: SourceUnit | null,
  ingredient: Ingredient | undefined,
): Pick<NormalisedSourceLine, 'quantity' | 'unit' | 'warning'> {
  if (quantity === null) {
    return {
      quantity: null,
      unit: null,
      warning: 'No quantity was found. Add one before relying on the macro calculation.',
    }
  }

  if (sourceUnit === null) {
    if (ingredient?.basis === 'per_item') {
      return { quantity, unit: 'item', warning: null }
    }
    return {
      quantity: null,
      unit: null,
      warning: 'The measurement unit is missing or unsupported.',
    }
  }

  if (sourceUnit === 'g' || sourceUnit === 'ml' || sourceUnit === 'item') {
    return { quantity, unit: sourceUnit, warning: null }
  }
  if (sourceUnit === 'kg') return { quantity: quantity * 1000, unit: 'g', warning: null }
  if (sourceUnit === 'l') return { quantity: quantity * 1000, unit: 'ml', warning: null }
  if (sourceUnit === 'oz') {
    return { quantity: quantity * 28.349523125, unit: 'g', warning: null }
  }
  if (sourceUnit === 'lb') {
    return { quantity: quantity * 453.59237, unit: 'g', warning: null }
  }
  if (sourceUnit === 'fl_oz') {
    return { quantity: quantity * 29.5735295625, unit: 'ml', warning: null }
  }

  const teaspoons = sourceUnit === 'tsp' ? quantity : sourceUnit === 'tbsp' ? quantity * 3 : null
  if (teaspoons !== null) {
    if (ingredient?.basis === 'per_100ml') {
      return { quantity: teaspoons * 4.92892159375, unit: 'ml', warning: null }
    }
    if (ingredient?.grams_per_tsp) {
      return { quantity: teaspoons * ingredient.grams_per_tsp, unit: 'g', warning: null }
    }
    return {
      quantity: null,
      unit: null,
      warning: 'This solid spoon measurement needs an ingredient-specific conversion.',
    }
  }

  if (sourceUnit === 'cup' && ingredient?.basis === 'per_100ml') {
    return { quantity: quantity * 236.5882365, unit: 'ml', warning: null }
  }

  return {
    quantity: null,
    unit: null,
    warning: 'A solid cup cannot be converted safely without an ingredient-specific measure.',
  }
}

export function normaliseSourceLine(
  original: string,
  ingredient?: Ingredient,
): NormalisedSourceLine {
  const { quantity, rest, range } = readQuantity(original)
  const { unit, rest: ingredientPart } = readUnit(rest)
  const converted = convert(quantity, unit, ingredient)

  return {
    original,
    ingredientText: cleanIngredientText(ingredientPart),
    sourceQuantity: quantity,
    sourceUnit: unit,
    quantity: range ? null : converted.quantity,
    unit: range ? null : converted.unit,
    warning: range
      ? 'Quantity ranges need review; choose the amount you intend to use.'
      : converted.warning,
  }
}
