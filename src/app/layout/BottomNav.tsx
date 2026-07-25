import { NavLink } from 'react-router-dom'
import { BookOpen, Menu, ShoppingBag, Snowflake, type LucideIcon } from 'lucide-react'

const items = [
  { to: '/', label: 'Recipes', icon: BookOpen },
  { to: '/freezer', label: 'Freezer', icon: Snowflake },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBag },
  { to: '/more', label: 'More', icon: Menu },
] satisfies Array<{ to: string; label: string; icon: LucideIcon }>

export function BottomNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex h-[68px] flex-col items-center justify-center gap-1.5 text-[11px] font-medium transition-colors motion-safe:duration-150 ${
                  isActive ? 'text-berry' : 'text-muted'
                }`
              }
            >
              <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export const NAV_ITEMS = items
