export interface OfflineBannerProps {
  isOnline: boolean
  pendingCount: number
}

export function OfflineBanner({ isOnline, pendingCount }: OfflineBannerProps) {
  if (isOnline && pendingCount === 0) {
    return null
  }

  const pendingLabel =
    pendingCount === 1
      ? "1 change will sync when you're back online"
      : `${pendingCount} changes will sync when you're back online`

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-berry/20 bg-berry px-4 py-2 text-center text-[12px] font-medium text-paper"
    >
      {!isOnline && <span>Offline — showing saved recipes</span>}
      {pendingCount > 0 && (
        <span className={!isOnline ? 'ml-2' : undefined}>{pendingLabel}</span>
      )}
    </div>
  )
}
