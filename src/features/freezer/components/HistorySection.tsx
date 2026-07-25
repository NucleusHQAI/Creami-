import { useState } from 'react'
import { ChevronDown, History as HistoryIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { RatingStars } from '@/components/ui/RatingStars'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBatchHistory } from '@/features/freezer/hooks/useBatchHistory'

/** Collapsed by default — finished batches, most recent first, with the rating if one was given. */
export function HistorySection() {
  const [open, setOpen] = useState(false)
  const { data: batches, isLoading, isError, refetch } = useBatchHistory(open)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-soft border border-line bg-paper px-4 text-left text-[15px] font-medium text-ink"
      >
        <span className="inline-flex items-center gap-2">
          <HistoryIcon size={16} aria-hidden="true" className="text-muted" />
          History
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`text-muted transition-transform motion-safe:duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}

          {isError && <ErrorState message="Could not load history." onRetry={() => refetch()} />}

          {!isLoading && !isError && batches?.length === 0 && (
            <p className="px-1 text-[13px] text-muted">Nothing finished yet.</p>
          )}

          {!isLoading &&
            !isError &&
            batches?.map((batch) => {
              const rating = batch.tasting_notes.find((note) => note.rating !== null)?.rating
              return (
                <Card key={batch.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-display text-lg text-ink">{batch.recipe?.name ?? 'Recipe'}</p>
                    {batch.finished_at && (
                      <p className="text-[13px] text-muted">
                        Finished {format(new Date(batch.finished_at), 'd MMMM yyyy')}
                      </p>
                    )}
                  </div>
                  {rating != null && <RatingStars value={rating} size={14} />}
                </Card>
              )
            })}
        </div>
      )}
    </section>
  )
}
