import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/app/LoginPage'
import StyleguidePage from '@/app/StyleguidePage'
import { RequireAuth } from '@/app/RequireAuth'
import { AppShell } from '@/app/layout/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

function RouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

const RecipeListPage = lazy(() => import('@/features/recipes/pages/RecipeListPage'))
const RecipeDetailPage = lazy(() => import('@/features/recipes/pages/RecipeDetailPage'))
const RecipeEditPage = lazy(() => import('@/features/recipes/pages/RecipeEditPage'))
const FreezerPage = lazy(() => import('@/features/freezer/pages/FreezerPage'))
const ShoppingPage = lazy(() => import('@/features/shopping/pages/ShoppingPage'))
const MorePage = lazy(() => import('@/features/reference/pages/MorePage'))
const BasesPage = lazy(() => import('@/features/reference/pages/BasesPage'))
const BaseEditPage = lazy(() => import('@/features/reference/pages/BaseEditPage'))
const MethodPage = lazy(() => import('@/features/reference/pages/MethodPage'))
const IngredientsPage = lazy(() => import('@/features/reference/pages/IngredientsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

function withShell(element: ReactNode) {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>{element}</Suspense>
      </AppShell>
    </RequireAuth>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/styleguide', element: <StyleguidePage /> },
  { path: '/', element: withShell(<RecipeListPage />) },
  { path: '/recipe/new', element: withShell(<RecipeEditPage />) },
  { path: '/recipe/:slug', element: withShell(<RecipeDetailPage />) },
  { path: '/recipe/:slug/edit', element: withShell(<RecipeEditPage />) },
  { path: '/freezer', element: withShell(<FreezerPage />) },
  { path: '/shopping', element: withShell(<ShoppingPage />) },
  { path: '/more', element: withShell(<MorePage />) },
  { path: '/bases', element: withShell(<BasesPage />) },
  { path: '/bases/:key', element: withShell(<BaseEditPage />) },
  { path: '/method', element: withShell(<MethodPage />) },
  { path: '/ingredients', element: withShell(<IngredientsPage />) },
  { path: '/settings', element: withShell(<SettingsPage />) },
])
