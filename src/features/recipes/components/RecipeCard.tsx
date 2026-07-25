import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { FavouriteButton } from '@/components/ui/FavouriteButton'
import type { RecipeListRow } from '@/types/domain'
import { getRecipeImageUrl } from '@/lib/api/recipe-images'

export interface RecipeCardProps {
  recipe: RecipeListRow
  kcal: number | null
  proteinG: number | null
  variant?: 'featured' | 'row'
  onToggleFavourite: (id: string) => void
}

function formatStats(recipe: RecipeListRow, kcal: number | null, proteinG: number | null): string {
  const stats: string[] = []
  if (kcal !== null) stats.push(`${Math.round(kcal)} kcal`)
  if (proteinG !== null) stats.push(`${Math.round(proteinG)}g protein`)
  if (recipe.average_rating !== null && recipe.average_rating !== undefined) {
    stats.push(`★ ${recipe.average_rating}`)
  }
  return stats.join(' · ')
}

export function RecipeCard({
  recipe,
  kcal,
  proteinG,
  variant = 'row',
  onToggleFavourite,
}: RecipeCardProps) {
  if (!recipe.id || !recipe.slug) {
    return null
  }

  const artwork = getRecipeImageUrl(recipe.image_path)
  const stats = formatStats(recipe, kcal, proteinG)
  const style = {
    '--accent': recipe.accent ?? undefined,
    '--tint': recipe.tint ?? undefined,
  } as CSSProperties

  if (variant === 'featured') {
    return (
      <article
        className="group relative isolate min-h-[340px] overflow-hidden rounded-[28px] bg-[var(--tint)]"
        style={style}
      >
        {artwork && (
          <img
            src={artwork}
            alt=""
            className="absolute -right-12 top-8 h-[72%] w-[66%] rounded-pill object-cover"
          />
        )}

        <div className="relative z-[1] flex min-h-[340px] max-w-[60%] flex-col p-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
            Featured
          </p>
          <h2 className="mt-4 font-display text-[clamp(44px,15vw,64px)] font-normal leading-[0.9] tracking-[-0.055em] text-ink">
            {recipe.name}
          </h2>
          {recipe.profile && (
            <p className="mt-4 line-clamp-2 text-[15px] leading-6 text-muted">{recipe.profile}</p>
          )}

          <Link
            to={`/recipe/${recipe.slug}`}
            aria-label={`View ${recipe.name ?? 'recipe'} recipe`}
            className="mt-5 inline-flex h-12 w-fit items-center gap-3 rounded-pill bg-berry px-5 text-[15px] font-medium text-cream transition-colors motion-safe:duration-150 hover:bg-berrydk"
          >
            View recipe
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform motion-safe:duration-150 group-hover:translate-x-0.5"
            />
          </Link>

          <div className="mt-auto flex items-end gap-4 border-t border-ink/10 pt-4">
            {stats && <p className="font-mono text-[11px] leading-5 text-ink">{stats}</p>}
          </div>
        </div>

        <FavouriteButton
          isFavourite={recipe.is_favourite ?? false}
          onToggle={() => onToggleFavourite(recipe.id as string)}
          className="absolute bottom-4 right-4 z-10 border border-berry/30 bg-paper/90 text-berry"
        />
      </article>
    )
  }

  return (
    <article className="group relative border-b border-line/80 py-4" style={style}>
      <Link
        to={`/recipe/${recipe.slug}`}
        aria-label={`View ${recipe.name ?? 'recipe'} recipe`}
        className="grid min-h-28 grid-cols-[112px_1fr] gap-4 pr-10"
      >
        <div className="overflow-hidden rounded-[20px] bg-[var(--tint)]">
          {artwork ? (
            <img src={artwork} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end p-3">
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-ink">
                {recipe.category_label}
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col py-1">
          <h3 className="font-display text-[25px] font-normal leading-[1.02] tracking-[-0.04em] text-ink">
            {recipe.name}
          </h3>
          {recipe.profile && (
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted">{recipe.profile}</p>
          )}
          {stats && <p className="mt-auto pt-2 font-mono text-[11px] text-muted">{stats}</p>}
        </div>
      </Link>

      <FavouriteButton
        isFavourite={recipe.is_favourite ?? false}
        onToggle={() => onToggleFavourite(recipe.id as string)}
        className="absolute right-0 top-3 bg-transparent text-muted"
      />
    </article>
  )
}
