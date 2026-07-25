import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Inbox } from 'lucide-react'
import { RecipeCard } from '@/features/recipes/components/RecipeCard'
import { RecipeCardSkeleton } from '@/features/recipes/components/RecipeCardSkeleton'
import {
  RecipeFilterChips,
  type FilterChipValue,
} from '@/features/recipes/components/RecipeFilterChips'
import { RecipeSortControl } from '@/features/recipes/components/RecipeSortControl'
import { useRecipes } from '@/features/recipes/hooks/useRecipes'
import { useToggleFavourite } from '@/features/recipes/hooks/useToggleFavourite'
import { useDebouncedValue } from '@/features/recipes/hooks/useDebouncedValue'
import { useSortPreference } from '@/features/recipes/hooks/useSortPreference'
import { useCategories } from '@/features/reference/hooks/useCategories'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { ReadyBanner } from '@/features/freezer/components/ReadyBanner'

export default function RecipeListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(searchInput, 150)
  const [chip, setChip] = useState<FilterChipValue>('all')
  const [sort, setSort] = useSortPreference()

  const { data: categories } = useCategories()
  const toggleFavourite = useToggleFavourite()

  const filters = {
    search: debouncedSearch,
    categoryKey: chip === 'all' || chip === 'favourites' ? null : chip,
    favouritesOnly: chip === 'favourites',
    sort,
  }

  const { items, isLoading, isError, refetch } = useRecipes(filters)
  const hasActiveFilters = Boolean(debouncedSearch) || chip !== 'all'

  function handleSearchChange(next: string) {
    setSearchInput(next)
    setSearchParams(
      (params) => {
        if (next) {
          params.set('q', next)
        } else {
          params.delete('q')
        }
        return params
      },
      { replace: true },
    )
  }

  function clearFilters() {
    handleSearchChange('')
    setChip('all')
  }

  return (
    <div className="space-y-6">
      {/* Ready-to-spin banner — docs/05 § Recipe list item 1 / Task 28. */}
      <ReadyBanner />

      <div className="sticky top-0 z-20 -mx-4 space-y-4 bg-cream/95 px-4 pb-3 pt-1 backdrop-blur sm:mx-0 sm:px-0 md:top-16">
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search flavours, e.g. pistachio or coffee"
            aria-label="Search recipes"
            className="h-12 w-full rounded-pill border border-line bg-paper pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2"
          />
        </div>

        <RecipeFilterChips categories={categories ?? []} value={chip} onChange={setChip} />

        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-muted">
            {isLoading
              ? 'Loading…'
              : `${items?.length ?? 0} recipe${items?.length === 1 ? '' : 's'}`}
          </p>
          <RecipeSortControl value={sort} onChange={setSort} />
        </div>
      </div>

      {isError && <ErrorState message="Couldn't load recipes." onRetry={refetch} />}

      {!isError && isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1100px]:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <RecipeCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isError && !isLoading && items && items.length === 0 && (
        <EmptyState
          icon={debouncedSearch ? Search : Inbox}
          title={debouncedSearch ? `No flavours match "${debouncedSearch}"` : 'No recipes yet'}
          message={
            hasActiveFilters
              ? 'Try a different search term, or clear the filters.'
              : 'Recipes you add will show up here.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {!isError && !isLoading && items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1100px]:grid-cols-3">
          {items.map(({ recipe, kcal, proteinG }) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              kcal={kcal}
              proteinG={proteinG}
              onToggleFavourite={(id) => toggleFavourite.mutate({ id, next: !recipe.is_favourite })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
