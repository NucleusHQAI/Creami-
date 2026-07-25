import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useIngredients } from '@/features/reference/hooks/useIngredients'
import { useIngredientUsageCounts } from '@/features/recipes/hooks/useIngredientUsageCounts'
import { IngredientEditSheet } from '@/features/reference/components/IngredientEditSheet'
import type { Ingredient } from '@/types/domain'

export interface IngredientPickerProps {
  ingredientId: string | null
  freeText: string | null
  onSelectIngredient: (ingredient: Ingredient) => void
  onSetFreeText: (text: string) => void
  ariaLabel: string
}

const CATEGORY_LABELS: Record<string, string> = {
  biscuit: 'Biscuit',
  confectionery: 'Confectionery',
  dairy: 'Dairy',
  flavour: 'Flavour',
  fruit: 'Fruit',
  'nut-butter': 'Nut butter',
  nuts: 'Nuts',
  protein: 'Protein',
  sweet: 'Sweet',
  texture: 'Texture',
}

/**
 * Searchable, grouped ingredient combobox (docs/05 § The ingredient line
 * editor). Grouped by ingredient category, most-used ingredients first
 * within each group. When nothing matches, offers "add as a note" (a
 * free-text line, no macros) and "create a new ingredient" (the canonical
 * ingredient editor sheet, reused here in create mode).
 */
export function IngredientPicker({
  ingredientId,
  freeText,
  onSelectIngredient,
  onSetFreeText,
  ariaLabel,
}: IngredientPickerProps) {
  const { data: ingredients } = useIngredients()
  const { data: usageCounts } = useIngredientUsageCounts()
  const selected = ingredients?.find((i) => i.id === ingredientId)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(selected?.name ?? freeText ?? '')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  useEffect(() => {
    setQuery(selected?.name ?? freeText ?? '')
    setActiveIndex(-1)
  }, [selected?.name, freeText])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selected?.name ?? freeText ?? '')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, selected?.name, freeText])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const matches = (ingredients ?? []).filter((ingredient) =>
      term ? ingredient.name.toLowerCase().includes(term) : true,
    )
    const byCategory = new Map<string, Ingredient[]>()
    for (const ingredient of matches) {
      const list = byCategory.get(ingredient.category) ?? []
      list.push(ingredient)
      byCategory.set(ingredient.category, list)
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => {
        const usageDiff = (usageCounts?.get(b.id) ?? 0) - (usageCounts?.get(a.id) ?? 0)
        return usageDiff !== 0 ? usageDiff : a.name.localeCompare(b.name)
      })
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [ingredients, query, usageCounts])

  const flatOptions = useMemo(() => groups.flatMap(([, rows]) => rows), [groups])
  const hasExactMatch = (ingredients ?? []).some(
    (ingredient) => ingredient.name.toLowerCase() === query.trim().toLowerCase(),
  )
  const trimmedQuery = query.trim()
  const activeOption = flatOptions[activeIndex]

  function selectIngredient(ingredient: Ingredient) {
    onSelectIngredient(ingredient)
    setQuery(ingredient.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      if (flatOptions.length === 0) return
      setActiveIndex((index) => (index >= flatOptions.length - 1 ? 0 : index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (flatOptions.length === 0) return
      setActiveIndex((index) => (index <= 0 ? flatOptions.length - 1 : index - 1))
    } else if (event.key === 'Enter' && open) {
      if (activeOption) {
        event.preventDefault()
        selectIngredient(activeOption)
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeOption ? `${listboxId}-option-${activeOption.id}` : undefined
        }
        aria-label={ariaLabel}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search ingredients…"
        className="h-11 w-full rounded-soft border border-line bg-cream px-3 text-ink focus-visible:outline-none"
      />

      {open && (
        <div
          className="absolute z-20 mt-1 max-h-72 w-full min-w-[240px] overflow-y-auto rounded-panel border border-line bg-paper py-1 shadow-lift"
        >
          <div id={listboxId} role="listbox" aria-label={ariaLabel}>
            {groups.map(([category, categoryIngredients]) => (
              <div
                key={category}
                role="group"
                aria-label={CATEGORY_LABELS[category] ?? category}
              >
                <p
                  aria-hidden="true"
                  className="px-3 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </p>
                {categoryIngredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    id={`${listboxId}-option-${ingredient.id}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={ingredient.id === ingredientId}
                    onClick={() => selectIngredient(ingredient)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-ink hover:bg-cream"
                  >
                    {ingredient.name}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {trimmedQuery && !hasExactMatch && (
            <div className="border-t border-line pt-1">
              <button
                type="button"
                onClick={() => {
                  onSetFreeText(trimmedQuery)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-[14px] text-ink hover:bg-cream"
              >
                Add “{trimmedQuery}” as a note
              </button>
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(true)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-[14px] text-berrydk hover:bg-cream"
              >
                Create a new ingredient
              </button>
            </div>
          )}

          {groups.length === 0 && !trimmedQuery && (
            <p className="px-3 py-2 text-[13px] text-muted">Start typing to search.</p>
          )}
        </div>
      )}

      <IngredientEditSheet
        open={sheetOpen}
        initialName={trimmedQuery}
        onClose={() => setSheetOpen(false)}
        onSaved={(ingredient) => {
          setSheetOpen(false)
          onSelectIngredient(ingredient)
          setQuery(ingredient.name)
        }}
      />
    </div>
  )
}
