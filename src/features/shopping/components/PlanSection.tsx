import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PlanChip } from '@/features/shopping/components/PlanChip'
import { AddRecipesSheet } from '@/features/shopping/components/AddRecipesSheet'
import { usePlan, useRemoveFromPlan, useSetPlanMultiplier } from '@/features/shopping/hooks/usePlan'

export function PlanSection() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: plan, isLoading, isError, refetch } = usePlan()
  const removeFromPlan = useRemoveFromPlan()
  const setMultiplier = useSetPlanMultiplier()

  const heading = (
    <h2 id="plan-heading" className="font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk">
      Making next
    </h2>
  )

  if (isLoading) {
    return (
      <section aria-labelledby="plan-heading" className="space-y-3">
        {heading}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-pill" />
          <Skeleton className="h-10 w-36 rounded-pill" />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section aria-labelledby="plan-heading" className="space-y-3">
        {heading}
        <ErrorState message="Couldn't load your plan." onRetry={() => refetch()} />
      </section>
    )
  }

  const items = plan ?? []
  const plannedRecipeIds = new Set(items.map((item) => item.recipe_id))

  return (
    <section aria-labelledby="plan-heading" className="space-y-3">
      {heading}
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <PlanChip
            key={item.id}
            recipeName={item.recipe.name}
            multiplier={item.multiplier}
            onMultiplierChange={(value) =>
              setMultiplier.mutate({ recipeId: item.recipe_id, multiplier: value })
            }
            onRemove={() => removeFromPlan.mutate(item.recipe_id)}
          />
        ))}
        <Button variant="secondary" size="sm" onClick={() => setSheetOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Add recipes
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-[13px] text-muted">Nothing planned yet — add a recipe to build your list.</p>
      )}
      <AddRecipesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        plannedRecipeIds={plannedRecipeIds}
      />
    </section>
  )
}
