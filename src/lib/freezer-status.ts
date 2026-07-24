// Pure freeze-timing logic — no React import, so it is simple to unit test
// and to drive from the freezer screen's ticking `now` state (see
// docs/06-feature-freezer.md § The freezer screen). Built entirely on
// date-fns; never hand-rolls relative time.

import { format, formatDistance, isToday, isTomorrow } from 'date-fns'
import type { BatchStatus } from '@/types/domain'

export interface BatchTiming {
  status: string
  ready_at: string
}

/**
 * "Ready" is derived, never a stored status: a batch counts as ready when it
 * is still `freezing` and its `ready_at` has passed. The status column is
 * only ever written to when a person marks a batch spun or finished.
 */
export function deriveBatchStatus(batch: BatchTiming, now: Date = new Date()): BatchStatus {
  if (batch.status === 'freezing' && new Date(batch.ready_at).getTime() <= now.getTime()) {
    return 'ready'
  }
  return batch.status as BatchStatus
}

/** Display-only — the real `ready_at` is always set by the database trigger. */
export function computeReadyAt(frozenAt: Date, freezeHours: number): Date {
  return new Date(frozenAt.getTime() + freezeHours * 60 * 60 * 1000)
}

/** "today at 14:30" / "tomorrow at 14:30" / "Monday 27 July at 14:30" */
export function formatReadyAt(date: Date): string {
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `today at ${time}`
  if (isTomorrow(date)) return `tomorrow at ${time}`
  return `${format(date, 'EEEE d MMMM')} at ${time}`
}

/** "Ready in 6 hours" for a batch still freezing. */
export function formatCountdown(readyAt: Date, now: Date = new Date()): string {
  return `Ready ${formatDistance(readyAt, now, { addSuffix: true })}`
}

/** "Frozen 26 hours ago" for a batch that has passed its ready time. */
export function formatFrozenAgo(frozenAt: Date, now: Date = new Date()): string {
  return `Frozen ${formatDistance(frozenAt, now, { addSuffix: true })}`
}

export interface ActiveBatchGroups<T> {
  ready: T[]
  freezing: T[]
  spun: T[]
}

/** Groups active batches by derived status, freezing/ready soonest-ready first. */
export function groupActiveBatches<T extends BatchTiming>(
  batches: T[],
  now: Date = new Date(),
): ActiveBatchGroups<T> {
  const ready: T[] = []
  const freezing: T[] = []
  const spun: T[] = []

  for (const batch of batches) {
    const derived = deriveBatchStatus(batch, now)
    if (derived === 'ready') ready.push(batch)
    else if (derived === 'freezing') freezing.push(batch)
    else if (derived === 'spun') spun.push(batch)
  }

  freezing.sort((a, b) => new Date(a.ready_at).getTime() - new Date(b.ready_at).getTime())
  ready.sort((a, b) => new Date(a.ready_at).getTime() - new Date(b.ready_at).getTime())

  return { ready, freezing, spun }
}
