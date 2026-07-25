import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '@/app/ToastProvider'

export function PwaUpdatePrompt() {
  const hasPromptedForRefresh = useRef(false)
  const { showToast } = useToast()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh || hasPromptedForRefresh.current) {
      return
    }

    hasPromptedForRefresh.current = true
    showToast('New version available', {
      actionLabel: 'Reload',
      durationMs: 60_000,
      onAction: () => {
        void updateServiceWorker(true)
      },
    })
  }, [needRefresh, showToast, updateServiceWorker])

  return null
}
