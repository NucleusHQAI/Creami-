import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Stepper } from '@/components/ui/Stepper'

export interface PlanChipProps {
  recipeName: string
  multiplier: number
  onMultiplierChange: (value: number) => void
  onRemove: () => void
}

export function PlanChip({ recipeName, multiplier, onMultiplierChange, onRemove }: PlanChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-pill border border-line bg-paper py-1.5 pl-4 pr-1.5">
      <span className="text-[13px] font-medium text-ink">{recipeName}</span>
      <span className="font-mono text-[13px] text-muted" aria-hidden="true">
        ×
      </span>
      <Stepper
        label={`${recipeName} tubs`}
        value={multiplier}
        onChange={onMultiplierChange}
        min={1}
        max={10}
      />
      <IconButton
        aria-label={`Remove ${recipeName} from the plan`}
        onClick={onRemove}
        className="h-8 w-8"
      >
        <X size={14} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
