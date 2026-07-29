/**
 * UI/view-model models. Depends only on graph.ts. Never depended on by
 * engine/ — this file exists for the presentation layer's own bookkeeping.
 */
import type { GraphNode } from './graph'

/**
 * Modeled as a discriminated union rather than nullable
 * (targetType, targetId) fields: this makes an invalid state — a type set
 * without an id, or vice versa — structurally unrepresentable.
 */
export type SelectionState =
  | { readonly kind: 'None' }
  | { readonly kind: 'Process'; readonly processId: string }
  | { readonly kind: 'Resource'; readonly resourceId: string }
  | { readonly kind: 'Request'; readonly requestId: string }
  | { readonly kind: 'GraphNode'; readonly nodeId: string }
  | { readonly kind: 'GraphEdge'; readonly edgeId: string }

export interface DashboardUIState {
  readonly activePanelFilter: string | null
  readonly compareModeEnabled: boolean
  readonly selection: SelectionState
}

/** A GraphNode plus the position d3-force assigns it. Engine stays layout-agnostic — this type belongs to the presentation layer only. */
export interface GraphLayoutNode extends GraphNode {
  readonly x: number
  readonly y: number
}
