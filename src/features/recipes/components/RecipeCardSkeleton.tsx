import { Skeleton } from '@/components/ui/Skeleton'

/** Loading placeholder shaped like RecipeCard, so the grid doesn't jump when data arrives. */
export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-recipe border border-line bg-paper">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-20 rounded-pill" />
          <Skeleton className="h-6 w-16 rounded-pill" />
        </div>
      </div>
    </div>
  )
}
