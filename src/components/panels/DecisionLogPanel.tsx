import { memo } from 'react'
import { DecisionOutcome } from '@shared-types/decision'
import { Card } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { useComparison } from '@hooks/useComparison'

/**
 * Decision Panel: selected policy, recommendation, confidence, and the
 * reasoning trace behind it. Reads the latest stored
 * DecisionAggregationResult from ComparisonStore (useComparison()) — it
 * doesn't run any policy or aggregate anything itself.
 */
function DecisionLogPanelComponent() {
  const { decisionResult } = useComparison()

  if (!decisionResult) {
    return (
      <Card title="Decision">
        <p className="text-sm text-foreground-muted">
          No decision has been made yet.
        </p>
      </Card>
    )
  }

  const { selected, confidence, reasoningTrace } = decisionResult

  return (
    <Card title="Decision">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-foreground">
          {selected.policy}
        </span>
        <Badge
          tone={selected.outcome === DecisionOutcome.Grant ? 'grant' : 'hold'}
        >
          {selected.outcome}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-foreground-muted">
        {selected.trace.summary}
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between font-mono text-xs text-foreground-muted">
          <span>Confidence</span>
          <span>{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-control bg-surface-raised">
          <div
            className="h-full bg-grant"
            style={{ width: `${String(confidence * 100)}%` }}
          />
        </div>
      </div>

      {reasoningTrace.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-foreground-muted">
          {reasoningTrace.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export const DecisionLogPanel = memo(DecisionLogPanelComponent)
