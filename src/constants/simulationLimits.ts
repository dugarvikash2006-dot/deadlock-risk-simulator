/**
 * Fixed system bounds (Phase 1 NFR-1 / Phase 3 §11). No imports.
 */

/** Scale constraints on a single scenario. */
export const SIMULATION_LIMITS = {
  MAX_PROCESSES: 20,
  MAX_RESOURCE_TYPES: 10,
  MAX_TICKS_PER_RUN: 200,
} as const

/** Replay/storage retention constraints — distinct concern from scenario scale, even though it shares a value with MAX_TICKS_PER_RUN at MVP scope (one snapshot is stored per tick). */
export const HISTORY_LIMITS = {
  MAX_SNAPSHOTS: 200,
} as const
