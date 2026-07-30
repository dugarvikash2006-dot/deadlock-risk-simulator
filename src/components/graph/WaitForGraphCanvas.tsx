import { memo, useMemo, useState } from 'react'
import type { SelectionState } from '@shared-types/ui'
import { Card } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import { useSimulation } from '@hooks/useSimulation'
import { useComparison } from '@hooks/useComparison'

const WIDTH = 480
const HEIGHT = 300
const NODE_RADIUS = 18
const CYCLE_COLOR = '#ef4444'
const NODE_COLOR = '#3b82f6'
const EDGE_COLOR = '#2a2a38'
const SELECTED_COLOR = '#e8e8ec'

interface Point {
  readonly x: number
  readonly y: number
}

/** Simple deterministic circular layout — not a physics simulation. Positions nodes evenly around a circle so every node/edge has a stable, non-overlapping spot without needing d3-force's iterative simulation for what's typically a handful of processes. */
function computeCircularLayout(nodeIds: readonly string[]): Map<string, Point> {
  const centerX = WIDTH / 2
  const centerY = HEIGHT / 2
  const radius = Math.min(WIDTH, HEIGHT) / 2 - 50
  const positions = new Map<string, Point>()
  nodeIds.forEach((id, index) => {
    const angle =
      (2 * Math.PI * index) / Math.max(1, nodeIds.length) - Math.PI / 2
    positions.set(id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  })
  return positions
}

/**
 * Graph Summary: renders the current wait-for graph — nodes, directed
 * edges, and any cycle(s) highlighted — plus a details panel for
 * whichever process (node) or resource (edge) is selected. Uses only
 * data useSimulation()/useComparison() already expose (currentGraph,
 * wfgResult, simulationState); it never calls @engine/graph or any other
 * engine itself, and the circular layout below is presentation-only math,
 * not graph analysis.
 */
function WaitForGraphCanvasComponent() {
  const { currentGraph, simulationState } = useSimulation()
  const { wfgResult } = useComparison()
  const [selection, setSelection] = useState<SelectionState>({ kind: 'None' })

  const positions = useMemo(
    () => computeCircularLayout(currentGraph.nodes.map((node) => node.id)),
    [currentGraph.nodes],
  )

  const cycleNodeIds = useMemo(
    () => new Set(wfgResult?.flatMap((cycle) => cycle.involvedNodeIds) ?? []),
    [wfgResult],
  )

  const selectedProcess =
    selection.kind === 'Process'
      ? simulationState.processes.find(
          (process) => process.id === selection.processId,
        )
      : undefined
  const selectedResource =
    selection.kind === 'Resource'
      ? simulationState.resources.find(
          (resource) => resource.id === selection.resourceId,
        )
      : undefined

  return (
    <Card title="Graph Summary">
      <div className="mb-3 flex gap-4 font-mono text-xs text-foreground-muted">
        <span>Nodes: {currentGraph.nodes.length}</span>
        <span>Edges: {currentGraph.edges.length}</span>
        <span className={cycleNodeIds.size > 0 ? 'text-hold' : 'text-grant'}>
          Cycles: {wfgResult ? wfgResult.length : 0}
        </span>
      </div>

      {currentGraph.nodes.length === 0 ? (
        <p className="text-sm text-foreground-muted">No processes loaded.</p>
      ) : (
        <svg
          viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
          className="w-full"
          role="img"
          aria-label="Wait-for graph"
        >
          <defs>
            <marker
              id="wfg-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR} />
            </marker>
          </defs>

          {currentGraph.edges.map((edge) => {
            const from = positions.get(edge.fromProcessId)
            const to = positions.get(edge.toProcessId)
            if (!from || !to) {
              return null
            }
            const isCycleEdge =
              cycleNodeIds.has(edge.fromProcessId) &&
              cycleNodeIds.has(edge.toProcessId)
            const isSelected =
              selection.kind === 'GraphEdge' && selection.edgeId === edge.id
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={
                  isCycleEdge
                    ? CYCLE_COLOR
                    : isSelected
                      ? SELECTED_COLOR
                      : EDGE_COLOR
                }
                strokeWidth={isSelected ? 2.5 : 1.5}
                markerEnd="url(#wfg-arrow)"
                className="cursor-pointer"
                onClick={() => {
                  setSelection({
                    kind: 'Resource',
                    resourceId: edge.viaResourceId,
                  })
                }}
              >
                <title>
                  {edge.fromProcessId} waits for {edge.toProcessId} via{' '}
                  {edge.viaResourceId}
                </title>
              </line>
            )
          })}

          {currentGraph.nodes.map((node) => {
            const position = positions.get(node.id)
            if (!position) {
              return null
            }
            const inCycle = cycleNodeIds.has(node.id)
            const isSelected =
              selection.kind === 'Process' && selection.processId === node.id
            return (
              <g
                key={node.id}
                transform={`translate(${String(position.x)}, ${String(position.y)})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelection({ kind: 'Process', processId: node.id })
                }}
              >
                <circle
                  r={NODE_RADIUS}
                  fill={inCycle ? CYCLE_COLOR : NODE_COLOR}
                  stroke={isSelected ? SELECTED_COLOR : 'transparent'}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={10}
                  fill="#0a0a0f"
                  className="select-none font-mono"
                >
                  {node.id}
                </text>
                <title>{node.id}</title>
              </g>
            )
          })}
        </svg>
      )}

      {currentGraph.edges.length === 0 && currentGraph.nodes.length > 0 && (
        <p className="mt-2 text-xs text-foreground-muted">
          No active wait-for relationships.
        </p>
      )}

      {(selectedProcess ?? selectedResource) && (
        <div className="mt-3 rounded-control border border-border bg-surface-raised p-2 font-mono text-xs">
          {selectedProcess && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-foreground">{selectedProcess.id}</span>
                <Badge tone="neutral">{selectedProcess.status}</Badge>
              </div>
              <p className="mt-1 text-foreground-muted">
                Unissued requests: {selectedProcess.requestSequence.length}
              </p>
            </>
          )}
          {selectedResource && (
            <div className="flex items-center justify-between">
              <span className="text-foreground">{selectedResource.label}</span>
              <span className="text-foreground-muted">
                {selectedResource.totalInstances} total unit(s)
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export const WaitForGraphCanvas = memo(WaitForGraphCanvasComponent)
