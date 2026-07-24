// Minimal placeholder router for Phase 1 (auth wiring only). Phase 3 (Task 14)
// replaces this with the full AppShell, lazy routes and bottom navigation.

import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/app/LoginPage'
import StyleguidePage from '@/app/StyleguidePage'
import { RequireAuth } from '@/app/RequireAuth'

function HomePlaceholder() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <p className="font-display text-2xl text-ink">Signed in. The app shell lands in Task 14.</p>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/styleguide', element: <StyleguidePage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <HomePlaceholder />
      </RequireAuth>
    ),
  },
])
