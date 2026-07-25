import { useEffect, useRef, useState } from 'react'
import { Copy, MoreVertical, Pencil, ShoppingCart, Snowflake, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { useToast } from '@/app/ToastProvider'

export interface RecipeOverflowMenuProps {
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  /**
   * Shopping (Task 31+) and freezer (Task 26+) own the real behaviour.
   * Optional — when a later phase wires the real action in, it passes these;
   * until then the menu falls back to a "coming soon" toast on its own.
   */
  onAddToShoppingList?: () => void
  onLogBatch?: () => void
}

/**
 * The recipe detail header's overflow menu. Edit, Duplicate and Delete are
 * fully wired; Add to shopping list and Log a batch are extension points for
 * the shopping and freezer phases, per docs/10 Task 20's scoping note.
 */
export function RecipeOverflowMenu({
  onEdit,
  onDuplicate,
  onDelete,
  onAddToShoppingList,
  onLogBatch,
}: RecipeOverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()
  const addToShoppingList = onAddToShoppingList ?? (() => showToast('Add to shopping list — coming soon'))
  const logBatch = onLogBatch ?? (() => showToast('Log a batch — coming soon'))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function runAndClose(action: () => void) {
    setOpen(false)
    action()
  }

  const items: Array<{ label: string; icon: typeof Pencil; action: () => void; danger?: boolean }> = [
    { label: 'Edit', icon: Pencil, action: onEdit },
    { label: 'Add to shopping list', icon: ShoppingCart, action: addToShoppingList },
    { label: 'Log a batch', icon: Snowflake, action: logBatch },
    { label: 'Duplicate', icon: Copy, action: onDuplicate },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
  ]

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        aria-label="Recipe actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </IconButton>

      {open && (
        <div
          role="menu"
          aria-label="Recipe actions"
          className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-panel border border-line bg-paper py-1 shadow-lift"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => runAndClose(item.action)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-cream ${item.danger ? 'text-berry' : 'text-ink'}`}
            >
              <item.icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
