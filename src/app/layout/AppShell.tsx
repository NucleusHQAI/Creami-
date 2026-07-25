import type { ReactNode } from 'react'
import { TopBar } from '@/app/layout/TopBar'
import { BottomNav } from '@/app/layout/BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-24 pt-4 sm:px-6 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  )
}
