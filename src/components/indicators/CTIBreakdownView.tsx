import { memo } from 'react'
import { CTIBand } from '@shared-types/risk'
import { Card } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import type { BadgeTone } from '@components/common/Badge'
import { RiskGauge } from './RiskGauge'
import { useComparison } from '@hooks/useComparison'

const STL_TONE: Record<CTIBand, BadgeTone> = {
  [CTIBand.Low]: 'ctiLow',
  [CTIBand.Moderate]: 'ctiModerate',
  [CTIBand.High]: 'ctiHigh',
  [CTIBand.Critical]: 'ctiCritical',
}

/**
 * CTI Panel: CTI score, STL band, and the per-indicator breakdown.
 * Reads the latest stored RiskSnapshot from ComparisonStore
 * (useComparison()) — it doesn't compute CTI/STL itself, and shows an
 * honest empty state until something populates that store.
 */
function CTIBreakdownViewComponent() {
  const { ctiResult } = useComparison()

  if (!ctiResult) {
    return (
      <Card title="CTI Panel">
        <p className="text-sm text-foreground-muted">
          No CTI data yet — run a comparison to populate this panel.
        </p>
      </Card>
    )
  }

  return (
    <Card title="CTI Panel">
      <RiskGauge score={ctiResult.cti} band={ctiResult.stl.band} />
      <div className="mt-3">
        <Badge tone={STL_TONE[ctiResult.stl.band]}>
          {ctiResult.stl.band} tension
        </Badge>
      </div>

      <h3 className="mt-4 mb-2 font-mono text-xs tracking-wide text-foreground-muted uppercase">
        Indicator Breakdown
      </h3>
      {ctiResult.indicators.length === 0 ? (
        <p className="text-xs text-foreground-muted">No indicators recorded.</p>
      ) : (
        <ul className="space-y-2">
          {ctiResult.indicators.map((indicator) => (
            <li
              key={indicator.indicatorId}
              className="rounded-control border border-border bg-surface-raised p-2"
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-foreground">{indicator.indicatorId}</span>
                <span className="text-foreground-muted">
                  {indicator.score.toFixed(2)} &times;{' '}
                  {indicator.weight.toFixed(2)} ={' '}
                  {indicator.weightedContribution.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                {indicator.explanation}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export const CTIBreakdownView = memo(CTIBreakdownViewComponent)
