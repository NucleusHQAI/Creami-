import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useActiveBatches } from '@/features/freezer/hooks/useActiveBatches'
import { ReadySection } from '@/features/freezer/components/ReadySection'
import { FreezingSection } from '@/features/freezer/components/FreezingSection'
import { SpunSection } from '@/features/freezer/components/SpunSection'
import { HistorySection } from '@/features/freezer/components/HistorySection'
import { RecipePickerSheet } from '@/features/freezer/components/RecipePickerSheet'
import { LogBatchSheet } from '@/features/freezer/components/LogBatchSheet'
import { groupActiveBatches } from '@/lib/freezer-status'
import type { RecipeOption } from '@/lib/api/batches'

const COUNTDOWN_REFRESH_MS = 60_000

function FreezerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export default function FreezerPage() {
  const { data: batches, isLoading, isError, refetch } = useActiveBatches()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), COUNTDOWN_REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeOption | null>(null)

  const groups = useMemo(() => groupActiveBatches(batches ?? [], now), [batches, now])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-[-0.03em] text-ink">Freezer</h1>
      </header>

      {isLoading && <FreezerSkeleton />}

      {isError && <ErrorState message="Could not load the freezer." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {groups.ready.length === 0 && groups.freezing.length === 0 && groups.spun.length === 0 ? (
            <EmptyState
              icon={Snowflake}
              title="Nothing freezing right now"
              message="Log a batch from a recipe, or start one from here."
              action={
                <Link to="/">
                  <Button variant="secondary">Browse recipes</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-8">
              {groups.ready.length > 0 && <ReadySection batches={groups.ready} now={now} />}
              {groups.freezing.length > 0 && <FreezingSection batches={groups.freezing} now={now} />}
              {groups.spun.length > 0 && <SpunSection batches={groups.spun} />}
            </div>
          )}

          <HistorySection />
        </>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="Log a batch"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-pill bg-ink text-cream shadow-lift transition-transform motion-safe:duration-150 motion-safe:active:scale-95 sm:bottom-8 sm:right-8"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      <RecipePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipe) => {
          setSelectedRecipe(recipe)
          setPickerOpen(false)
        }}
      />

      {selectedRecipe && (
        <LogBatchSheet
          recipeId={selectedRecipe.id}
          recipeName={selectedRecipe.name}
          open
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}
