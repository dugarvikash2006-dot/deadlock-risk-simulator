/**
 * Structural graph metrics: shape and connectivity only — node/edge
 * counts, degree, density, connected components, and cycle size/count.
 * No CTI, no risk weighting, no scoring of any kind; that belongs to the
 * risk engine (a separate, later module) which consumes a Graph, not the
 * other way around.
 */
import type { Graph } from '@shared-types/graph'
import { average } from '@utils/math'
import { findCycles } from './CycleDetector'

export interface GraphMetrics {
  readonly nodeCount: number
  readonly edgeCount: number
  /** Ids of nodes with neither incoming nor outgoing edges. */
  readonly isolatedNodes: readonly string[]
  readonly averageOutDegree: number
  readonly averageInDegree: number
  /** edgeCount / (nodeCount * (nodeCount - 1)); 0 when nodeCount <= 1. */
  readonly density: number
  /** Number of weakly connected components (edges treated as undirected). */
  readonly connectedComponents: number
  /** Node count of the largest independent cycle; 0 when the graph has no cycle. */
  readonly largestCycleSize: number
  readonly cycleCount: number
}

function buildUndirectedAdjacency(graph: Graph): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set())
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.fromProcessId)?.add(edge.toProcessId)
    adjacency.get(edge.toProcessId)?.add(edge.fromProcessId)
  }
  return adjacency
}

function countConnectedComponents(graph: Graph): number {
  const adjacency = buildUndirectedAdjacency(graph)
  const visited = new Set<string>()
  let components = 0

  for (const node of graph.nodes) {
    if (visited.has(node.id)) {
      continue
    }
    components += 1
    const stack = [node.id]
    while (stack.length > 0) {
      const current = stack.pop()
      if (current === undefined || visited.has(current)) {
        continue
      }
      visited.add(current)
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor)
        }
      }
    }
  }
  return components
}

/** Computes structural metrics for a graph snapshot. Pure — never mutates graph. */
export function computeGraphMetrics(graph: Graph): GraphMetrics {
  const nodeCount = graph.nodes.length
  const edgeCount = graph.edges.length

  const outDegree = new Map<string, number>()
  const inDegree = new Map<string, number>()
  for (const node of graph.nodes) {
    outDegree.set(node.id, 0)
    inDegree.set(node.id, 0)
  }
  for (const edge of graph.edges) {
    outDegree.set(
      edge.fromProcessId,
      (outDegree.get(edge.fromProcessId) ?? 0) + 1,
    )
    inDegree.set(edge.toProcessId, (inDegree.get(edge.toProcessId) ?? 0) + 1)
  }

  const isolatedNodes = graph.nodes
    .filter(
      (node) =>
        (outDegree.get(node.id) ?? 0) === 0 &&
        (inDegree.get(node.id) ?? 0) === 0,
    )
    .map((node) => node.id)

  const density = nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1)) : 0

  const cycles = findCycles(graph)
  const largestCycleSize = cycles.reduce(
    (max, cycle) => Math.max(max, cycle.involvedNodeIds.length),
    0,
  )

  return {
    nodeCount,
    edgeCount,
    isolatedNodes,
    averageOutDegree: average(Array.from(outDegree.values())),
    averageInDegree: average(Array.from(inDegree.values())),
    density,
    connectedComponents: countConnectedComponents(graph),
    largestCycleSize,
    cycleCount: cycles.length,
  }
}
