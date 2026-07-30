import { memo, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { BarShapeProps } from 'recharts'
import { DecisionOutcome } from '@shared-types/decision'
import type { PolicyType } from '@shared-types/decision'
import type { PolicyComparisonRow } from '@engine/comparison'

export interface ComparisonChartProps {
  readonly rows: readonly PolicyComparisonRow[]
}

const GRANT_COLOR = '#22c55e'
const HOLD_COLOR = '#3b82f6'

interface ChartDatum {
  readonly policy: PolicyType
  readonly value: number
  readonly outcome: DecisionOutcome
}

/** Bar's `payload` is typed `any` upstream (recharts); this is the one, explicit, narrow cast back to the shape we gave it. */
function renderOutcomeBar(props: BarShapeProps) {
  const payload = props.payload as ChartDatum
  const fill =
    payload.outcome === DecisionOutcome.Grant ? GRANT_COLOR : HOLD_COLOR
  return (
    <rect
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      rx={4}
      fill={fill}
    />
  )
}

/**
 * At-a-glance visual for the policy comparison table below it: one
 * full-width bar per policy, colored by its recommendation. Pure
 * presentation over already-computed PolicyComparisonRow data — no
 * computation of its own.
 */
function ComparisonChartComponent({ rows }: ComparisonChartProps) {
  const data = useMemo<ChartDatum[]>(
    () =>
      rows.map((row) => ({
        policy: row.policy,
        value: 1,
        outcome: row.recommendation,
      })),
    [rows],
  )

  return (
    <div className="mt-3 h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
        >
          <XAxis type="number" hide domain={[0, 1]} />
          <YAxis
            type="category"
            dataKey="policy"
            width={90}
            tick={{ fill: 'var(--color-foreground-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="value" shape={renderOutcomeBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const ComparisonChart = memo(ComparisonChartComponent)
