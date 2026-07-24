import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ErrorStateProps {
  message?: string
  onRetry: () => void
}

export function ErrorState({
  message = 'Something went wrong loading this.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-panel border border-line bg-paper px-6 py-12 text-center"
    >
      <AlertTriangle size={32} className="text-berry" aria-hidden />
      <p className="text-[15px] text-ink">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
