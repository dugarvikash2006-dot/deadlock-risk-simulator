/**
 * Deterministic pseudo-random number generation, seeded by a string.
 * seededRandom() returns a self-contained generator closure rather than
 * mutating module-level state, so determinism depends only on the seed
 * value passed in — required for reproducible scenario generation and
 * replay (see HistorySeries in types/history.ts).
 */

/** A deterministic source of floats in [0, 1), yielded by seededRandom(). */
export type RandomGenerator = () => number

/** Hashes a string seed into a 32-bit unsigned integer (FNV-1a). */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Builds a deterministic RandomGenerator from a seed string (mulberry32
 * PRNG). The same seed always produces the same output sequence.
 */
export function seededRandom(seed: string): RandomGenerator {
  let state = hashSeed(seed)

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A float in [min, max) drawn from the given generator. */
export function randomBetween(
  rng: RandomGenerator,
  min: number,
  max: number,
): number {
  return min + rng() * (max - min)
}

/** An integer in [min, max] (inclusive on both ends) drawn from the given generator. */
export function randomInteger(
  rng: RandomGenerator,
  min: number,
  max: number,
): number {
  return Math.floor(randomBetween(rng, min, max + 1))
}
