import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useClearChecks } from '@/features/shopping/hooks/useChecks'

/** Clears ticks only, never the plan — confirms first, since it's annoying to redo. */
export function ClearTicksButton() {
  const [confirming, setConfirming] = useState(false)
  const clearChecks = useClearChecks()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-muted">Clear every tick?</span>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            clearChecks.mutate()
            setConfirming(false)
          }}
        >
          Clear ticks
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
      <RotateCcw size={16} aria-hidden="true" />
      Clear ticks
    </Button>
  )
}
