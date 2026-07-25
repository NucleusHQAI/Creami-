import type { Unit } from '@/lib/macros/types'

export interface QuantityInputProps {
  quantity: number | null
  unit: Unit | null
  onQuantityChange: (quantity: number | null) => void
  onUnitChange: (unit: Unit) => void
  gramsPerTsp?: number | null
  id?: string
}

const UNIT_OPTIONS: Unit[] = ['g', 'ml', 'item']

export function QuantityInput({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  gramsPerTsp,
  id,
}: QuantityInputProps) {
  const tsp =
    unit === 'g' && gramsPerTsp && quantity !== null ? quantity / gramsPerTsp : null

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={quantity ?? ''}
          onChange={(event) => {
            const raw = event.target.value
            onQuantityChange(raw === '' ? null : Number(raw))
          }}
          className="h-11 w-24 rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
        />
        <select
          value={unit ?? 'g'}
          onChange={(event) => onUnitChange(event.target.value as Unit)}
          className="h-11 rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
          aria-label="Unit"
        >
          {UNIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {tsp !== null && <p className="text-[13px] text-muted">≈ {tsp.toFixed(2)} tsp</p>}
    </div>
  )
}
