import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in route tree', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
          <p className="font-display text-2xl tracking-[-0.03em] text-ink">
            Something went wrong
          </p>
          <p className="max-w-sm text-[13px] text-muted">
            The app hit an error it didn't expect. Reloading usually fixes it.
          </p>
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
        </div>
      )
    }

    return this.props.children
  }
}
