/**
 * Classifies how much the three policies' recommendations agree, using
 * only the agreesWithSelected flags PolicyComparison.ts already
 * computed. With three binary (Grant/Hold) voters, confidence
 * (agreement count / 3) only ever takes three values — 1, 2/3, or 1/3 —
 * so the three-tier classification below maps directly onto it: full
 * agreement, a 2-1 majority, or the selected outcome actually being a
 * minority position (only kept because DecisionAggregator's conservative
 * consensus favors caution over a majority vote — see
 * DecisionAggregator.ts).
 *
 * Inputs: a PolicyComparisonResult (PolicyComparison.ts).
 * Outputs: DifferenceAnalysis — level, summary, explanation, and the
 * per-policy rows as evidence.
 * Why: "3 policies ran" isn't itself informative; whether they agreed,
 * and specifically who dissented and why, is what makes a comparison
 * report worth reading.
 */
import type {
  PolicyComparisonResult,
  PolicyComparisonRow,
} from './PolicyComparison'

export const AgreementLevel = {
  Unanimous: 'Unanimous',
  Partial: 'Partial',
  CompleteDisagreement: 'CompleteDisagreement',
} as const
export type AgreementLevel =
  (typeof AgreementLevel)[keyof typeof AgreementLevel]

export interface DifferenceAnalysis {
  readonly level: AgreementLevel
  readonly summary: string
  readonly explanation: string
  readonly evidence: readonly PolicyComparisonRow[]
}

/** Analyzes agreement/disagreement among the policy comparison's rows. */
export function analyzeDifferences(
  comparison: PolicyComparisonResult,
): DifferenceAnalysis {
  const total = comparison.rows.length
  const agreementCount = comparison.rows.filter(
    (row) => row.agreesWithSelected,
  ).length

  let level: AgreementLevel
  let summary: string
  if (agreementCount === total) {
    level = AgreementLevel.Unanimous
    summary = `All ${String(total)} policies agree: ${comparison.selectedPolicy} recommends the selected outcome with full consensus.`
  } else if (agreementCount * 2 > total) {
    level = AgreementLevel.Partial
    summary = `${String(agreementCount)} of ${String(total)} policies agree with the selected outcome.`
  } else {
    level = AgreementLevel.CompleteDisagreement
    summary = `Only ${String(agreementCount)} of ${String(total)} polic(ies) support the selected outcome — the majority actually disagreed, but conservative consensus favored caution over a majority vote.`
  }

  const dissenting = comparison.rows.filter((row) => !row.agreesWithSelected)
  const explanation =
    dissenting.length === 0
      ? 'Every policy reached the same recommendation independently.'
      : `Dissenting polic(ies): ${dissenting
          .map(
            (row) =>
              `${row.policy} recommends ${row.recommendation} (${row.reasoning})`,
          )
          .join('; ')}.`

  return { level, summary, explanation, evidence: comparison.rows }
}
