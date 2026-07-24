import type { ShoppingGroup } from '@/features/shopping/types'
import { ShoppingLineRow } from '@/features/shopping/components/ShoppingLineRow'

export interface ShoppingGroupSectionProps {
  group: ShoppingGroup
  checks: Record<string, boolean>
  onToggle: (ingredientId: string) => void
}

/** Ticked lines dim and sink to the bottom of their group, but are never removed — people un-tick things. */
export function ShoppingGroupSection({ group, checks, onToggle }: ShoppingGroupSectionProps) {
  const sortedLines = [...group.lines].sort((a, b) => {
    const aChecked = a.kind === 'ingredient' && (checks[a.ingredientId] ?? false)
    const bChecked = b.kind === 'ingredient' && (checks[b.ingredientId] ?? false)
    if (aChecked === bChecked) return 0
    return aChecked ? 1 : -1
  })

  return (
    <section aria-labelledby={`group-${group.key}`} className="space-y-1">
      <h3
        id={`group-${group.key}`}
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk"
      >
        {group.label}
      </h3>
      <ul>
        {sortedLines.map((line) => (
          <ShoppingLineRow
            key={line.kind === 'ingredient' ? line.ingredientId : line.id}
            line={line}
            checked={line.kind === 'ingredient' ? (checks[line.ingredientId] ?? false) : false}
            onToggle={() => {
              if (line.kind === 'ingredient') onToggle(line.ingredientId)
            }}
          />
        ))}
      </ul>
    </section>
  )
}
