import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { onlineManager, QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { supabase } from '@/lib/supabase'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { ToastProvider } from '@/app/ToastProvider'
import {
  createQueryPersister,
  resumePausedMutationsAndRefresh,
  shouldPersistMutation,
} from '@/lib/query-persister'
import { toggleFavourite } from '@/lib/api/recipes'
import { markFinished, markSpun, type MarkSpunInput } from '@/lib/api/batches'
import { setCheck, toggleExtra } from '@/lib/api/shopping'
import { mutationKeys } from '@/lib/query-keys'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AppProviders')
  }
  return context
}

// refetchOnWindowFocus is off by default; the active-batches query (Task 28)
// opts back in explicitly, since that's the one case where a stale answer
// ("nothing ready") is actively misleading.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'always',
    },
  },
})

queryClient.setMutationDefaults(mutationKeys.toggleFavourite, {
  mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleFavourite(id, next),
  networkMode: 'online',
  retry: 3,
})
queryClient.setMutationDefaults(mutationKeys.setCheck, {
  mutationFn: ({ ingredientId, next }: { ingredientId: string; next: boolean }) =>
    setCheck(ingredientId, next),
  networkMode: 'online',
  retry: 3,
})
queryClient.setMutationDefaults(mutationKeys.toggleExtra, {
  mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleExtra(id, next),
  networkMode: 'online',
  retry: 3,
})
queryClient.setMutationDefaults(mutationKeys.markSpun, {
  mutationFn: ({
    id,
    input,
    spunAt,
  }: {
    id: string
    input: MarkSpunInput
    spunAt: string
  }) => markSpun(id, input, spunAt),
  networkMode: 'online',
  retry: 3,
})
queryClient.setMutationDefaults(mutationKeys.markFinished, {
  mutationFn: ({ id, finishedAt }: { id: string; finishedAt: string }) =>
    markFinished(id, finishedAt),
  networkMode: 'online',
  retry: 3,
})

const queryPersister = createQueryPersister()
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(
    () =>
      onlineManager.subscribe((isOnline) => {
        if (!isOnline) {
          return
        }

        void resumePausedMutationsAndRefresh(queryClient)
      }),
    [],
  )

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: THIRTY_DAYS_MS,
          buster: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
          dehydrateOptions: {
            shouldDehydrateMutation: shouldPersistMutation,
          },
        }}
        onSuccess={() => resumePausedMutationsAndRefresh(queryClient)}
      >
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  )
}
