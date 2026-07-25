import { Chip } from '@/components/ui/Chip'
import type { Category } from '@/types/domain'

export type FilterChipValue = 'all' | 'favourites' | (string & {})

export interface RecipeFilterChipsProps {
  categories: Category[]
  value: FilterChipValue
  onChange: (value: FilterChipValue) => void
}

/** Single-select filter row: All, the five categories, then Favourites — per docs/05 § Recipe list. */
export function RecipeFilterChips({ categories, value, onChange }: RecipeFilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter recipes"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      <Chip selected={value === 'all'} onClick={() => onChange('all')}>
        All
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={value === category.key}
          onClick={() => onChange(category.key)}
        >
          {category.label}
        </Chip>
      ))}
      <Chip selected={value === 'favourites'} onClick={() => onChange('favourites')}>
        ♡ Favourites
      </Chip>
    </div>
  )
}
