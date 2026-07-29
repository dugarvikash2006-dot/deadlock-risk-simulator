/**
 * Structural validation for a Graph value: duplicate node ids, malformed
 * or duplicated edges, self-loops, and edges that reference nodes which
 * don't exist. Reports everything found rather than throwing or silently
 * repairing — self-loops in particular are meaningful wait-for-graph data
 * (a process waiting on a resource it itself holds), so they're always
 * reported but never stripped or auto-fixed.
 */
import type { Graph } from '@shared-types/graph'

export type GraphValidationIssueKind =
  'DuplicateNode' | 'InvalidEdge' | 'SelfLoop' | 'OrphanReference'

export interface GraphValidationIssue {
  readonly kind: GraphValidationIssueKind
  readonly message: string
}

export interface GraphValidationResult {
  /** False only when a DuplicateNode, InvalidEdge, or OrphanReference issue was found — a self-loop alone never makes a graph invalid. */
  readonly valid: boolean
  readonly issues: readonly GraphValidationIssue[]
}

/** Validates a graph's structural well-formedness. Never mutates or repairs it. */
export function validateGraph(graph: Graph): GraphValidationResult {
  const issues: GraphValidationIssue[] = []
  const nodeIds = new Set<string>()

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        kind: 'DuplicateNode',
        message: `Node id "${node.id}" appears more than once.`,
      })
    }
    nodeIds.add(node.id)
  }

  const edgeIds = new Set<string>()
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        kind: 'InvalidEdge',
        message: `Edge id "${edge.id}" appears more than once.`,
      })
    }
    edgeIds.add(edge.id)

    if (!edge.fromProcessId || !edge.toProcessId || !edge.viaResourceId) {
      issues.push({
        kind: 'InvalidEdge',
        message: `Edge "${edge.id}" is missing a fromProcessId, toProcessId, or viaResourceId.`,
      })
    }

    if (edge.fromProcessId === edge.toProcessId) {
      issues.push({
        kind: 'SelfLoop',
        message: `Edge "${edge.id}" is a self-loop on node "${edge.fromProcessId}".`,
      })
    }

    if (edge.fromProcessId && !nodeIds.has(edge.fromProcessId)) {
      issues.push({
        kind: 'OrphanReference',
        message: `Edge "${edge.id}" references unknown source node "${edge.fromProcessId}".`,
      })
    }
    if (edge.toProcessId && !nodeIds.has(edge.toProcessId)) {
      issues.push({
        kind: 'OrphanReference',
        message: `Edge "${edge.id}" references unknown target node "${edge.toProcessId}".`,
      })
    }
  }

  const hasBlockingIssue = issues.some((issue) => issue.kind !== 'SelfLoop')
  return { valid: !hasBlockingIssue, issues }
}
