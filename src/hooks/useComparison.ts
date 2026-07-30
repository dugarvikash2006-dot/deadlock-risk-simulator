/**
 * Exposes ComparisonStore's state and actions, plus the derived
 * selectors that read from it (current CTI/STL/decision/comparison
 * report — selectors.ts). A thin pass-through plus selector calls — no
 * computation of its own.
 */
import { useStore } from '@state/storeContext'
import type { ComparisonSlice } from '@state/comparisonSlice'
import {
  selectCurrentComparisonReport,
  selectCurrentCti,
  selectCurrentDecision,
  selectCurrentStl,
} from '@state/selectors'
import type { CTIBand } from '@shared-types/risk'
import type { Decision } from '@shared-types/decision'
import type { ComparisonReport } from '@engine/comparison'

export interface ComparisonApi extends ComparisonSlice {
  readonly currentCti: number | null
  readonly currentStl: CTIBand | null
  readonly currentDecision: Decision | null
  readonly currentComparisonReport: ComparisonReport | null
}

export function useComparison(): ComparisonApi {
  const { comparison } = useStore()
  return {
    ...comparison,
    currentCti: selectCurrentCti(comparison),
    currentStl: selectCurrentStl(comparison),
    currentDecision: selectCurrentDecision(comparison),
    currentComparisonReport: selectCurrentComparisonReport(comparison),
  }
}
