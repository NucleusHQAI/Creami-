import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Inbox, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReadyBanner } from '@/features/freezer/components/ReadyBanner'
import { RecipeCard } from '@/features/recipes/components/RecipeCard'
import { RecipeCardSkeleton } from '@/features/recipes/components/RecipeCardSkeleton'
import {
  RecipeFilterChips,
  type FilterChipValue,
} from '@/features/recipes/components/RecipeFilterChips'
import { RecipeSortControl } from '@/features/recipes/components/RecipeSortControl'
import { useDebouncedValue } from '@/features/recipes/hooks/useDebouncedValue'
import { useRecipes } from '@/features/recipes/hooks/useRecipes'
import { useSortPreference } from '@/features/recipes/hooks/useSortPreference'
import { useToggleFavourite } from '@/features/recipes/hooks/useToggleFavourite'
import { useCategories } from '@/features/reference/hooks/useCategories'

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
  const featuredItem = items?.[0]
  const remainingItems = items?.slice(1) ?? []

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
    <div>
      <header className="relative">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-berrydk">
          CREAMi Deluxe
        </p>
        <h1 className="mt-3 font-display text-[clamp(54px,16vw,84px)] font-normal leading-[0.9] tracking-[-0.06em] text-ink">
          Recipes
        </h1>
        <div className="absolute right-0 top-0">
          <RecipeSortControl value={sort} onChange={setSort} />
        </div>
      </header>

      <ReadyBanner />

      <div className="mt-4 space-y-2">
        <div className="relative">
          <Search
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search flavours or ingredients"
            aria-label="Search recipes"
            className="h-14 w-full rounded-pill border border-line bg-paper/70 pl-14 pr-5 text-[15px] text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2"
          />
        </div>

        <RecipeFilterChips categories={categories ?? []} value={chip} onChange={setChip} />

        <p className="sr-only">
          {isLoading ? 'Loading…' : `${items?.length ?? 0} recipe${items?.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {isError && <ErrorState message="Couldn't load recipes." onRetry={refetch} />}

      {!isError && isLoading && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Skeleton className="h-[340px] rounded-[28px]" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {!isError && !isLoading && items && items.length === 0 && (
        <div className="mt-5">
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
        </div>
      )}

      {!isError && !isLoading && featuredItem && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <RecipeCard
              recipe={featuredItem.recipe}
              kcal={featuredItem.kcal}
              proteinG={featuredItem.proteinG}
              variant="featured"
              onToggleFavourite={(id) =>
                toggleFavourite.mutate({
                  id,
                  next: !featuredItem.recipe.is_favourite,
                })
              }
            />
          </div>
          <div>
            {remainingItems.map(({ recipe, kcal, proteinG }) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                kcal={kcal}
                proteinG={proteinG}
                onToggleFavourite={(id) =>
                  toggleFavourite.mutate({ id, next: !recipe.is_favourite })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
