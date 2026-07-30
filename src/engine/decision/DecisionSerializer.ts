/**
 * JSON round-tripping for a DecisionTraceRecord, for history and replay
 * consumers. Deliberately shallow: confirms a parsed value is shaped
 * correctly, not that it's a value buildDecisionTrace() itself would
 * produce.
 */
import {
  DecisionOutcome,
  DecisionReason,
  PolicyType,
} from '@shared-types/decision'
import type { Decision, DecisionTrace } from '@shared-types/decision'
import { CTIBand } from '@shared-types/risk'
import type { CTIResult, RiskIndicatorResult } from '@shared-types/risk'
import type { DecisionTraceRecord } from './DecisionTrace'

export type DecisionDeserializeResult =
  | { readonly deserialized: true; readonly record: DecisionTraceRecord }
  | { readonly deserialized: false; readonly errors: readonly string[] }

/** Serializes a DecisionTraceRecord to a JSON string. */
export function serializeDecisionTrace(record: DecisionTraceRecord): string {
  return JSON.stringify(record)
}

function isEnumValue<T extends string>(
  value: unknown,
  enumObject: Readonly<Record<string, T>>,
): value is T {
  return Object.values(enumObject).includes(value as T)
}

function isRiskIndicatorResult(value: unknown): value is RiskIndicatorResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.indicatorId === 'string' &&
    typeof candidate.rawValue === 'number' &&
    typeof candidate.normalizedValue === 'number' &&
    typeof candidate.weight === 'number'
  )
}

function isCTIResult(value: unknown): value is CTIResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.requestId === 'string' &&
    typeof candidate.score === 'number' &&
    isEnumValue(candidate.band, CTIBand) &&
    Array.isArray(candidate.indicators) &&
    candidate.indicators.every(isRiskIndicatorResult) &&
    typeof candidate.tick === 'number'
  )
}

const SAFETY_BRANCH_REASONS: readonly string[] = [
  DecisionReason.SafetyGateUnsafe,
  DecisionReason.WfgSafeState,
  DecisionReason.BankersSafeState,
  DecisionReason.BankersUnsafeState,
  DecisionReason.ResourceUnavailable,
]
const CTI_BRANCH_REASONS: readonly string[] = [
  DecisionReason.CtiBandGrant,
  DecisionReason.CtiBandHold,
  DecisionReason.InsufficientHeadroom,
]

function isDecisionTrace(value: unknown): value is DecisionTrace {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.summary !== 'string') {
    return false
  }
  if (SAFETY_BRANCH_REASONS.includes(candidate.reason as string)) {
    return true
  }
  if (CTI_BRANCH_REASONS.includes(candidate.reason as string)) {
    return (
      isCTIResult(candidate.cti) &&
      typeof candidate.hysteresisSuppressed === 'boolean'
    )
  }
  return false
}

function isDecision(value: unknown): value is Decision {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.requestId === 'string' &&
    isEnumValue(candidate.outcome, DecisionOutcome) &&
    isEnumValue(candidate.policy, PolicyType) &&
    isDecisionTrace(candidate.trace) &&
    typeof candidate.tick === 'number'
  )
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  )
}

/** Parses a JSON string back into a DecisionTraceRecord, reporting why it failed rather than throwing on malformed input. */
export function deserializeDecisionTrace(
  json: string,
): DecisionDeserializeResult {
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

  if (typeof candidate.requestId !== 'string') {
    errors.push('"requestId" must be a string.')
  }
  if (typeof candidate.tick !== 'number') {
    errors.push('"tick" must be a number.')
  }
  if (typeof candidate.timestamp !== 'number') {
    errors.push('"timestamp" must be a number.')
  }
  if (!isDecision(candidate.selected)) {
    errors.push('"selected" is not a well-formed Decision.')
  }
  if (
    !Array.isArray(candidate.supportingEvidence) ||
    !candidate.supportingEvidence.every(isDecision)
  ) {
    errors.push('"supportingEvidence" must be an array of Decision.')
  }
  if (typeof candidate.confidence !== 'number') {
    errors.push('"confidence" must be a number.')
  }
  if (!isStringArray(candidate.reasoningTrace)) {
    errors.push('"reasoningTrace" must be an array of strings.')
  }

  if (errors.length > 0) {
    return { deserialized: false, errors }
  }

  return {
    deserialized: true,
    record: {
      requestId: candidate.requestId as string,
      tick: candidate.tick as number,
      timestamp: candidate.timestamp as number,
      selected: candidate.selected as Decision,
      supportingEvidence: candidate.supportingEvidence as Decision[],
      confidence: candidate.confidence as number,
      reasoningTrace: candidate.reasoningTrace as string[],
    },
  }
}
