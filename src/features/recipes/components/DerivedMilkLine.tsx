import { formatQuantity } from '@/lib/units'

export interface DerivedMilkLineProps {
  milkName: string
  fillVolumeMl: number
  targetFillMl: number
  maxFillMl: number
  isFullTub: boolean
  overflows: boolean
}

/**
 * The point of the recipe detail screen (docs/05 § The derived milk line):
 * milk topped up to the freezer-fill line, shown as a real ingredient with its
 * annotation. Moves whenever the recipe or the fill setting changes.
 */
export function DerivedMilkLine({
  milkName,
  fillVolumeMl,
  targetFillMl,
  maxFillMl,
  isFullTub,
  overflows,
}: DerivedMilkLineProps) {
  const annotation = overflows
    ? `base mixture is already over your ${formatQuantity(targetFillMl, 'ml')} freezer fill line before topping up — nothing left to add`
    : isFullTub
      ? `topped up to your ${formatQuantity(maxFillMl, 'ml')} freezer fill line; mix-ins are added afterwards`
      : `topped up to ${formatQuantity(targetFillMl, 'ml')} — this recipe's share of your ${formatQuantity(maxFillMl, 'ml')} freezer fill line`

  return (
    <li className="py-2.5 text-[15px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink">{milkName}</span>
        <span className="font-mono text-[13px] text-muted">
          {formatQuantity(fillVolumeMl, 'ml')}
        </span>
      </div>
      <p className="mt-0.5 pl-3 text-[12px] text-muted">↳ {annotation}</p>
    </li>
  )
}
