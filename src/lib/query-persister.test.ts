import { describe, expect, it, vi } from 'vitest'
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query'
import type { MutationState } from '@tanstack/react-query'
import type { PersistedClient } from '@tanstack/react-query-persist-client'
import {
  createQueryPersister,
  resumePausedMutationsAndRefresh,
  shouldPersistMutation,
  type QueryCacheStorage,
} from '@/lib/query-persister'
import { mutationKeys } from '@/lib/query-keys'

const persistedClient: PersistedClient = {
  buster: '0.1.0',
  timestamp: 123,
  clientState: {
    mutations: [],
    queries: [],
  },
}

describe('createQueryPersister', () => {
  it('stores, restores and removes the persisted Query client', async () => {
    const storage: QueryCacheStorage = {
      get: vi.fn().mockResolvedValue(persistedClient),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    }
    const persister = createQueryPersister(storage)

    await persister.persistClient(persistedClient)
    await expect(persister.restoreClient()).resolves.toEqual(persistedClient)
    await persister.removeClient()

    expect(storage.set).toHaveBeenCalledWith('creami-query-cache', persistedClient)
    expect(storage.get).toHaveBeenCalledWith('creami-query-cache')
    expect(storage.del).toHaveBeenCalledWith('creami-query-cache')
  })

  it('persists only supported paused mutations and resumes with original variables', async () => {
    const sourceClient = new QueryClient()
    const timestamp = '2026-07-25T12:00:00.000Z'
    const pausedState: MutationState<unknown, Error, unknown, unknown> = {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: true,
      status: 'pending',
      variables: { id: 'batch-1', finishedAt: timestamp },
      submittedAt: 1,
    }

    sourceClient.getMutationCache().build(
      sourceClient,
      { mutationKey: mutationKeys.markFinished },
      pausedState,
    )
    sourceClient.getMutationCache().build(
      sourceClient,
      { mutationKey: ['unsafe-edit'] },
      { ...pausedState, variables: { id: 'base-1' } },
    )

    const dehydrated = dehydrate(sourceClient, {
      shouldDehydrateMutation: shouldPersistMutation,
    })

    expect(dehydrated.mutations).toHaveLength(1)

    const mutationFn = vi.fn().mockResolvedValue(undefined)
    const restoredClient = new QueryClient()
    restoredClient.setMutationDefaults(mutationKeys.markFinished, { mutationFn })
    hydrate(restoredClient, dehydrated)
    const invalidateQueries = vi.spyOn(restoredClient, 'invalidateQueries')

    await resumePausedMutationsAndRefresh(restoredClient)

    expect(mutationFn).toHaveBeenCalledWith(
      { id: 'batch-1', finishedAt: timestamp },
      expect.objectContaining({ mutationKey: mutationKeys.markFinished }),
    )
    expect(invalidateQueries).toHaveBeenCalledOnce()
  })
})
