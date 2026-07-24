import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAddToPlan } from '@/features/shopping/hooks/useAddToPlan'
import { useRemoveFromPlan } from '@/features/shopping/hooks/usePlan'
import { useRecipeOptions } from '@/features/shopping/hooks/useRecipeOptions'

export interface AddRecipesSheetProps {
  open: boolean
  onClose: () => void
  plannedRecipeIds: Set<string>
}

export function AddRecipesSheet({ open, onClose, plannedRecipeIds }: AddRecipesSheetProps) {
  const [search, setSearch] = useState('')
  const { data: options, isLoading, isError, refetch } = useRecipeOptions()
  const addToPlan = useAddToPlan()
  const removeFromPlan = useRemoveFromPlan()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = options ?? []
    if (!term) return list
    return list.filter((option) => option.name.toLowerCase().includes(term))
  }, [options, search])

  function toggle(recipeId: string) {
    if (plannedRecipeIds.has(recipeId)) {
      removeFromPlan.mutate(recipeId)
    } else {
      addToPlan.mutate(recipeId)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add recipes">
      <div className="space-y-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recipes"
            aria-label="Search recipes"
            className="h-11 w-full rounded-soft border border-line bg-cream pl-9 pr-3 text-[15px] text-ink focus-visible:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load your recipes." onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No recipes match" message="Try a different search term." />
        ) : (
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {filtered.map((option) => {
              const selected = plannedRecipeIds.has(option.id)
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(option.id)}
                    className={`flex w-full items-center justify-between rounded-soft border px-4 py-3 text-left text-[15px] transition-colors motion-safe:duration-150 ${
                      selected
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-paper text-ink hover:bg-cream'
                    }`}
                  >
                    <span>{option.name}</span>
                    {selected && <Check size={16} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
