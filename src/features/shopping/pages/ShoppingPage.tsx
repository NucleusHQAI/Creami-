import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PlanSection } from '@/features/shopping/components/PlanSection'
import { ShoppingGroupSection } from '@/features/shopping/components/ShoppingGroupSection'
import { ExtrasSection } from '@/features/shopping/components/ExtrasSection'
import { ClearTicksButton } from '@/features/shopping/components/ClearTicksButton'
import { usePlan } from '@/features/shopping/hooks/usePlan'
import { useChecks, useSetCheck } from '@/features/shopping/hooks/useChecks'
import { useShoppingList } from '@/features/shopping/hooks/useShoppingList'

export default function ShoppingPage() {
  const [skipOptional, setSkipOptional] = useState(false)
  const { data: plan } = usePlan()
  const { groups, isLoading, isError, refetch } = useShoppingList(!skipOptional)
  const { data: checks } = useChecks()
  const setCheck = useSetCheck()

  const hasPlan = (plan?.length ?? 0) > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-[-0.03em] text-ink sm:text-[28px]">
          Shopping list
        </h1>
        <p className="mt-1 text-[13px] text-muted">Built from what you're planning to make.</p>
      </div>

      <PlanSection />

      {hasPlan && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Chip selected={skipOptional} onClick={() => setSkipOptional((value) => !value)}>
            Skip optional extras
          </Chip>
          <ClearTicksButton />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn't build your shopping list." onRetry={refetch} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={hasPlan ? 'Nothing left to buy' : 'Nothing to buy yet'}
          message={
            hasPlan
              ? "Everything for your planned recipes is either ticked off or hidden by \"Skip optional extras\"."
              : 'Add a recipe to your plan above and the list builds itself.'
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <ShoppingGroupSection
              key={group.key}
              group={group}
              checks={checks ?? {}}
              onToggle={(ingredientId) =>
                setCheck.mutate({ ingredientId, next: !(checks?.[ingredientId] ?? false) })
              }
            />
          ))}
        </div>
      )}

      <ExtrasSection />
    </div>
  )
}
