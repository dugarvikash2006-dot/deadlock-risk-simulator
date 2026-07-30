/**
 * JSON round-tripping for a ComparisonReport, for history and replay
 * consumers. Deliberately shallow: confirms a parsed value is shaped
 * correctly, not that it's a value buildComparisonReport() itself would
 * produce.
 *
 * Inputs (serialize): a ComparisonReport. Inputs (deserialize): a JSON
 * string.
 * Outputs: a JSON string / a ComparisonDeserializeResult.
 * Why: reports need to survive being written into history and read back
 * during replay, the same as every other engine's packaged snapshot.
 */
import { DecisionOutcome, PolicyType } from '@shared-types/decision'
import type { ComparisonReport } from './ComparisonReport'
import type { PolicyComparisonRow } from './PolicyComparison'
import { AgreementLevel } from './DifferenceAnalyzer'
import type { DifferenceAnalysis } from './DifferenceAnalyzer'

export type ComparisonDeserializeResult =
  | { readonly deserialized: true; readonly report: ComparisonReport }
  | { readonly deserialized: false; readonly errors: readonly string[] }

/** Serializes a ComparisonReport to a JSON string. */
export function serializeComparison(report: ComparisonReport): string {
  return JSON.stringify(report)
}

function isEnumValue<T extends string>(
  value: unknown,
  enumObject: Readonly<Record<string, T>>,
): value is T {
  return Object.values(enumObject).includes(value as T)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  )
}

function isPolicyComparisonRow(value: unknown): value is PolicyComparisonRow {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    isEnumValue(candidate.policy, PolicyType) &&
    isEnumValue(candidate.recommendation, DecisionOutcome) &&
    typeof candidate.reasoning === 'string' &&
    typeof candidate.agreesWithSelected === 'boolean'
  )
}

function isDifferenceAnalysis(value: unknown): value is DifferenceAnalysis {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    isEnumValue(candidate.level, AgreementLevel) &&
    typeof candidate.summary === 'string' &&
    typeof candidate.explanation === 'string' &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.every(isPolicyComparisonRow)
  )
}

/** Parses a JSON string back into a ComparisonReport, reporting why it failed rather than throwing on malformed input. */
export function deserializeComparison(
  json: string,
): ComparisonDeserializeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { deserialized: false, errors: ['Input is not valid JSON.'] }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { deserialized: false, errors: ['Parsed value is not an object.'] }
  }

  const candidate = parsed as Record<string, unknown>
  const errors: string[] = []

  if (typeof candidate.executiveSummary !== 'string') {
    errors.push('"executiveSummary" must be a string.')
  }
  if (
    !Array.isArray(candidate.policyTable) ||
    !candidate.policyTable.every(isPolicyComparisonRow)
  ) {
    errors.push('"policyTable" must be an array of PolicyComparisonRow.')
  }
  if (!isStringArray(candidate.keyObservations)) {
    errors.push('"keyObservations" must be an array of strings.')
  }
  if (!isDifferenceAnalysis(candidate.disagreements)) {
    errors.push('"disagreements" is not a well-formed DifferenceAnalysis.')
  }
  if (!isEnumValue(candidate.selectedPolicy, PolicyType)) {
    errors.push('"selectedPolicy" must be a valid PolicyType.')
  }
  if (!isStringArray(candidate.reasoningTrace)) {
    errors.push('"reasoningTrace" must be an array of strings.')
  }

  if (errors.length > 0) {
    return { deserialized: false, errors }
  }

  return {
    deserialized: true,
    report: {
      executiveSummary: candidate.executiveSummary as string,
      policyTable: candidate.policyTable as PolicyComparisonRow[],
      keyObservations: candidate.keyObservations as string[],
      disagreements: candidate.disagreements as DifferenceAnalysis,
      selectedPolicy: candidate.selectedPolicy as PolicyType,
      reasoningTrace: candidate.reasoningTrace as string[],
    },
  }
}
