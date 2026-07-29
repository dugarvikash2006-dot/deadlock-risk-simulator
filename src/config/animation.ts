import type { AnimationConfig } from '@shared-types/config'

/** Matches the three animation tiers from Phase 4 §2. */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  fastMs: 175,
  moderateMs: 350,
  emphasisMs: 700,
}
