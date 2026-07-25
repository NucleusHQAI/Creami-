import { Link } from 'react-router-dom'
import { ArrowRight, Snowflake } from 'lucide-react'
import { useActiveBatches } from '@/features/freezer/hooks/useActiveBatches'
import { deriveBatchStatus } from '@/lib/freezer-status'

/**
 * "2 tubs ready to spin — Cinnamon Roll, Mango Lassi →". Self-contained and
 * no-prop by design, so the recipe list page can drop it in without wiring
 * anything up. Absent entirely when nothing is ready.
 */
export function ReadyBanner() {
  const { data: batches } = useActiveBatches()

  if (!batches) return null

  const now = new Date()
  const ready = batches.filter((batch) => deriveBatchStatus(batch, now) === 'ready')

  if (ready.length === 0) return null

  const names = ready.map((batch) => batch.recipe?.name).filter((name): name is string => Boolean(name))

  return (
    <Link
      to="/freezer"
      className="flex items-center justify-between gap-3 rounded-panel border border-berry/30 bg-berry/10 px-4 py-3 text-berrydk transition-colors motion-safe:duration-150 hover:bg-berry/15"
    >
      <span className="inline-flex items-center gap-2 text-[14px]">
        <Snowflake size={16} aria-hidden="true" />
        <span className="font-medium">
          {ready.length} {ready.length === 1 ? 'tub' : 'tubs'} ready to spin
        </span>
        {names.length > 0 && <span className="text-berrydk/80">— {names.join(', ')}</span>}
      </span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  )
}
