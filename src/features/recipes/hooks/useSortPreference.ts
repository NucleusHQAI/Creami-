import { useState } from 'react'
import type { RecipeSort } from '@/lib/query-keys'

const STORAGE_KEY = 'creami:recipe-sort'
const VALID_SORTS: readonly RecipeSort[] = ['category', 'name', 'recent', 'rating', 'madeCount']

function readStoredSort(): RecipeSort {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return (VALID_SORTS as readonly string[]).includes(stored ?? '') ? (stored as RecipeSort) : 'category'
}

/**
 * The recipe list's sort choice, persisted to localStorage — a UI
 * preference, not data, and the one legitimate use of localStorage in the
 * app (CLAUDE.md § Things that will be sent back).
 */
export function useSortPreference(): [RecipeSort, (next: RecipeSort) => void] {
  const [sort, setSort] = useState<RecipeSort>(readStoredSort)

  function updateSort(next: RecipeSort) {
    setSort(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return [sort, updateSort]
}
