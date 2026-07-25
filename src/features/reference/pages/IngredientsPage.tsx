import { useMemo, useState } from 'react'
import { Plus, Search, Salad, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useBases } from '@/features/reference/hooks/useBases'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { findCalibrationIngredientIds } from '@/features/reference/lib/calibrationIngredients'
import { formatCategoryLabel } from '@/features/reference/lib/ingredientCategory'
import { IngredientEditSheet } from '@/features/reference/components/IngredientEditSheet'
import type { Ingredient } from '@/types/domain'

const CALIBRATION_DISMISSED_KEY = 'creami-deluxe:calibration-prompt-dismissed'

function basisLabel(basis: string): string {
  switch (basis) {
    case 'per_100ml':
      return 'per 100ml'
    case 'per_item':
      return 'per item'
    default:
      return 'per 100g'
  }
}

export default function IngredientsPage() {
  const ingredientsQuery = useIngredients()
  const basesQuery = useBases()
  const settingsQuery = useSettings()

  const [search, setSearch] = useState('')
  const [calibrationOnly, setCalibrationOnly] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(CALIBRATION_DISMISSED_KEY) === 'true',
  )
  const [sheetState, setSheetState] = useState<{ open: boolean; ingredientId?: string }>({ open: false })

  const calibrationIds = useMemo(
    () => findCalibrationIngredientIds(basesQuery.data ?? [], settingsQuery.data),
    [basesQuery.data, settingsQuery.data],
  )

  const filtered = useMemo(() => {
    const rows = ingredientsQuery.data ?? []
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (calibrationOnly) return calibrationIds.has(row.id)
      if (!term) return true
      return row.name.toLowerCase().includes(term) || row.category.toLowerCase().includes(term)
    })
  }, [ingredientsQuery.data, search, calibrationOnly, calibrationIds])

  const grouped = useMemo(() => {
    const groups = new Map<string, Ingredient[]>()
    for (const row of filtered) {
      const group = groups.get(row.category) ?? []
      group.push(row)
      groups.set(row.category, group)
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.name.localeCompare(b.name))
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function dismissCalibrationPrompt() {
    setDismissed(true)
    window.localStorage.setItem(CALIBRATION_DISMISSED_KEY, 'true')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
            Ingredients
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {ingredientsQuery.data ? `${ingredientsQuery.data.length} ingredients` : 'The full library.'}
          </p>
        </div>
        <Button type="button" onClick={() => setSheetState({ open: true, ingredientId: undefined })}>
          <Plus size={16} aria-hidden="true" />
          Add ingredient
        </Button>
      </div>

      {!dismissed && (
        <Card className="space-y-2 border-berry/30 bg-berry/5 p-4">
          <p className="text-[15px] text-ink">
            <strong className="font-medium">Check your labels.</strong> These values are typical UK
            figures, not your brands. Correcting your protein powder, yoghurt, quark and milk will
            fix most of the difference.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCalibrationOnly(true)
                setSearch('')
              }}
              className="text-[13px] font-medium text-berry underline underline-offset-2"
            >
              Show me those four →
            </button>
            <button
              type="button"
              onClick={dismissCalibrationPrompt}
              className="text-[13px] font-medium text-muted underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search ingredients</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCalibrationOnly(false)
            }}
            placeholder="Search ingredients…"
            className="h-11 w-full rounded-pill border border-line bg-paper pl-10 pr-4 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2"
          />
        </label>
        {calibrationOnly && (
          <button
            type="button"
            onClick={() => setCalibrationOnly(false)}
            className="inline-flex h-9 items-center gap-1 rounded-pill border border-ink bg-ink px-3 text-[13px] font-medium text-cream"
          >
            The four that matter most
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {ingredientsQuery.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!ingredientsQuery.isLoading && ingredientsQuery.isError && (
        <ErrorState message="Could not load the ingredient library." onRetry={() => ingredientsQuery.refetch()} />
      )}

      {!ingredientsQuery.isLoading && !ingredientsQuery.isError && filtered.length === 0 && (
        <EmptyState
          icon={Salad}
          title="No ingredients match"
          message="Try a different search term, or add a new ingredient."
        />
      )}

      {!ingredientsQuery.isLoading && !ingredientsQuery.isError && filtered.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([category, rows]) => (
            <section key={category} aria-labelledby={`category-${category}`} className="space-y-2">
              <h2
                id={`category-${category}`}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-berrydk"
              >
                {formatCategoryLabel(category)}
              </h2>
              <div className="divide-y divide-line rounded-panel border border-line bg-paper">
                {rows.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => setSheetState({ open: true, ingredientId: ingredient.id })}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors motion-safe:duration-150 hover:bg-cream"
                  >
                    <span>
                      <span className="flex items-center gap-2">
                        <span className="text-[15px] text-ink">{ingredient.name}</span>
                        {ingredient.is_seed && <Pill>Seeded</Pill>}
                      </span>
                      <span className="text-[13px] text-muted">
                        {Math.round(ingredient.kcal)} kcal · {ingredient.protein_g.toFixed(1)}g protein (
                        {basisLabel(ingredient.basis)})
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <IngredientEditSheet
        open={sheetState.open}
        ingredientId={sheetState.ingredientId}
        onClose={() => setSheetState({ open: false })}
      />
    </div>
  )
}
