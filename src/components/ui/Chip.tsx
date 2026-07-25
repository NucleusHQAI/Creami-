import { forwardRef, type ButtonHTMLAttributes } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-pill border-2 px-4 text-[13px] font-medium transition-colors motion-safe:duration-150 ${
        selected
          ? 'border-berry bg-berry text-cream'
          : 'border-ink bg-paper text-ink hover:bg-cream'
      } ${className}`}
      {...props}
    />
  )
})
