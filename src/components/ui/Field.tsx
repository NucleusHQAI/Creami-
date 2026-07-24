import { useId, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

export interface FieldProps {
  label: string
  hint?: string
  error?: FieldError | string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const message = typeof error === 'string' ? error : error?.message

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[13px] text-muted">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': Boolean(error) || undefined,
      })}
      {hint && !message && (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {message && (
        <p id={errorId} role="alert" className="text-[13px] text-berry">
          {message}
        </p>
      )}
    </div>
  )
}
