import type { ThemeConfig } from '@shared-types/config'

/**
 * Mirrors the Tailwind @theme tokens in src/index.css. The CSS tokens
 * drive utility classes; this TS copy exists for JS-side consumers that
 * can't use Tailwind classes directly (e.g. Recharts fill/stroke props,
 * d3-force-driven inline styles). Keep both in sync if either changes.
 */
export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    grant: '#22c55e',
    hold: '#3b82f6',
    ctiLow: '#22c55e',
    ctiModerate: '#3b82f6',
    ctiHigh: '#a855f7',
    ctiCritical: '#ef4444',
  },
}
