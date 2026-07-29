/**
 * Pure, generic array helpers shared across the engine, state, and UI
 * layers. None mutate their input.
 */

/** Distinct values, preserving first-seen order. */
export function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items))
}

/** Sum of a numeric array. Returns 0 for an empty array. */
export function sum(numbers: readonly number[]): number {
  return numbers.reduce((total, n) => total + n, 0)
}

/** The item with the largest key(item) value, or undefined for an empty array. */
export function maxBy<T>(
  items: readonly T[],
  key: (item: T) => number,
): T | undefined {
  return items.reduce<T | undefined>((best, item) => {
    if (best === undefined || key(item) > key(best)) {
      return item
    }
    return best
  }, undefined)
}

/** The item with the smallest key(item) value, or undefined for an empty array. */
export function minBy<T>(
  items: readonly T[],
  key: (item: T) => number,
): T | undefined {
  return items.reduce<T | undefined>((best, item) => {
    if (best === undefined || key(item) < key(best)) {
      return item
    }
    return best
  }, undefined)
}

/** Buckets items by key(item), preserving each bucket's insertion order. */
export function groupBy<T, K extends string | number>(
  items: readonly T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const groups = {} as Record<K, T[]>
  for (const item of items) {
    const groupKey = key(item)
    if (Object.hasOwn(groups, groupKey)) {
      groups[groupKey].push(item)
    } else {
      groups[groupKey] = [item]
    }
  }
  return groups
}

/** Splits items into consecutive chunks of at most size length. Returns [] when size <= 0. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) {
    return []
  }
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
