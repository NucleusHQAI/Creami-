import { Star } from 'lucide-react'

export interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  size?: number
}

export function RatingStars({ value, onChange, size = 18 }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5]

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
        {stars.map((star) => (
          <Star
            key={star}
            size={size}
            aria-hidden="true"
            className={star <= Math.round(value) ? 'fill-berry stroke-berry' : 'fill-none stroke-line'}
          />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label="Rating" className="inline-flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onClick={() => onChange(star)}
          className="flex h-11 w-11 items-center justify-center"
        >
          <Star
            size={size}
            aria-hidden="true"
            className={star <= value ? 'fill-berry stroke-berry' : 'fill-none stroke-line'}
          />
        </button>
      ))}
    </div>
  )
}
