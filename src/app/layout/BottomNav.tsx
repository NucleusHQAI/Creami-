import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Recipes', emoji: '🍦' },
  { to: '/freezer', label: 'Freezer', emoji: '❄️' },
  { to: '/shopping', label: 'Shopping', emoji: '🛒' },
  { to: '/more', label: 'More', emoji: '☰' },
] as const

export function BottomNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  isActive ? 'text-berry' : 'text-muted'
                }`
              }
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {item.emoji}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export const NAV_ITEMS = items
