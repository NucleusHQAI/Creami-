import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-ink/90',
  secondary: 'border border-line bg-paper text-ink hover:bg-cream',
  ghost: 'text-ink hover:bg-line/40',
  danger: 'bg-berry text-cream hover:bg-berrydk',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-pill',
  md: 'h-11 px-5 text-[15px] rounded-pill',
  lg: 'h-14 px-6 text-base rounded-pill',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors motion-safe:duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
})
