import { Pill } from '@/components/ui/Pill'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRecipeBatches } from '@/features/freezer/hooks/useRecipeBatches'
import { computeMedian, computeMode, hasEnoughData } from '@/lib/batch-insights'

export interface RecipeInsightsProps {
  recipeId: string
}

/**
 * "Made 4 times" / "Usually needs 1 re-spin" / "Typically 20ml of milk".
 * Self-contained — fetches its own data — so it can be dropped into the
 * recipe detail page. Shows nothing below the three-batch threshold rather
 * than a misleading average of one, and nothing at all when the recipe has
 * never been made.
 */
export function RecipeInsights({ recipeId }: RecipeInsightsProps) {
  const { data: batches, isLoading, isError, error } = useRecipeBatches(recipeId)

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-32" />
      </div>
    )
  }

  if (isError) {
    // Auxiliary widget — dropping it silently is the right call visually, but
    // the failure still needs to be logged rather than swallowed outright.
    console.error(`Couldn't load batch insights for recipe ${recipeId}`, error)
    return null
  }

  if (!batches || !hasEnoughData(batches.length)) {
    return null
  }

  const spunBatches = batches.filter((batch) => batch.spun_at !== null)
  const respinCounts = spunBatches.map((batch) => batch.respin_count)
  const milkValues = batches
    .filter((batch) => batch.added_milk_ml !== null)
    .map((batch) => batch.added_milk_ml as number)

  const modalRespins = hasEnoughData(respinCounts.length) ? computeMode(respinCounts) : null
  const medianMilk = hasEnoughData(milkValues.length) ? computeMedian(milkValues) : null

  return (
    <div className="flex flex-wrap gap-2">
      <Pill>Made {batches.length} {batches.length === 1 ? 'time' : 'times'}</Pill>
      {modalRespins !== null && (
        <Pill>
          Usually needs {modalRespins} {modalRespins === 1 ? 're-spin' : 're-spins'}
        </Pill>
      )}
      {medianMilk !== null && <Pill>Typically {Math.round(medianMilk)}ml of milk</Pill>}
    </div>
  )
}
