/**
 * JSON round-tripping for Graph snapshots, used by history storage and
 * replay. Deliberately shallow: it confirms a parsed value is shaped like
 * a Graph, not that it's semantically well-formed (duplicate ids, orphan
 * edges, etc.) — that's GraphValidation's job, composed separately by
 * whichever caller needs it.
 */
import { NodeType } from '@shared-types/graph'
import type { Graph, GraphEdge, GraphNode } from '@shared-types/graph'

export type GraphDeserializeResult =
  | { readonly deserialized: true; readonly graph: Graph }
  | { readonly deserialized: false; readonly errors: readonly string[] }

/** Serializes a graph to a JSON string. */
export function serializeGraph(graph: Graph): string {
  return JSON.stringify(graph)
}

function isGraphNode(value: unknown): value is GraphNode {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as { id?: unknown; type?: unknown }
  return (
    typeof candidate.id === 'string' &&
    (candidate.type === NodeType.Process ||
      candidate.type === NodeType.Resource)
  )
}

function isGraphEdge(value: unknown): value is GraphEdge {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as {
    id?: unknown
    fromProcessId?: unknown
    toProcessId?: unknown
    viaResourceId?: unknown
  }
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.fromProcessId === 'string' &&
    typeof candidate.toProcessId === 'string' &&
    typeof candidate.viaResourceId === 'string'
  )
}

/** Parses a JSON string back into a Graph, reporting why it failed rather than throwing on malformed input. */
export function deserializeGraph(json: string): GraphDeserializeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { deserialized: false, errors: ['Input is not valid JSON.'] }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { deserialized: false, errors: ['Parsed value is not an object.'] }
  }

  const candidate = parsed as {
    nodes?: unknown
    edges?: unknown
    tick?: unknown
  }
  const errors: string[] = []

  if (!Array.isArray(candidate.nodes) || !candidate.nodes.every(isGraphNode)) {
    errors.push('"nodes" must be an array of GraphNode.')
  }
  if (!Array.isArray(candidate.edges) || !candidate.edges.every(isGraphEdge)) {
    errors.push('"edges" must be an array of GraphEdge.')
  }
  if (typeof candidate.tick !== 'number') {
    errors.push('"tick" must be a number.')
  }

  if (errors.length > 0) {
    return { deserialized: false, errors }
  }

  return {
    deserialized: true,
    graph: {
      nodes: candidate.nodes as GraphNode[],
      edges: candidate.edges as GraphEdge[],
      tick: candidate.tick as number,
    },
  }
}
