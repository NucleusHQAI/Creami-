import { toGrams } from '@/lib/units'
import type { Ingredient, MacroLine, MacroSettings, Macros, MacroResult } from '@/lib/macros/types'

const ZERO_MACROS: Macros = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }

function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
  }
}

function scaleMacros(macros: Macros, factor: number): Macros {
  return {
    kcal: macros.kcal * factor,
    protein_g: macros.protein_g * factor,
    carbs_g: macros.carbs_g * factor,
    fat_g: macros.fat_g * factor,
  }
}

interface ResolvedLine {
  ingredient: Ingredient
  quantity: number
  unit: 'g' | 'ml' | 'item'
}

function macrosFor(line: ResolvedLine): Macros {
  const { ingredient, quantity, unit } = line

  if (ingredient.negligible) {
    return ZERO_MACROS
  }

  let factor: number
  if (ingredient.basis === 'per_item') {
    factor =
      unit === 'item'
        ? quantity
        : ingredient.grams_per_item
          ? toGrams(quantity, unit, ingredient) / ingredient.grams_per_item
          : 0
  } else if (ingredient.basis === 'per_100ml') {
    factor = toGrams(quantity, unit, ingredient) / ingredient.density_g_per_ml / 100
  } else {
    factor = toGrams(quantity, unit, ingredient) / 100
  }

  return {
    kcal: ingredient.kcal * factor,
    protein_g: ingredient.protein_g * factor,
    carbs_g: ingredient.carbs_g * factor,
    fat_g: ingredient.fat_g * factor,
  }
}

export interface CalculateMacrosInput {
  baseLines: MacroLine[]
  fillIngredientId: string
  recipeLines: MacroLine[]
  ingredients: Map<string, Ingredient>
  settings: MacroSettings
  scale?: number
  excludeOptional?: boolean
}

export function calculateMacros(input: CalculateMacrosInput): MacroResult {
  const { baseLines, fillIngredientId, recipeLines, ingredients, settings } = input
  const scale = input.scale ?? 1
  const excludeOptional = input.excludeOptional ?? false

  const warnings: string[] = []
  const excludedLines: string[] = []

  // 1. Collect lines — base ingredients excluding the fill ingredient's own
  // nominal row, plus recipe additions and mixins (dropping toggled-off
  // optionals if asked).
  const collected: MacroLine[] = [
    ...baseLines.filter((line) => line.ingredientId !== fillIngredientId),
    ...recipeLines.filter((line) => !(excludeOptional && line.optional)),
  ]

  // 2. Substitute the milk — anywhere the base's fill ingredient is
  // referenced directly, swap it for the configured default milk. Changing
  // the setting therefore recalculates every recipe.
  const substituted = collected.map((line) =>
    line.ingredientId === fillIngredientId
      ? { ...line, ingredientId: settings.defaultMilkIngredientId }
      : line,
  )

  // 3. Scale — every quantity, including item counts, scales by `scale`.
  const resolved: ResolvedLine[] = []
  for (const line of substituted) {
    if (line.ingredientId === null) {
      warnings.push('A line has no matched ingredient (free text) and contributes no macros.')
      continue
    }
    const ingredient = ingredients.get(line.ingredientId)
    if (!ingredient) {
      excludedLines.push(line.ingredientId)
      warnings.push(`Ingredient ${line.ingredientId} is missing from the ingredient map.`)
      continue
    }
    if (line.quantity === null || line.unit === null) {
      continue
    }
    resolved.push({ ingredient, quantity: line.quantity * scale, unit: line.unit })
  }

  // 4. Occupied volume — sum the volume of every line that counts toward it.
  let occupiedVolumeMl = 0
  for (const line of resolved) {
    if (line.ingredient.counts_toward_volume) {
      const grams = toGrams(line.quantity, line.unit, line.ingredient)
      occupiedVolumeMl += grams / line.ingredient.density_g_per_ml
    }
  }

  // 5. Derived fill — top up to MAX FILL with the default milk.
  const targetFillMl = settings.maxFillMl * scale
  const rawFillMl = targetFillMl - occupiedVolumeMl
  const overflows = rawFillMl <= 0
  const fillVolumeMl = Math.max(0, rawFillMl)

  // 6. Total — every resolved line, plus the derived fill milk.
  let total = resolved.reduce((acc, line) => addMacros(acc, macrosFor(line)), ZERO_MACROS)

  const milkIngredient = settings.defaultMilkIngredientId
    ? ingredients.get(settings.defaultMilkIngredientId)
    : undefined
  if (fillVolumeMl > 0) {
    if (milkIngredient) {
      total = addMacros(
        total,
        macrosFor({ ingredient: milkIngredient, quantity: fillVolumeMl, unit: 'ml' }),
      )
    } else {
      warnings.push('No default milk ingredient configured — derived fill contributes no macros.')
    }
  }

  // 7. Per serving — a serving is a fixed real-world portion, so dividing by
  // (servings × scale) normalises the scale back out of the per-tub total.
  const servingsDivisor = settings.servingsPerTub * scale
  const perServing =
    servingsDivisor > 0 ? scaleMacros(total, 1 / servingsDivisor) : ZERO_MACROS

  // Round once, at the very end, for display only.
  const round = (value: number, decimals: number) => {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
  }
  const roundMacros = (macros: Macros): Macros => ({
    kcal: round(macros.kcal, 0),
    protein_g: round(macros.protein_g, 1),
    carbs_g: round(macros.carbs_g, 1),
    fat_g: round(macros.fat_g, 1),
  })

  // The derived fill is kept to one decimal place rather than the "whole
  // millilitres" display rule in docs/04-macro-engine.md's Rounding section —
  // that rule is for the recipe-detail annotation ("393ml"), not this value.
  // The golden vectors (e.g. 393.4, and 196.7 at scale 0.5) are only
  // reproducible at one decimal of precision.
  return {
    perTub: roundMacros(total),
    perServing: roundMacros(perServing),
    fillVolumeMl: round(fillVolumeMl, 1),
    occupiedVolumeMl: round(occupiedVolumeMl, 1),
    overflows,
    excludedLines,
    warnings,
  }
}
