import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { FavouriteButton } from '@/components/ui/FavouriteButton'
import type { RecipeListRow } from '@/types/domain'

export interface RecipeCardProps {
  recipe: RecipeListRow
  kcal: number | null
  proteinG: number | null
  onToggleFavourite: (id: string) => void
}

export function RecipeCard({ recipe, kcal, proteinG, onToggleFavourite }: RecipeCardProps) {
  if (!recipe.id || !recipe.slug) {
    return null
  }

  return (
    <article
      className="group relative block overflow-hidden rounded-recipe border border-line bg-paper transition-transform motion-safe:duration-150 motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-lift"
      style={{ '--accent': recipe.accent ?? undefined, '--tint': recipe.tint ?? undefined } as CSSProperties}
    >
      <div className="relative h-24 bg-[var(--tint)]">
        <div
          aria-hidden="true"
          className="absolute -bottom-6 -left-4 h-20 w-20 rounded-full bg-[var(--accent)]/25"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[var(--accent)]/15"
        />
        <FavouriteButton
          isFavourite={recipe.is_favourite ?? false}
          onToggle={() => onToggleFavourite(recipe.id as string)}
          className="absolute left-2 top-2 z-10"
        />
        {recipe.emoji && (
          <span aria-hidden="true" className="absolute right-3 top-3 text-2xl">
            {recipe.emoji}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p
            className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: 'var(--accent)' }}
          >
            {recipe.category_label}
          </p>
          <h3 className="font-display text-[22px] tracking-[-0.025em] text-ink">{recipe.name}</h3>
          {recipe.profile && (
            <p className="mt-1 line-clamp-2 text-[13px] text-muted">{recipe.profile}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {recipe.base_name && <Pill variant="base">{recipe.base_name}</Pill>}
          {kcal !== null && <Pill>{Math.round(kcal)} kcal</Pill>}
          {proteinG !== null && <Pill variant="protein">{Math.round(proteinG)}g protein</Pill>}
          {recipe.average_rating !== null && recipe.average_rating !== undefined && (
            <Pill>★ {recipe.average_rating}</Pill>
          )}
        </div>

        <Link
          to={`/recipe/${recipe.slug}`}
          aria-label={`View ${recipe.name ?? 'recipe'} recipe`}
          className="flex items-center justify-between text-[13px] font-medium text-ink after:absolute after:inset-0 after:content-['']"
        >
          View recipe
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform motion-safe:duration-150 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  )
}
