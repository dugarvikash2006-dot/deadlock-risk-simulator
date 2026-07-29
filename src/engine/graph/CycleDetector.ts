/**
 * Cycle detection via Tarjan's strongly-connected-components algorithm —
 * chosen because it finds every SCC in a single linear-time (O(V+E))
 * pass, needs no explicit graph transpose (unlike Kosaraju), and its
 * traversal order is fully determined by graph.nodes/graph.edges array
 * order, so results are reproducible for a given Graph value. Read-only:
 * nothing here ever mutates the input graph.
 */
import type { CycleResult, Graph } from '@shared-types/graph'

function buildAdjacency(graph: Graph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, [])
  }
  for (const edge of graph.edges) {
    const targets = adjacency.get(edge.fromProcessId)
    if (targets) {
      targets.push(edge.toProcessId)
    } else {
      adjacency.set(edge.fromProcessId, [edge.toProcessId])
    }
  }
  return adjacency
}

/**
 * Every strongly connected component of the graph, including trivial
 * (single-node, no self-loop) ones. Components are emitted in Tarjan's
 * natural reverse-topological order.
 */
export function findStronglyConnectedComponents(
  graph: Graph,
): readonly (readonly string[])[] {
  const adjacency = buildAdjacency(graph)

  let counter = 0
  const index: Record<string, number> = {}
  const lowlink: Record<string, number> = {}
  const onStack = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []
  const components: string[][] = []

  function strongConnect(v: string): void {
    index[v] = counter
    lowlink[v] = counter
    counter += 1
    visited.add(v)
    stack.push(v)
    onStack.add(v)

    for (const w of adjacency.get(v) ?? []) {
      if (!visited.has(w)) {
        strongConnect(w)
        lowlink[v] = Math.min(lowlink[v], lowlink[w])
      } else if (onStack.has(w)) {
        lowlink[v] = Math.min(lowlink[v], index[w])
      }
    }

    if (lowlink[v] === index[v]) {
      const component: string[] = []
      let member = stack.pop()
      while (member !== undefined) {
        onStack.delete(member)
        component.push(member)
        if (member === v) {
          break
        }
        member = stack.pop()
      }
      components.push(component)
    }
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      strongConnect(node.id)
    }
  }

  return components
}

function hasSelfLoop(nodeId: string, graph: Graph): boolean {
  return graph.edges.some(
    (edge) => edge.fromProcessId === nodeId && edge.toProcessId === nodeId,
  )
}

/**
 * Every independent cycle in the graph, one CycleResult per non-trivial
 * SCC (more than one node, or a single node with a self-loop). This
 * reports one entry per independent cycle — it does not enumerate every
 * elementary/simple cycle inside a larger component, which is a
 * substantially more expensive problem (Johnson's algorithm) than what
 * was asked for here.
 */
export function findCycles(graph: Graph): readonly CycleResult[] {
  const components = findStronglyConnectedComponents(graph)
  const cycles: CycleResult[] = []
  for (const component of components) {
    if (component.length > 1 || hasSelfLoop(component[0], graph)) {
      cycles.push({ hasCycle: true, involvedNodeIds: component })
    }
  }
  return cycles
}

/** Whether the graph contains at least one cycle. */
export function hasCycle(graph: Graph): boolean {
  return findCycles(graph).length > 0
}
