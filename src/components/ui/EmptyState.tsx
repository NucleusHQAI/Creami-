import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-line bg-paper px-6 py-12 text-center">
      <Icon size={32} className="text-muted" aria-hidden="true" />
      <p className="font-display text-xl tracking-[-0.025em] text-ink">{title}</p>
      {message && <p className="max-w-sm text-[13px] text-muted">{message}</p>}
      {action}
    </div>
  )
}
