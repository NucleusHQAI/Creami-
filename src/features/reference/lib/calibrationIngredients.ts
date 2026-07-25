// Pure — no React. Works out which four ingredients the calibration prompt's
// "Show me those four →" shortcut should surface: the protein powder,
// yoghurt, quark and milk actually used across the seeded bases and the
// current default-milk setting — not a hardcoded slug list, so it still
// makes sense after someone edits the library.

import type { AppSettings, BaseWithIngredients } from '@/types/domain'

export function findCalibrationIngredientIds(
  bases: BaseWithIngredients[],
  settings: AppSettings | undefined,
): Set<string> {
  const lines = bases
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((base) => base.ingredients)

  const proteinId = lines.find((line) => line.ingredient.category === 'protein')?.ingredient.id
  const yoghurtId = lines.find((line) => /yoghurt/i.test(line.ingredient.name))?.ingredient.id
  const quarkId = lines.find((line) => /quark/i.test(line.ingredient.name))?.ingredient.id
  const milkId =
    settings?.default_milk_ingredient_id ??
    lines.find((line) => line.ingredient.category === 'dairy' && line.ingredient.basis === 'per_100ml')
      ?.ingredient.id

  return new Set([proteinId, yoghurtId, quarkId, milkId].filter((id): id is string => Boolean(id)))
}
