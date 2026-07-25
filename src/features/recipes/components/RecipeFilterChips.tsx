import type { Category } from '@/types/domain'

export type FilterChipValue = 'all' | 'favourites' | (string & {})

export interface RecipeFilterChipsProps {
  categories: Category[]
  value: FilterChipValue
  onChange: (value: FilterChipValue) => void
}

/** Single-select filter row: All, the five categories, then Favourites — per docs/05 § Recipe list. */
export function RecipeFilterChips({ categories, value, onChange }: RecipeFilterChipsProps) {
  const options = [
    { value: 'all' as const, label: 'All' },
    { value: 'favourites' as const, label: 'Favourites' },
    ...categories.map((category) => ({ value: category.key, label: category.label })),
  ]

  return (
    <div
      role="group"
      aria-label="Filter recipes"
      className="hide-scrollbar -mx-5 flex gap-8 overflow-x-auto border-b border-line/80 px-5 sm:mx-0 sm:px-0"
    >
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`relative h-12 shrink-0 whitespace-nowrap text-[14px] transition-colors motion-safe:duration-150 ${
              selected ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
            {selected && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-pill bg-berry"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
