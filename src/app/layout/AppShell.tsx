import type { ReactNode } from 'react'
import { TopBar } from '@/app/layout/TopBar'
import { BottomNav } from '@/app/layout/BottomNav'
import { OfflineBanner } from '@/components/OfflineBanner'
import { useOnlineStatus, usePausedMutationCount } from '@/lib/online-status'

export function AppShell({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus()
  const pendingCount = usePausedMutationCount()

  return (
    <div className="min-h-dvh bg-cream">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-soft bg-ink px-4 py-2 text-cream focus:fixed focus:left-4 focus:top-4 focus:not-sr-only"
      >
        Skip to main content
      </a>
      <TopBar />
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-content px-5 pb-28 pt-10 sm:px-6 md:pb-12 md:pt-10"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
