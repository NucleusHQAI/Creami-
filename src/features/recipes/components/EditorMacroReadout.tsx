import type { MacroResult } from '@/lib/macros/types'

export interface EditorMacroReadoutProps {
  macros: MacroResult | undefined
}

/** Pinned to the bottom of the editor, recalculating on every change (docs/05 § The ingredient line editor). */
export function EditorMacroReadout({ macros }: EditorMacroReadoutProps) {
  const liveSummary = macros
    ? `${Math.round(macros.perTub.kcal)} kcal ${Math.round(macros.perTub.protein_g)}g protein ${Math.round(macros.perTub.carbs_g)}g carbs ${Math.round(macros.perTub.fat_g)}g fat`
    : 'Choose a base to see macros'

  return (
    <div
      className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-4 rounded-panel border border-line bg-ink px-4 py-3 text-cream shadow-lift md:bottom-4"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-cream/70">Per tub, live</span>
      {macros ? (
        <span className="flex gap-4 font-mono text-[14px]">
          <span>{Math.round(macros.perTub.kcal)} kcal</span>
          <span>{Math.round(macros.perTub.protein_g)}g protein</span>
          <span>{Math.round(macros.perTub.carbs_g)}g carbs</span>
          <span>{Math.round(macros.perTub.fat_g)}g fat</span>
        </span>
      ) : (
        <span className="font-mono text-[13px] text-cream/70">Choose a base to see macros</span>
      )}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveSummary}
      </span>
    </div>
  )
}
