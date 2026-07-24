import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Required — an icon-only button with no accessible name is a trap for screen reader users. */
  'aria-label': string
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-ink/90',
  secondary: 'border border-line bg-paper text-ink hover:bg-cream',
  ghost: 'text-ink hover:bg-line/40',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-pill transition-colors motion-safe:duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
})
