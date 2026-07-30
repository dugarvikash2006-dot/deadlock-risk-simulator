import type { ReactNode } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'grant'
  | 'hold'
  | 'ctiLow'
  | 'ctiModerate'
  | 'ctiHigh'
  | 'ctiCritical'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-raised text-foreground-muted',
  grant: 'border-grant/40 bg-grant/15 text-grant',
  hold: 'border-hold/40 bg-hold/15 text-hold',
  ctiLow: 'border-cti-low/40 bg-cti-low/15 text-cti-low',
  ctiModerate: 'border-cti-moderate/40 bg-cti-moderate/15 text-cti-moderate',
  ctiHigh: 'border-cti-high/40 bg-cti-high/15 text-cti-high',
  ctiCritical: 'border-cti-critical/40 bg-cti-critical/15 text-cti-critical',
}

export interface BadgeProps {
  readonly tone?: BadgeTone
  readonly children: ReactNode
}

/** Small colored status label — statuses, outcomes, CTI bands. */
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-control border px-2 py-0.5 font-mono text-xs ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
