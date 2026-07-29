/**
 * Pure numeric helpers shared across the engine, state, and UI layers.
 * No imports, no side effects — every function is a plain value-in,
 * value-out transform.
 */

/** Restricts value to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Linear interpolation between a and b at fraction t. Not clamped — callers pass t outside [0, 1] for extrapolation intentionally. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Maps value from [min, max] onto [0, 1]. Returns 0 when min === max rather than dividing by zero. */
export function normalize(value: number, min: number, max: number): number {
  if (min === max) {
    return 0
  }
  return (value - min) / (max - min)
}

/** Arithmetic mean. Returns 0 for an empty array rather than NaN. */
export function average(numbers: readonly number[]): number {
  if (numbers.length === 0) {
    return 0
  }
  return numbers.reduce((total, n) => total + n, 0) / numbers.length
}

/** Rounds value to the given number of decimal places. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
