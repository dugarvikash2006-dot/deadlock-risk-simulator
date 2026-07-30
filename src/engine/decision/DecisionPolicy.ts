/**
 * Registry of every implemented DecisionPolicy, keyed by PolicyType.
 * DecisionAggregator uses this to run all three policies against the
 * same DecisionContext components without hardcoding which policies
 * exist, keeping the "apples-to-apples comparison" (types/decision.ts)
 * a one-place-to-extend concern.
 */
import { PolicyType } from '@shared-types/decision'
import type { DecisionPolicy } from '@shared-types/decision'
import { BankersPolicy } from './policies/BankersPolicy'
import { ClassicalWfgPolicy } from './policies/ClassicalWfgPolicy'
import { CtiGraduatedPolicy } from './policies/CtiGraduatedPolicy'

export const POLICY_REGISTRY: Readonly<Record<PolicyType, DecisionPolicy>> = {
  [PolicyType.Bankers]: BankersPolicy,
  [PolicyType.ClassicalWfg]: ClassicalWfgPolicy,
  [PolicyType.CtiGraduated]: CtiGraduatedPolicy,
}

/** All three policies, in the project's canonical (README) order — used wherever a fixed, deterministic iteration order matters. */
export const ALL_POLICIES: readonly DecisionPolicy[] = [
  BankersPolicy,
  ClassicalWfgPolicy,
  CtiGraduatedPolicy,
]
