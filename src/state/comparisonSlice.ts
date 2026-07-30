/**
 * ComparisonStore: pure storage for the latest already-computed result
 * from each engine — Banker's Algorithm, Wait-for Graph, CTI Risk, and
 * the Decision Engine — plus the latest ComparisonReport, and a bounded
 * running history of full AnalysisResults for trend charts. No
 * calculations happen here: applyAnalysisResult() and the individual
 * setters just replace/append fields. AnalysisCoordinator.ts (Step 12) is
 * what actually runs the engines and calls applyAnalysisResult() with
 * the result, from StoreProvider's effect.
 */
import { useCallback, useMemo, useState } from 'react'
import type { SafetyCheckResult } from '@engine/banker'
import type { CycleResult } from '@shared-types/graph'
import type { RiskSnapshot } from '@engine/risk'
import type { DecisionAggregationResult } from '@engine/decision'
import type { ComparisonReport } from '@engine/comparison'
import type { AnalysisResult } from './analysisCoordinator'
import { HISTORY_LIMITS } from '@constants/simulationLimits'

export interface ComparisonState {
  readonly bankerResult: SafetyCheckResult | null
  readonly wfgResult: readonly CycleResult[] | null
  readonly ctiResult: RiskSnapshot | null
  readonly decisionResult: DecisionAggregationResult | null
  readonly comparisonReport: ComparisonReport | null
  /** Bounded running history of full AnalysisResults, one per analyzed tick — the source for CTI/STL/decision/agreement trend charts. Reset (tick === 0) starts a fresh history rather than appending to a prior run's. */
  readonly analysisHistory: readonly AnalysisResult[]
}

const INITIAL_COMPARISON_STATE: ComparisonState = {
  bankerResult: null,
  wfgResult: null,
  ctiResult: null,
  decisionResult: null,
  comparisonReport: null,
  analysisHistory: [],
}

export interface ComparisonSlice extends ComparisonState {
  readonly setBankerResult: (result: SafetyCheckResult | null) => void
  readonly setWfgResult: (result: readonly CycleResult[] | null) => void
  readonly setCtiResult: (result: RiskSnapshot | null) => void
  readonly setDecisionResult: (result: DecisionAggregationResult | null) => void
  readonly setComparisonReport: (report: ComparisonReport | null) => void
  /** Applies a full AnalysisResult: updates every "latest" field and appends it to analysisHistory in one action. */
  readonly applyAnalysisResult: (result: AnalysisResult) => void
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

  const applyAnalysisResult = useCallback((result: AnalysisResult) => {
    setState((prev) => {
      const priorHistory = result.tick === 0 ? [] : prev.analysisHistory
      const nextHistory = [...priorHistory, result]
      const analysisHistory =
        nextHistory.length > HISTORY_LIMITS.MAX_SNAPSHOTS
          ? nextHistory.slice(nextHistory.length - HISTORY_LIMITS.MAX_SNAPSHOTS)
          : nextHistory
      return {
        bankerResult: result.bankerResult,
        wfgResult: result.wfgResult,
        ctiResult: result.ctiResult,
        decisionResult: result.decisionResult,
        comparisonReport: result.comparisonReport,
        analysisHistory,
      }
    })
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
      applyAnalysisResult,
      clear,
    }),
    [
      state,
      setBankerResult,
      setWfgResult,
      setCtiResult,
      setDecisionResult,
      setComparisonReport,
      applyAnalysisResult,
      clear,
    ],
  )
}
