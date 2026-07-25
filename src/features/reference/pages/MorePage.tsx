import { Link } from 'react-router-dom'
import { ArrowRight, Blocks, ClipboardList, Salad, Settings2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MoreItem {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const ITEMS: MoreItem[] = [
  {
    to: '/bases',
    title: 'Bases',
    description: 'The six base formulas, their ingredients and base-only macros.',
    icon: Blocks,
  },
  {
    to: '/method',
    title: 'Method',
    description: 'The standard method, step by step, and the technique notes.',
    icon: ClipboardList,
  },
  {
    to: '/ingredients',
    title: 'Ingredients',
    description: 'Every ingredient in the library — searchable, and editable.',
    icon: Salad,
  },
  {
    to: '/settings',
    title: 'Settings',
    description: 'MAX FILL, default milk, freezing, servings, and export.',
    icon: Settings2,
  },
]

export default function MorePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-[1.05] tracking-[-0.04em] text-ink">
        More
      </h1>

      <nav aria-label="More" className="space-y-3">
        {ITEMS.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-4 rounded-panel border border-line bg-paper p-4 transition-colors motion-safe:duration-150 hover:bg-cream"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-line/50 text-ink">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl tracking-[-0.025em] text-ink">{title}</span>
              <span className="block text-[13px] text-muted">{description}</span>
            </span>
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="shrink-0 text-muted transition-transform motion-safe:duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </nav>
    </div>
  )
}
