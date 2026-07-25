import { Skeleton } from '@/components/ui/Skeleton'

/** Loading placeholder shaped like RecipeCard, so the grid doesn't jump when data arrives. */
export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-recipe border-2 border-ink bg-paper shadow-sticker">
      <div className="relative flex h-24 w-full items-center justify-center bg-line/30">
        <Skeleton className="h-12 w-12 rounded-pill" />
      </div>
      <div className="space-y-2 p-4 pt-3.5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}
