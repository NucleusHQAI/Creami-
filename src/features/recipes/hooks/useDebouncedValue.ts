import { useEffect, useState } from 'react'

/** Returns `value`, delayed by `delayMs` — for debouncing search input. A subscription-like timer, so an effect is the right tool here. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
