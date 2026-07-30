import { memo } from 'react'
import { DecisionOutcome } from '@shared-types/decision'
import { Card } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { ComparisonChart } from './ComparisonChart'
import { useComparison } from '@hooks/useComparison'

/**
 * Comparison Panel: what each of Banker's, Wait-for Graph, and CTI
 * Graduated recommended, whether they agree or disagree, and why.
 * Reads the latest stored ComparisonReport from ComparisonStore
 * (useComparison()) — it doesn't build, run, or aggregate any
 * comparison itself.
 */
function ComparisonPanelComponent() {
  const { currentComparisonReport } = useComparison()

  if (!currentComparisonReport) {
    return (
      <Card title="Comparison">
        <p className="text-sm text-foreground-muted">
          No comparison has run yet.
        </p>
      </Card>
    )
  }

  const { executiveSummary, policyTable, keyObservations, disagreements } =
    currentComparisonReport

  return (
    <Card title="Comparison">
      <p className="text-sm text-foreground">{executiveSummary}</p>

      <ComparisonChart rows={policyTable} />

      <div className="overflow-x-auto">
        <table className="mt-4 w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-left text-foreground-muted">
              <th className="py-1.5 pr-3">Policy</th>
              <th className="py-1.5 pr-3">Recommendation</th>
              <th className="py-1.5 pr-3">Agrees</th>
              <th className="py-1.5">Reasoning</th>
            </tr>
          </thead>
          <tbody>
            {policyTable.map((row) => (
              <tr key={row.policy} className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-foreground">{row.policy}</td>
                <td className="py-1.5 pr-3">
                  <Badge
                    tone={
                      row.recommendation === DecisionOutcome.Grant
                        ? 'grant'
                        : 'hold'
                    }
                  >
                    {row.recommendation}
                  </Badge>
                </td>
                <td className="py-1.5 pr-3 text-foreground-muted">
                  {row.agreesWithSelected ? 'Yes' : 'No'}
                </td>
                <td className="py-1.5 text-foreground-muted">
                  {row.reasoning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <Badge tone={disagreements.level === 'Unanimous' ? 'grant' : 'hold'}>
          {disagreements.level}
        </Badge>
        <p className="mt-2 text-xs text-foreground-muted">
          {disagreements.explanation}
        </p>
      </div>

      {keyObservations.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-foreground-muted">
          {keyObservations.map((observation, index) => (
            <li key={index}>{observation}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export const ComparisonPanel = memo(ComparisonPanelComponent)
