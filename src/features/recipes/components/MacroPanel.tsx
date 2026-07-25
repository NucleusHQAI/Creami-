import { Fragment } from 'react'
import type { MacroResult } from '@/lib/macros/types'

export interface MacroPanelProps {
  macros: MacroResult | undefined
  overrideKcal: number | null
  overrideProteinG: number | null
  scale: number
  servingsPerTub: number
  scaleLabel: string
}

function round(value: number): number {
  return Math.round(value)
}

/** The override, scaled, when set; otherwise the engine's computed figure. */
function applyOverride(
  computed: number | undefined,
  override: number | null,
  scale: number,
): number | undefined {
  return override !== null ? override * scale : computed
}

/**
 * Section 3 of the recipe detail page: per-tub and per-serving macros, all
 * four figures, with the estimate caveat and a live region announcing
 * recalculation on scale change (docs/05 § Scaling / § Recipe detail).
 * `macro_override_kcal`/`macro_override_protein_g`, when set, replace the
 * computed figure — scaled the same as everything else, since they're
 * entered against a full tub.
 */
export function MacroPanel({
  macros,
  overrideKcal,
  overrideProteinG,
  scale,
  servingsPerTub,
  scaleLabel,
}: MacroPanelProps) {
  const kcalOverridden = overrideKcal !== null
  const proteinOverridden = overrideProteinG !== null

  const perTubKcal = applyOverride(macros?.perTub.kcal, overrideKcal, scale)
  const perTubProtein = applyOverride(macros?.perTub.protein_g, overrideProteinG, scale)
  const perTubCarbs = macros?.perTub.carbs_g
  const perTubFat = macros?.perTub.fat_g

  const perServingKcal =
    kcalOverridden && perTubKcal !== undefined ? perTubKcal / servingsPerTub : macros?.perServing.kcal
  const perServingProtein =
    proteinOverridden && perTubProtein !== undefined
      ? perTubProtein / servingsPerTub
      : macros?.perServing.protein_g
  const perServingCarbs = macros?.perServing.carbs_g
  const perServingFat = macros?.perServing.fat_g

  const rows: Array<{
    label: string
    perTub: number | undefined
    perServing: number | undefined
    unit: string
    overridden: boolean
  }> = [
    { label: 'Calories', perTub: perTubKcal, perServing: perServingKcal, unit: 'kcal', overridden: kcalOverridden },
    { label: 'Protein', perTub: perTubProtein, perServing: perServingProtein, unit: 'g', overridden: proteinOverridden },
    { label: 'Carbs', perTub: perTubCarbs, perServing: perServingCarbs, unit: 'g', overridden: false },
    { label: 'Fat', perTub: perTubFat, perServing: perServingFat, unit: 'g', overridden: false },
  ]

  const liveSummary =
    perTubKcal !== undefined && perTubProtein !== undefined
      ? `Recalculated for ${scaleLabel}: ${round(perTubKcal)} kcal and ${round(perTubProtein)}g protein per tub.`
      : ''

  return (
    <section aria-labelledby="macro-panel-heading" className="rounded-panel border border-line bg-paper p-4">
      <h2 id="macro-panel-heading" className="font-display text-xl tracking-[-0.025em] text-ink">
        Macros
      </h2>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
        <span className="text-muted">Per tub / serving</span>
        <span className="text-right font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Tub</span>
        <span className="text-right font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Serving</span>
        {rows.map((row) => (
          <Fragment key={row.label}>
            <span className="py-1 text-ink">
              {row.label}
              {row.overridden && (
                <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-berrydk">
                  by hand
                </span>
              )}
            </span>
            <span className="py-1 text-right font-mono text-ink">
              {row.perTub !== undefined
                ? `${round(row.perTub)}${row.unit === 'kcal' ? ' kcal' : 'g'}`
                : '—'}
            </span>
            <span className="py-1 text-right font-mono text-ink">
              {row.perServing !== undefined
                ? `${round(row.perServing)}${row.unit === 'kcal' ? ' kcal' : 'g'}`
                : '—'}
            </span>
          </Fragment>
        ))}
      </div>

      <p className="mt-3 text-[12px] text-muted">
        Estimated from ingredient data — brands and mix-ins vary, so treat this as a guide rather
        than a measurement.
      </p>

      <p aria-live="polite" className="sr-only">
        {liveSummary}
      </p>
    </section>
  )
}
