import type { HTMLAttributes } from 'react'

type Variant = 'default' | 'protein' | 'base' | 'accent'

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-line/50 text-ink',
  protein: 'bg-blue/10 text-blue',
  base: 'bg-berry/10 text-berrydk',
  accent: 'bg-[var(--tint,theme(colors.line))] text-ink',
}

export function Pill({ variant = 'default', className = '', ...props }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
