import { Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { AddExtraField } from '@/features/shopping/components/AddExtraField'
import { useDeleteExtra, useExtras, useToggleExtra } from '@/features/shopping/hooks/useExtras'

export function ExtrasSection() {
  const { data: extras, isLoading } = useExtras()
  const toggleExtra = useToggleExtra()
  const deleteExtra = useDeleteExtra()

  return (
    <section aria-labelledby="extras-heading" className="space-y-3">
      <h2 id="extras-heading" className="font-mono text-[11px] uppercase tracking-[0.12em] text-berrydk">
        Added by you
      </h2>
      {isLoading ? (
        <Skeleton className="h-11 w-full" />
      ) : (extras ?? []).length === 0 ? (
        <p className="text-[13px] text-muted">Nothing added yet.</p>
      ) : (
        <ul>
          {(extras ?? []).map((extra) => (
            <li
              key={extra.id}
              className={`flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0 ${extra.is_checked ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={extra.is_checked}
                onChange={() => toggleExtra.mutate({ id: extra.id, next: !extra.is_checked })}
                aria-label={`${extra.is_checked ? 'Untick' : 'Tick'} ${extra.label}`}
                className="h-5 w-5 shrink-0 rounded-soft border border-line accent-berry"
              />
              <span
                className={`flex-1 text-[15px] text-ink ${extra.is_checked ? 'line-through' : ''}`}
              >
                {extra.label}
              </span>
              <IconButton
                aria-label={`Remove ${extra.label}`}
                onClick={() => deleteExtra.mutate(extra.id)}
                className="h-9 w-9"
              >
                <Trash2 size={16} aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <AddExtraField />
    </section>
  )
}
