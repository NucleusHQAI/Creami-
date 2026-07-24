import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeReadyAt,
  deriveBatchStatus,
  formatReadyAt,
  groupActiveBatches,
} from '@/lib/freezer-status'

describe('deriveBatchStatus', () => {
  it('reports ready when still freezing and ready_at has passed', () => {
    const now = new Date('2026-07-24T12:00:00Z')
    const batch = { status: 'freezing', ready_at: '2026-07-23T11:00:00Z' } // 25 hours ago
    expect(deriveBatchStatus(batch, now)).toBe('ready')
  })

  it('reports freezing when ready_at has not passed', () => {
    const now = new Date('2026-07-24T12:00:00Z')
    const batch = { status: 'freezing', ready_at: '2026-07-25T00:00:00Z' }
    expect(deriveBatchStatus(batch, now)).toBe('freezing')
  })

  it('treats ready_at exactly now as ready', () => {
    const now = new Date('2026-07-24T12:00:00Z')
    const batch = { status: 'freezing', ready_at: '2026-07-24T12:00:00Z' }
    expect(deriveBatchStatus(batch, now)).toBe('ready')
  })

  it('never derives a status from a non-freezing row — it is only ever written by a person', () => {
    const now = new Date('2026-07-24T12:00:00Z')
    expect(deriveBatchStatus({ status: 'spun', ready_at: '2020-01-01T00:00:00Z' }, now)).toBe(
      'spun',
    )
    expect(deriveBatchStatus({ status: 'finished', ready_at: '2020-01-01T00:00:00Z' }, now)).toBe(
      'finished',
    )
  })
})

describe('computeReadyAt', () => {
  it('adds freeze_hours to frozen_at', () => {
    const frozenAt = new Date('2026-07-24T10:00:00Z')
    expect(computeReadyAt(frozenAt, 24).toISOString()).toBe('2026-07-25T10:00:00.000Z')
  })

  it('handles a non-default freeze_hours setting', () => {
    const frozenAt = new Date('2026-07-24T10:00:00Z')
    expect(computeReadyAt(frozenAt, 12).toISOString()).toBe('2026-07-24T22:00:00.000Z')
  })
})

describe('groupActiveBatches', () => {
  it('buckets a batch frozen 25 hours ago as ready without anything having been written to it', () => {
    const now = new Date('2026-07-24T12:00:00Z')
    const batches = [
      { id: 'a', status: 'freezing', ready_at: '2026-07-23T11:00:00Z' }, // ready
      { id: 'b', status: 'freezing', ready_at: '2026-07-25T00:00:00Z' }, // still freezing
      { id: 'c', status: 'spun', ready_at: '2026-07-20T00:00:00Z' },
    ]
    const groups = groupActiveBatches(batches, now)
    expect(groups.ready.map((b) => b.id)).toEqual(['a'])
    expect(groups.freezing.map((b) => b.id)).toEqual(['b'])
    expect(groups.spun.map((b) => b.id)).toEqual(['c'])
  })

  it('sorts freezing batches soonest-ready first', () => {
    const now = new Date('2026-07-24T00:00:00Z')
    const batches = [
      { id: 'later', status: 'freezing', ready_at: '2026-07-26T00:00:00Z' },
      { id: 'sooner', status: 'freezing', ready_at: '2026-07-25T00:00:00Z' },
    ]
    const groups = groupActiveBatches(batches, now)
    expect(groups.freezing.map((b) => b.id)).toEqual(['sooner', 'later'])
  })

  it('excludes finished batches from every active bucket', () => {
    const now = new Date('2026-07-24T00:00:00Z')
    const batches = [{ id: 'done', status: 'finished', ready_at: '2020-01-01T00:00:00Z' }]
    const groups = groupActiveBatches(batches, now)
    expect(groups.ready).toHaveLength(0)
    expect(groups.freezing).toHaveLength(0)
    expect(groups.spun).toHaveLength(0)
  })
})

describe('formatReadyAt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-24T09:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('labels a time later today as "today"', () => {
    expect(formatReadyAt(new Date('2026-07-24T14:30:00'))).toBe('today at 14:30')
  })

  it('labels a time tomorrow as "tomorrow"', () => {
    expect(formatReadyAt(new Date('2026-07-25T14:30:00'))).toBe('tomorrow at 14:30')
  })

  it('labels a further-out date with its weekday and date', () => {
    expect(formatReadyAt(new Date('2026-07-27T09:15:00'))).toBe('Monday 27 July at 09:15')
  })
})
