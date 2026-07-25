import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
}

interface ToastOptions {
  variant?: 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = crypto.randomUUID()
    const toast: Toast = {
      id,
      message,
      variant: options.variant ?? 'success',
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    }
    setToasts((current) => [...current, toast])
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, options.durationMs ?? 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-pill px-4 py-3 text-[13px] text-cream shadow-lift ${
                toast.variant === 'error' ? 'bg-berry' : 'bg-ink'
              }`}
            >
              <span>{toast.message}</span>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.()
                    setToasts((current) => current.filter((t) => t.id !== toast.id))
                  }}
                  className="font-medium underline underline-offset-2"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
