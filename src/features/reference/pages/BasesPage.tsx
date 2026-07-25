import { Link } from 'react-router-dom'
import { ChevronRight, Layers } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBases } from '@/features/reference/hooks/useBases'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useSettings } from '@/features/reference/hooks/useSettings'
import { calculateBaseOnlyMacros } from '@/features/reference/lib/baseMacros'
import { formatQuantity } from '@/lib/units'
import type { Unit } from '@/lib/macros/types'
import type { AppSettings, BaseWithIngredients, Ingredient } from '@/types/domain'

function BasesSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-64 w-full" />
      ))}
    </div>
  )
}

export default function BasesPage() {
  const basesQuery = useBases()
  const ingredientsQuery = useIngredients()
  const settingsQuery = useSettings()

  const isLoading = basesQuery.isLoading || ingredientsQuery.isLoading || settingsQuery.isLoading
  const isError = basesQuery.isError || ingredientsQuery.isError || settingsQuery.isError

  function retryAll() {
    basesQuery.refetch()
    ingredientsQuery.refetch()
    settingsQuery.refetch()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
          Bases
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          The six base formulas. Every recipe starts from one of these, topped up to your MAX FILL
          line with the default milk.
        </p>
      </div>

      {isLoading && <BasesSkeleton />}

      {!isLoading && isError && (
        <ErrorState message="Could not load the bases." onRetry={retryAll} />
      )}

      {!isLoading && !isError && basesQuery.data && basesQuery.data.length === 0 && (
        <EmptyState icon={Layers} title="No bases yet" message="Base formulas will appear here once seeded." />
      )}

      {!isLoading && !isError && basesQuery.data && ingredientsQuery.data && settingsQuery.data && (
        <div className="space-y-4">
          {basesQuery.data.map((base) => (
            <BaseCard
              key={base.id}
              base={base}
              parent={basesQuery.data?.find((candidate) => candidate.id === base.is_variation_of)}
              ingredients={ingredientsQuery.data ?? []}
              settings={settingsQuery.data}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface BaseCardProps {
  base: BaseWithIngredients
  parent: BaseWithIngredients | undefined
  ingredients: Ingredient[]
  settings: AppSettings
}

function BaseCard({ base, parent, ingredients, settings }: BaseCardProps) {
  const macros = calculateBaseOnlyMacros(base, ingredients, settings)

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">{base.name}</h2>
          {parent && (
            <p className="mt-0.5 text-[13px] text-muted">
              A variation of{' '}
              <Link to={`/bases/${parent.key}`} className="text-berry underline underline-offset-2">
                {parent.name}
              </Link>
            </p>
          )}
          {base.tagline && <p className="mt-1 text-[13px] text-muted">{base.tagline}</p>}
        </div>
        <Link
          to={`/bases/${base.key}`}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-pill border border-line bg-paper px-4 text-[13px] font-medium text-ink transition-colors motion-safe:duration-150 hover:bg-cream"
        >
          Edit base
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {base.summary && <p className="mt-3 text-[15px] text-ink">{base.summary}</p>}

      <ul className="mt-4 space-y-1 text-[13px] text-ink">
        {base.ingredients
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((line) => (
            <li key={line.id} className="flex justify-between gap-3 border-b border-line/60 py-1 last:border-0">
              <span>
                {line.ingredient.name}
                {line.note && <span className="text-muted"> — {line.note}</span>}
              </span>
              <span className="shrink-0 font-mono text-[12px] text-muted">
                {formatQuantity(line.quantity, line.unit as Unit)}
              </span>
            </li>
          ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Pill>{Math.round(macros.perTub.kcal)} kcal (tub)</Pill>
        <Pill variant="protein">{macros.perTub.protein_g.toFixed(1)}g protein</Pill>
        <Pill>{macros.perTub.carbs_g.toFixed(1)}g carbs</Pill>
        <Pill>{macros.perTub.fat_g.toFixed(1)}g fat</Pill>
      </div>
      <p className="mt-2 text-[13px] text-muted">
        The base alone, topped up to {settings.max_fill_ml}ml — the floor for any recipe on this base.
      </p>
    </Card>
  )
}
