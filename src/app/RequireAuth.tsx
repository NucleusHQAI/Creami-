import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <p className="font-display text-2xl text-ink">CREAMi Deluxe</p>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <Splash />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
