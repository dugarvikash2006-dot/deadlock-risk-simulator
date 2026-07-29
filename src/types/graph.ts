/**
 * Wait-for graph models. No dependencies on other type modules — node and
 * edge references are plain string ids, not object references, so the
 * graph engine can serialize/diff graphs without pulling in domain types.
 */

export const NodeType = {
  Process: 'Process',
  Resource: 'Resource',
} as const
export type NodeType = (typeof NodeType)[keyof typeof NodeType]

export interface GraphNode {
  readonly id: string
  readonly type: NodeType
}

export interface GraphEdge {
  readonly id: string
  /** The waiting process. */
  readonly fromProcessId: string
  /** The process currently holding the contended resource. */
  readonly toProcessId: string
  readonly viaResourceId: string
}

export interface Graph {
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
  readonly tick: number
}

/**
 * Ground-truth safety oracle output. Shared by the Classical WFG baseline
 * policy and the Safety Gate that underlies all three decision policies —
 * see Phase 2 §1 for why this dual role is intentional.
 */
export interface CycleResult {
  readonly hasCycle: boolean
  readonly involvedNodeIds: readonly string[]
}
