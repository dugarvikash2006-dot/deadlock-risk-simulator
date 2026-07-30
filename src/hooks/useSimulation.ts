/**
 * Exposes SimulationStore's state and actions to components, plus the
 * current wait-for graph derived from it (selectors.ts). A thin
 * pass-through over the StoreProvider context — no logic of its own.
 */
import { useStore } from '@state/storeContext'
import type { SimulationSlice } from '@state/simulationSlice'
import { useCurrentGraph } from '@state/selectors'
import type { Graph } from '@shared-types/graph'

export interface SimulationApi extends SimulationSlice {
  readonly currentGraph: Graph
}

export function useSimulation(): SimulationApi {
  const { simulation } = useStore()
  const currentGraph = useCurrentGraph(simulation.simulationState)
  return { ...simulation, currentGraph }
}
