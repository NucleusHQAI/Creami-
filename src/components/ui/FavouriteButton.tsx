import { Heart } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

export interface FavouriteButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  isFavourite: boolean
  onToggle: () => void
}

export function FavouriteButton({
  isFavourite,
  onToggle,
  className = '',
  ...props
}: FavouriteButtonProps) {
  return (
    <button
      type="button"
      aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={isFavourite}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-pill bg-paper/90 text-ink transition-transform motion-safe:duration-150 motion-safe:active:scale-90 ${className}`}
      {...props}
    >
      <Heart
        className={isFavourite ? 'fill-ink stroke-ink' : 'fill-none stroke-ink'}
        size={20}
        aria-hidden="true"
      />
    </button>
  )
}
