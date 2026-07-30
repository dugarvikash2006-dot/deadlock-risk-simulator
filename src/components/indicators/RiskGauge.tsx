import { memo } from 'react'
import { CTIBand } from '@shared-types/risk'

const BAND_COLOR_CLASS: Record<CTIBand, string> = {
  [CTIBand.Low]: 'bg-cti-low',
  [CTIBand.Moderate]: 'bg-cti-moderate',
  [CTIBand.High]: 'bg-cti-high',
  [CTIBand.Critical]: 'bg-cti-critical',
}

export interface RiskGaugeProps {
  readonly score: number
  readonly band: CTIBand
}

/** Pure presentational CTI gauge: a [0, 100] score and its band, already computed by the risk engine and passed in as props. No computation here. */
function RiskGaugeComponent({ score, band }: RiskGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score))
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xl text-foreground">
          {clamped.toFixed(1)}
        </span>
        <span className="font-mono text-xs text-foreground-muted">/ 100</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-control bg-surface-raised">
        <div
          className={`h-full ${BAND_COLOR_CLASS[band]}`}
          style={{ width: `${String(clamped)}%` }}
        />
      </div>
    </div>
  )
}

export const RiskGauge = memo(RiskGaugeComponent)
