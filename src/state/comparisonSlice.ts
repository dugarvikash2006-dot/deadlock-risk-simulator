/**
 * ComparisonStore: pure storage for the latest already-computed result
 * from each engine — Banker's Algorithm, Wait-for Graph, CTI Risk, and
 * the Decision Engine — plus the latest ComparisonReport. No
 * calculations happen here: every setter just replaces one field.
 * Something outside this store (a future integration step, not this one)
 * is responsible for actually running the engines and calling these
 * setters with their results.
 */
import { useCallback, useMemo, useState } from 'react'
import type { SafetyCheckResult } from '@engine/banker'
import type { CycleResult } from '@shared-types/graph'
import type { RiskSnapshot } from '@engine/risk'
import type { DecisionAggregationResult } from '@engine/decision'
import type { ComparisonReport } from '@engine/comparison'

export interface ComparisonState {
  readonly bankerResult: SafetyCheckResult | null
  readonly wfgResult: readonly CycleResult[] | null
  readonly ctiResult: RiskSnapshot | null
  readonly decisionResult: DecisionAggregationResult | null
  readonly comparisonReport: ComparisonReport | null
}

const INITIAL_COMPARISON_STATE: ComparisonState = {
  bankerResult: null,
  wfgResult: null,
  ctiResult: null,
  decisionResult: null,
  comparisonReport: null,
}

export interface ComparisonSlice extends ComparisonState {
  readonly setBankerResult: (result: SafetyCheckResult | null) => void
  readonly setWfgResult: (result: readonly CycleResult[] | null) => void
  readonly setCtiResult: (result: RiskSnapshot | null) => void
  readonly setDecisionResult: (result: DecisionAggregationResult | null) => void
  readonly setComparisonReport: (report: ComparisonReport | null) => void
  readonly clear: () => void
}

export function useComparisonSlice(): ComparisonSlice {
  const [state, setState] = useState<ComparisonState>(INITIAL_COMPARISON_STATE)

  const setBankerResult = useCallback((result: SafetyCheckResult | null) => {
    setState((prev) => ({ ...prev, bankerResult: result }))
  }, [])
  const setWfgResult = useCallback((result: readonly CycleResult[] | null) => {
    setState((prev) => ({ ...prev, wfgResult: result }))
  }, [])
  const setCtiResult = useCallback((result: RiskSnapshot | null) => {
    setState((prev) => ({ ...prev, ctiResult: result }))
  }, [])
  const setDecisionResult = useCallback(
    (result: DecisionAggregationResult | null) => {
      setState((prev) => ({ ...prev, decisionResult: result }))
    },
    [],
  )
  const setComparisonReport = useCallback((report: ComparisonReport | null) => {
    setState((prev) => ({ ...prev, comparisonReport: report }))
  }, [])
  const clear = useCallback(() => {
    setState(INITIAL_COMPARISON_STATE)
  }, [])

  return useMemo(
    () => ({
      ...state,
      setBankerResult,
      setWfgResult,
      setCtiResult,
      setDecisionResult,
      setComparisonReport,
      clear,
    }),
    [
      state,
      setBankerResult,
      setWfgResult,
      setCtiResult,
      setDecisionResult,
      setComparisonReport,
      clear,
    ],
  )
}
