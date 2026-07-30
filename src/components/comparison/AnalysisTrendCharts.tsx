import { memo, useMemo } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CTIBand } from '@shared-types/risk'
import { DecisionOutcome } from '@shared-types/decision'
import { Card } from '@components/common/Card'
import { useComparison } from '@hooks/useComparison'

const BAND_LEVEL: Record<CTIBand, number> = {
  [CTIBand.Low]: 0,
  [CTIBand.Moderate]: 1,
  [CTIBand.High]: 2,
  [CTIBand.Critical]: 3,
}

interface TrendPoint {
  readonly tick: number
  readonly value: number
}

interface TrendChartProps {
  readonly label: string
  readonly data: readonly TrendPoint[]
  readonly domain: readonly [number, number]
  readonly color: string
}

function TrendChart({ label, data, domain, color }: TrendChartProps) {
  return (
    <div>
      <h3 className="mb-1 font-mono text-xs text-foreground-muted">{label}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-foreground-muted">No data yet.</p>
      ) : (
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
              <XAxis dataKey="tick" hide />
              <YAxis domain={domain} hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
                labelFormatter={(label: unknown) => `Tick ${String(label)}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

/**
 * Charts: CTI trend, STL history, decision history, and policy agreement
 * history, all read from ComparisonStore's analysisHistory (the bounded
 * running record AnalysisCoordinator/applyAnalysisResult build up — see
 * comparisonSlice.ts). Pure presentation over already-computed values:
 * STL bands are mapped to a numeric level (Low=0..Critical=3) and
 * decisions to 0/1 purely for charting purposes, not re-derived from
 * scratch. Entries with no outstanding request that tick (decisionResult
 * null) are skipped in the decision/agreement series, not shown as zero.
 */
function AnalysisTrendChartsComponent() {
  const { analysisHistory } = useComparison()

  const ctiSeries = useMemo<TrendPoint[]>(
    () =>
      analysisHistory.map((entry) => ({
        tick: entry.tick,
        value: entry.ctiResult.cti,
      })),
    [analysisHistory],
  )

  const stlSeries = useMemo<TrendPoint[]>(
    () =>
      analysisHistory.map((entry) => ({
        tick: entry.tick,
        value: BAND_LEVEL[entry.ctiResult.stl.band],
      })),
    [analysisHistory],
  )

  const decisionSeries = useMemo<TrendPoint[]>(() => {
    const points: TrendPoint[] = []
    for (const entry of analysisHistory) {
      if (entry.decisionResult) {
        points.push({
          tick: entry.tick,
          value:
            entry.decisionResult.selected.outcome === DecisionOutcome.Grant
              ? 1
              : 0,
        })
      }
    }
    return points
  }, [analysisHistory])

  const agreementSeries = useMemo<TrendPoint[]>(() => {
    const points: TrendPoint[] = []
    for (const entry of analysisHistory) {
      if (entry.decisionResult) {
        points.push({
          tick: entry.tick,
          value: entry.decisionResult.confidence,
        })
      }
    }
    return points
  }, [analysisHistory])

  if (analysisHistory.length === 0) {
    return (
      <Card title="Trends">
        <p className="text-sm text-foreground-muted">
          No analysis history yet.
        </p>
      </Card>
    )
  }

  return (
    <Card title="Trends">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrendChart
          label="CTI Trend"
          data={ctiSeries}
          domain={[0, 100]}
          color="#a855f7"
        />
        <TrendChart
          label="STL History"
          data={stlSeries}
          domain={[0, 3]}
          color="#ef4444"
        />
        <TrendChart
          label="Decision History"
          data={decisionSeries}
          domain={[0, 1]}
          color="#22c55e"
        />
        <TrendChart
          label="Policy Agreement"
          data={agreementSeries}
          domain={[0, 1]}
          color="#3b82f6"
        />
      </div>
    </Card>
  )
}

export const AnalysisTrendCharts = memo(AnalysisTrendChartsComponent)
