import { useId } from 'react'
import type { RecipeSort } from '@/lib/query-keys'

const SORT_OPTIONS: Array<{ value: RecipeSort; label: string }> = [
  { value: 'category', label: 'Category order' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recently added' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'madeCount', label: 'Most made' },
]

export interface RecipeSortControlProps {
  value: RecipeSort
  onChange: (value: RecipeSort) => void
}

export function RecipeSortControl({ value, onChange }: RecipeSortControlProps) {
  const id = useId()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[13px] text-muted">
        Sort
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as RecipeSort)}
        className="h-9 rounded-pill border border-line bg-paper px-3 text-[13px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry focus-visible:ring-offset-2"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
