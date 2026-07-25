import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Copy, MoreVertical, Pencil, ShoppingCart, Snowflake, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { useToast } from '@/app/ToastProvider'
import { useOnlineStatus } from '@/lib/online-status'

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
  const isOnline = useOnlineStatus()
  const addToShoppingList = onAddToShoppingList ?? (() => showToast('Add to shopping list — coming soon'))
  const logBatch = onLogBatch ?? (() => showToast('Log a batch — coming soon'))
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) {
      itemRefs.current[0]?.focus()
    }
  }, [open])

  function runAndClose(action: () => void) {
    setOpen(false)

    if (!isOnline) {
      showToast('Reconnect to change this recipe.')
      return
    }

    action()
  }

  const items: Array<{ label: string; icon: typeof Pencil; action: () => void; danger?: boolean }> = [
    { label: 'Edit', icon: Pencil, action: onEdit },
    { label: 'Add to shopping list', icon: ShoppingCart, action: addToShoppingList },
    { label: 'Log a batch', icon: Snowflake, action: logBatch },
    { label: 'Duplicate', icon: Copy, action: onDuplicate },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
  ]

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const menuItems = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item !== null,
    )
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      menuItems[(currentIndex + 1) % menuItems.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      menuItems[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      menuItems[menuItems.length - 1]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        ref={triggerRef}
        aria-label="Recipe actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </IconButton>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Recipe actions"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-panel border border-line bg-paper py-1 shadow-lift"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              type="button"
              role="menuitem"
              aria-disabled={!isOnline}
              title={!isOnline ? 'Reconnect to change this recipe.' : undefined}
              onClick={() => runAndClose(item.action)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-cream aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${item.danger ? 'text-berry' : 'text-ink'}`}
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
