import { forwardRef, type HTMLAttributes } from 'react'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className = '', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-recipe border border-line bg-paper ${className}`}
      {...props}
    />
  )
})
