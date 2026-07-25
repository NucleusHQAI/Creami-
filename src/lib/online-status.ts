import { useSyncExternalStore } from 'react'
import { onlineManager, useMutationState } from '@tanstack/react-query'

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
    () => true,
  )
}

export function usePausedMutationCount(): number {
  const pausedStates = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.isPaused,
  })

  return pausedStates.filter(Boolean).length
}
