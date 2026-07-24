// Temporary — each of these is replaced by its real page as the feature's
// task in docs/10-task-backlog.md lands. Not a permanent abstraction.

export function RoutePlaceholder({ title, spec }: { title: string; spec: string }) {
  return (
    <div className="rounded-panel border border-line bg-paper px-6 py-12 text-center">
      <p className="font-display text-2xl tracking-[-0.03em] text-ink">{title}</p>
      <p className="mt-2 text-[13px] text-muted">Built out per {spec}.</p>
    </div>
  )
}
