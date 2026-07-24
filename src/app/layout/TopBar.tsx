import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/app/layout/BottomNav'

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-cream/95 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <NavLink to="/" className="font-display text-xl tracking-[-0.03em] text-ink">
          CREAMi Deluxe
        </NavLink>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-pill px-4 py-2 text-[14px] font-medium ${
                      isActive ? 'bg-ink text-cream' : 'text-ink hover:bg-line/40'
                    }`
                  }
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
