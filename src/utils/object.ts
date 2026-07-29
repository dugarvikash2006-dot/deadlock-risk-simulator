/**
 * Pure structural helpers for working with the project's immutable
 * domain/state objects (SimulationState snapshots, config, etc.).
 */

/**
 * Deep-clones a value via the structured clone algorithm. Intended for the
 * project's plain, JSON-safe domain/state shapes — not for values
 * containing functions or circular references.
 */
export function deepClone<T>(value: T): T {
  return structuredClone(value)
}

/** Recursively freezes an object graph in place and returns it, typed as fully readonly. */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  ) {
    const target = value as unknown as Record<string, unknown>
    for (const propKey of Object.getOwnPropertyNames(target)) {
      const propValue = target[propKey]
      if (propValue !== null && typeof propValue === 'object') {
        deepFreeze(propValue)
      }
    }
    Object.freeze(target)
  }
  return value
}
