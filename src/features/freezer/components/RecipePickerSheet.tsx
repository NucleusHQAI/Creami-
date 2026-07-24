import { useMemo, useState } from 'react'
import { Field } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Sheet } from '@/components/ui/Sheet'
import { useRecipeOptions } from '@/features/freezer/hooks/useRecipeOptions'
import type { RecipeOption } from '@/lib/api/batches'

export interface RecipePickerSheetProps {
  open: boolean
  onClose: () => void
  onSelect: (recipe: RecipeOption) => void
}

/** The "which recipe" step of the freezer screen's log-a-batch floating action button. */
export function RecipePickerSheet({ open, onClose, onSelect }: RecipePickerSheetProps) {
  const [search, setSearch] = useState('')
  const { data: recipes, isLoading, isError, refetch } = useRecipeOptions()

  const filtered = useMemo(() => {
    if (!recipes) return []
    const term = search.trim().toLowerCase()
    if (!term) return recipes
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(term))
  }, [recipes, search])

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Log a batch">
      <div className="space-y-4">
        <Field label="Recipe">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipes"
              className="h-11 w-full rounded-soft border border-line bg-paper px-3 text-[15px] text-ink placeholder:text-muted"
            />
          )}
        </Field>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        )}

        {isError && <ErrorState message="Could not load recipes." onRetry={() => refetch()} />}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-[13px] text-muted">No recipes match &ldquo;{search}&rdquo;.</p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {filtered.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(recipe)
                    setSearch('')
                  }}
                  className="flex h-11 w-full items-center rounded-soft px-3 text-left text-[15px] text-ink hover:bg-line/40"
                >
                  {recipe.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
