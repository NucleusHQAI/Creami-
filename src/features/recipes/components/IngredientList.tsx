import type { ReactNode } from 'react'
import type { IngredientLineDisplay } from '@/features/recipes/ingredient-display'

export interface IngredientListProps {
  lines: IngredientLineDisplay[]
  /** Present only for sections with optional lines (mix-ins) — lets a line be toggled out of the macro calculation. */
  onToggleOptional?: (id: string) => void
  excludedIds?: ReadonlySet<string>
  /** An extra `<li>`-shaped row appended after the mapped lines — the base section's derived milk line. */
  after?: ReactNode
}

export function IngredientList({ lines, onToggleOptional, excludedIds, after }: IngredientListProps) {
  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => {
        const excluded = excludedIds?.has(line.id) ?? false
        return (
          <li
            key={line.id}
            className={`flex items-center justify-between gap-3 py-2.5 text-[15px] ${excluded ? 'opacity-50' : ''}`}
          >
            <span className="flex items-center gap-2 text-ink">
              {line.label}
              {line.isFreeText && (
                <span className="rounded-pill bg-line/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  Note
                </span>
              )}
            </span>
            <span className="flex items-center gap-3">
              {line.quantity && (
                <span className="font-mono text-[13px] text-muted">{line.quantity}</span>
              )}
              {line.optional && onToggleOptional && (
                <label className="flex items-center gap-1.5 text-[12px] text-muted">
                  <input
                    type="checkbox"
                    checked={!excluded}
                    onChange={() => onToggleOptional(line.id)}
                    className="h-4 w-4 rounded border-line text-berry focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry"
                  />
                  Include
                </label>
              )}
            </span>
          </li>
        )
      })}
      {after}
    </ul>
  )
}
