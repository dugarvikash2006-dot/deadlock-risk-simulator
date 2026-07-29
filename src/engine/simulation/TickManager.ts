/**
 * Executes one simulation cycle. Advances each active process's request
 * sequence for requests whose issuedTick has arrived, detects and applies
 * process completion, and derives the resulting simulation status. Makes
 * no grant/hold decisions and does not touch the wait-for graph — those
 * belong to the decision engine and graph builder, both later steps.
 */
import { SimulationStatus } from '@shared-types/simulation'
import type { SimulationEvent, SimulationState } from '@shared-types/simulation'
import { ProcessStatus } from '@shared-types/domain'
import { SIMULATION_LIMITS } from '@constants/simulationLimits'
import * as CompletionManager from './CompletionManager'
import * as ProcessManager from './ProcessManager'

/** Advances state by exactly one tick and returns the new immutable SimulationState. */
export function processTick(state: SimulationState): SimulationState {
  const nextTick = state.tick + 1
  const events: SimulationEvent[] = []

  const advancedProcesses = state.processes.map((process) => {
    const { process: updated, arrivedRequestIds } =
      ProcessManager.advanceRequestSequence(process, state.requests, nextTick)
    for (const requestId of arrivedRequestIds) {
      events.push({ type: 'RequestArrived', requestId, tick: nextTick })
    }
    return updated
  })

  const settledProcesses = advancedProcesses.map((process) => {
    if (
      CompletionManager.isFinished(process, state.requests, state.allocations)
    ) {
      events.push({
        type: 'ProcessCompleted',
        processId: process.id,
        tick: nextTick,
      })
      return CompletionManager.completeProcess(process)
    }
    return process
  })

  const allProcessesCompleted = settledProcesses.every(
    (process) => process.status === ProcessStatus.Completed,
  )
  const reachedTickLimit = nextTick >= SIMULATION_LIMITS.MAX_TICKS_PER_RUN
  const status =
    allProcessesCompleted || reachedTickLimit
      ? SimulationStatus.Completed
      : state.status

  return {
    ...state,
    tick: nextTick,
    status,
    processes: settledProcesses,
    events,
    decisions: [],
  }
}
