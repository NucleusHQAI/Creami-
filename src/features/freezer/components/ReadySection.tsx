import { useState } from 'react'
import { Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { formatFrozenAgo } from '@/lib/freezer-status'
import { MarkSpunSheet } from '@/features/freezer/components/MarkSpunSheet'
import type { BatchWithRecipe } from '@/lib/api/batches'

export interface ReadySectionProps {
  batches: BatchWithRecipe[]
  now: Date
}

/** The reason the freezer screen exists — prominent, berry-accented cards. */
export function ReadySection({ batches, now }: ReadySectionProps) {
  const [spunTarget, setSpunTarget] = useState<BatchWithRecipe | null>(null)

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl tracking-[-0.025em] text-berrydk">Ready to spin</h2>
      <div className="space-y-3">
        {batches.map((batch) => (
          <Card key={batch.id} className="space-y-3 border-berry/30 bg-berry/5 p-5">
            <div className="flex items-center gap-2">
              <Snowflake size={16} className="text-berry" aria-hidden="true" />
              <Pill className="bg-berry/15 text-berrydk">Ready</Pill>
            </div>
            <p className="font-display text-2xl tracking-[-0.025em] text-ink">
              {batch.recipe?.name ?? 'Recipe'}
            </p>
            <p className="text-[13px] text-muted">
              {formatFrozenAgo(new Date(batch.frozen_at), now)}
            </p>
            <Button className="w-full sm:w-auto" onClick={() => setSpunTarget(batch)}>
              Mark as spun
            </Button>
          </Card>
        ))}
      </div>

      {spunTarget && (
        <MarkSpunSheet
          batchId={spunTarget.id}
          recipeName={spunTarget.recipe?.name ?? 'this batch'}
          open
          onClose={() => setSpunTarget(null)}
        />
      )}
    </section>
  )
}
