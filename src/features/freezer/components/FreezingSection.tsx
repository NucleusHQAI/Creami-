import { Card } from '@/components/ui/Card'
import { formatCountdown } from '@/lib/freezer-status'
import type { BatchWithRecipe } from '@/lib/api/batches'

export interface FreezingSectionProps {
  batches: BatchWithRecipe[]
  now: Date
}

/** Everything not yet at ready_at, soonest first, with a live countdown. */
export function FreezingSection({ batches, now }: FreezingSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl tracking-[-0.025em] text-ink">Freezing</h2>
      <div className="space-y-2">
        {batches.map((batch) => (
          <Card key={batch.id} className="flex items-center justify-between p-4">
            <p className="font-display text-lg text-ink">{batch.recipe?.name ?? 'Recipe'}</p>
            <p className="font-mono text-[13px] text-muted">
              {formatCountdown(new Date(batch.ready_at), now)}
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}
