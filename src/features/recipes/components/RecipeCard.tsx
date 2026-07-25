import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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

  const stats: Array<{ text: string; emphasis: boolean }> = []
  if (recipe.base_name) {
    stats.push({ text: recipe.base_name, emphasis: false })
  }
  if (kcal !== null) {
    stats.push({ text: `${Math.round(kcal)} kcal`, emphasis: true })
  }
  if (proteinG !== null) {
    stats.push({ text: `${Math.round(proteinG)}g protein`, emphasis: true })
  }
  if (recipe.average_rating !== null && recipe.average_rating !== undefined) {
    stats.push({ text: `★ ${recipe.average_rating}`, emphasis: true })
  }

  return (
    <article
      className="group isolate relative block overflow-hidden rounded-recipe border-2 border-ink bg-paper shadow-sticker transition-transform motion-safe:duration-150 motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-lift"
      style={{ '--accent': recipe.accent ?? undefined, '--tint': recipe.tint ?? undefined } as CSSProperties}
    >
      <div className="relative flex h-24 items-center justify-center bg-[var(--tint)]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[58%] h-28 w-32 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[46%_54%_58%_42%/54%_46%_54%_46%] bg-[var(--accent)]/25"
        />
        <div
          aria-hidden="true"
          className="absolute left-[42%] top-[68%] h-20 w-24 -translate-x-1/2 -translate-y-1/2 rotate-6 rounded-[50%_50%_42%_58%/58%_42%_58%_42%] bg-[var(--accent)]/15"
        />
        <div
          aria-hidden="true"
          className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-pill border-2 border-ink bg-paper text-xl shadow-sticker-sm"
        >
          {recipe.emoji}
        </div>
        <div className="recipe-wave absolute inset-x-0 bottom-0 h-5" aria-hidden="true" />
        <FavouriteButton
          isFavourite={recipe.is_favourite ?? false}
          onToggle={() => onToggleFavourite(recipe.id as string)}
          className="absolute left-2 top-2 z-10 -rotate-6 border-2 border-ink bg-paper shadow-sticker-sm"
        />
      </div>

      <div className="space-y-2 p-4 pt-3.5">
        <div>
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink">
            {recipe.category_label}
          </p>
          <h3 className="font-display text-[24px] font-extrabold tracking-[-0.03em] text-ink">
            {recipe.name}
          </h3>
          {recipe.profile && (
            <p className="mt-1 line-clamp-2 text-[13px] text-muted">{recipe.profile}</p>
          )}
        </div>

        {stats.length > 0 && (
          <p className="font-mono text-[11px] text-ink">
            {stats.map((stat, index) => (
              <span key={stat.text}>
                {index > 0 && <span className="text-ink/35">{' · '}</span>}
                <span className={stat.emphasis ? 'font-bold' : 'font-normal'}>{stat.text}</span>
              </span>
            ))}
          </p>
        )}

        <Link
          to={`/recipe/${recipe.slug}`}
          aria-label={`View ${recipe.name ?? 'recipe'} recipe`}
          className="flex items-center justify-between pt-1 text-[13px] font-medium text-ink after:absolute after:inset-0 after:content-['']"
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
