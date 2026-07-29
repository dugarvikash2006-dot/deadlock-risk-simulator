/**
 * Pure time helpers shared across the engine, state, and UI layers.
 * now() reads the system clock but performs no I/O beyond that and never
 * touches the DOM — it exists to timestamp simulation runs, not drive them.
 */

/** Current time in epoch milliseconds. */
export function now(): number {
  return Date.now()
}

/** Milliseconds elapsed between two epoch timestamps. Never negative, regardless of argument order. */
export function elapsed(start: number, end: number): number {
  return Math.max(0, end - start)
}

/** Formats a millisecond duration as a compact "1h 2m 3s" string, or "<n>ms" under one second. */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${String(Math.round(milliseconds))}ms`
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${String(hours)}h`)
  }
  if (minutes > 0) {
    parts.push(`${String(minutes)}m`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${String(seconds)}s`)
  }

  return parts.join(' ')
}
