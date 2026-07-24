import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAddExtra } from '@/features/shopping/hooks/useExtras'

export function AddExtraField() {
  const [label, setLabel] = useState('')
  const addExtra = useAddExtra()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    addExtra.mutate({ label: trimmed })
    setLabel('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Add your own, e.g. bin bags"
        aria-label="Add your own shopping list item"
        className="h-11 flex-1 rounded-soft border border-line bg-cream px-3 text-[15px] text-ink focus-visible:outline-none"
      />
      <Button type="submit" variant="secondary" size="md" disabled={!label.trim()}>
        <Plus size={16} aria-hidden="true" />
        Add
      </Button>
    </form>
  )
}
