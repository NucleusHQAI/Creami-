import { describeBaseLine } from '@/features/recipes/ingredient-display'
import type { BaseWithIngredients } from '@/types/domain'

export interface BaseSelectFieldProps {
  bases: BaseWithIngredients[]
  value: string
  onChange: (baseId: string) => void
  showChangeWarning: boolean
  error?: string
}

/** The base select, plus its ingredient preview and the "macros will move" warning on change (docs/05 § The editor field table). */
export function BaseSelectField({ bases, value, onChange, showChangeWarning, error }: BaseSelectFieldProps) {
  const selected = bases.find((base) => base.id === value)
  const previewLines = selected
    ? [...selected.ingredients]
        .filter((line) => line.ingredient_id !== selected.fill_ingredient_id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((line) => describeBaseLine(line, 1))
    : []

  return (
    <div className="space-y-2">
      <label className="block text-[13px] text-muted" htmlFor="base-select">
        Base
      </label>
      <select
        id="base-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
      >
        <option value="">Choose a base…</option>
        {bases.map((base) => (
          <option key={base.id} value={base.id}>
            {base.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-[13px] text-berry">
          {error}
        </p>
      )}

      {showChangeWarning && (
        <p className="rounded-soft bg-berry/10 px-3 py-2 text-[13px] text-berrydk">
          Changing the base will change this recipe's macros.
        </p>
      )}

      {selected && (
        <div className="rounded-soft border border-line bg-paper p-3">
          {selected.summary && <p className="mb-1 text-[13px] text-muted">{selected.summary}</p>}
          <ul className="divide-y divide-line">
            {previewLines.map((line) => (
              <li key={line.id} className="flex items-center justify-between py-1.5 text-[13px]">
                <span className="text-ink">{line.label}</span>
                <span className="font-mono text-muted">{line.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
