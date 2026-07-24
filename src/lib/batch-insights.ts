// Pure statistics behind the freezer's "made N times" / "usually needs a
// re-spin" / "typically Nml of milk" insights (docs/06-feature-freezer.md §
// Insights). No React import — see CLAUDE.md on testing pure helpers where
// being wrong would be silently expensive.

/** Below this many data points, an average or mode is misleading rather than useful. */
export const INSIGHT_THRESHOLD = 3

export function hasEnoughData(count: number): boolean {
  return count >= INSIGHT_THRESHOLD
}

/** Most frequent value; ties break towards the smaller value for determinism. */
export function computeMode(values: readonly number[]): number | null {
  if (values.length === 0) return null

  const counts = new Map<number, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  let modeValue: number | null = null
  let modeCount = 0
  for (const [value, count] of counts) {
    if (count > modeCount || (count === modeCount && (modeValue === null || value < modeValue))) {
      modeValue = value
      modeCount = count
    }
  }
  return modeValue
}

export function computeMedian(values: readonly number[]): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? null
  }

  const lower = sorted[mid - 1]
  const upper = sorted[mid]
  if (lower === undefined || upper === undefined) return null
  return (lower + upper) / 2
}
