import { del, get, set } from 'idb-keyval'
import {
  defaultShouldDehydrateMutation,
  type Mutation,
  type QueryClient,
} from '@tanstack/react-query'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'
import { mutationKeys } from '@/lib/query-keys'

const QUERY_CACHE_KEY = 'creami-query-cache'
const PERSISTED_MUTATION_NAMES = new Set<string>(
  Object.values(mutationKeys).map(([mutationName]) => mutationName),
)

export interface QueryCacheStorage {
  get: (key: IDBValidKey) => Promise<PersistedClient | undefined>
  set: (key: IDBValidKey, value: PersistedClient) => Promise<unknown>
  del: (key: IDBValidKey) => Promise<void>
}

const indexedDbStorage: QueryCacheStorage = {
  get,
  set,
  del,
}

export function createQueryPersister(
  storage: QueryCacheStorage = indexedDbStorage,
): Persister {
  return {
    persistClient: async (client) => {
      await storage.set(QUERY_CACHE_KEY, client)
    },
    restoreClient: () => storage.get(QUERY_CACHE_KEY),
    removeClient: () => storage.del(QUERY_CACHE_KEY),
  }
}

export function shouldPersistMutation(mutation: Mutation): boolean {
  const mutationKey = mutation.options.mutationKey

  return (
    defaultShouldDehydrateMutation(mutation) &&
    mutationKey?.length === 1 &&
    typeof mutationKey[0] === 'string' &&
    PERSISTED_MUTATION_NAMES.has(mutationKey[0])
  )
}

export async function resumePausedMutationsAndRefresh(queryClient: QueryClient): Promise<void> {
  await queryClient.resumePausedMutations()
  await queryClient.invalidateQueries()
}
