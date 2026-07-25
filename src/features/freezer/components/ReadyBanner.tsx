import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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

  const names = ready
    .map((batch) => batch.recipe?.name)
    .filter((name): name is string => Boolean(name))

  return (
    <Link
      to="/freezer"
      className="group mt-4 flex min-h-11 items-center justify-between gap-3 text-berrydk"
    >
      <span className="inline-flex items-center gap-2.5 text-[15px]">
        <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-berry" />
        <span className="font-medium">
          {ready.length} {ready.length === 1 ? 'tub' : 'tubs'} ready to spin
        </span>
        {names.length > 0 && (
          <span className="hidden text-berrydk/75 sm:inline">— {names.join(', ')}</span>
        )}
      </span>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="transition-transform motion-safe:duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  )
}
