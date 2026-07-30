/**
 * Measures how close the current wait-for graph is to forming — or
 * already sustaining — a cyclic wait: the strongest structural signal of
 * impending deadlock risk.
 *
 * What it measures: graph topology only, no timing (see
 * TemporalWaitingIndicator.ts for that angle).
 * Why it matters: a wait-for cycle is the textbook necessary condition
 * for deadlock in a single-instance-per-type system, and short of one, a
 * long unbroken wait chain is structurally one edge away from closing
 * into a cycle.
 * Inputs: the current Graph and its already-computed GraphMetrics (this
 * indicator never builds or mutates a Graph itself — that's
 * WaitForGraphBuilder's job).
 * Output: a [0, 1] score and a human-readable explanation.
 */
import type { Graph } from '@shared-types/graph'
import type { GraphMetrics } from '@engine/graph'

export interface CycleProximityScore {
  readonly score: number
  readonly explanation: string
}

/**
 * Longest directed chain of edges reachable from any node, computed via
 * memoized DFS. Only ever called when metrics.cycleCount === 0 (the graph
 * is acyclic), so the visiting guard below is a defensive fallback, not a
 * path expected to be taken.
 */
function longestChainLength(graph: Graph): number {
  const adjacency = new Map<string, string[]>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, [])
  }
  for (const edge of graph.edges) {
    const targets = adjacency.get(edge.fromProcessId)
    if (targets) {
      targets.push(edge.toProcessId)
    }
  }

  const memo = new Map<string, number>()
  const inProgress = new Set<string>()

  function longestFrom(nodeId: string): number {
    const cached = memo.get(nodeId)
    if (cached !== undefined) {
      return cached
    }
    if (inProgress.has(nodeId)) {
      return 0
    }
    inProgress.add(nodeId)
    let best = 0
    for (const next of adjacency.get(nodeId) ?? []) {
      best = Math.max(best, 1 + longestFrom(next))
    }
    inProgress.delete(nodeId)
    memo.set(nodeId, best)
    return best
  }

  let longest = 0
  for (const node of graph.nodes) {
    longest = Math.max(longest, longestFrom(node.id))
  }
  return longest
}

/**
 * A cycle already present is the maximal signal this indicator can
 * report: for the processes involved, structural deadlock has already
 * occurred. Short of that, the longest unbroken wait chain relative to
 * the largest chain the graph could possibly hold (nodeCount - 1 edges,
 * touching every process once) approximates how close the graph is to
 * closing a loop — a chain of length k needs exactly one more edge, back
 * to its start, to become a k+1 cycle.
 */
export function analyzeCycleProximity(
  graph: Graph,
  metrics: GraphMetrics,
): CycleProximityScore {
  if (metrics.nodeCount === 0) {
    return {
      score: 0,
      explanation: 'No active processes in the wait-for graph; no cyclic risk.',
    }
  }

  if (metrics.cycleCount > 0) {
    return {
      score: 1,
      explanation: `${String(metrics.cycleCount)} wait-for cycle(s) already present (largest involves ${String(metrics.largestCycleSize)} process(es)); maximal cyclic risk.`,
    }
  }

  const longestChain = longestChainLength(graph)
  const maxPossibleChain = Math.max(1, metrics.nodeCount - 1)
  const score = Math.min(1, longestChain / maxPossibleChain)

  return {
    score,
    explanation: `No cycle yet; the longest unbroken wait chain spans ${String(longestChain)} edge(s) out of a possible ${String(maxPossibleChain)} across ${String(metrics.nodeCount)} process(es) — one more edge closing this chain would form a cycle.`,
  }
}
