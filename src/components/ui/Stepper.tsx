import { Minus, Plus } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'

export interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
}

export function Stepper({ value, onChange, min = 0, max = 99, step = 1, label }: StepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <IconButton
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="h-9 w-9"
      >
        <Minus size={16} aria-hidden="true" />
      </IconButton>
      <span
        role="status"
        aria-live="polite"
        className="w-8 text-center font-mono text-[15px] text-ink"
      >
        {value}
      </span>
      <IconButton
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="h-9 w-9"
      >
        <Plus size={16} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
