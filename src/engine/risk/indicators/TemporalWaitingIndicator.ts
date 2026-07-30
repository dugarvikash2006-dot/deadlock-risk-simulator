/**
 * Measures waiting pressure from timing alone: how long currently
 * outstanding requests have been waiting, in aggregate, on average, and
 * at the extreme.
 *
 * What it measures: elapsed ticks since each outstanding request
 * arrived, independent of graph topology or resource counts.
 * Why it matters: neither a graph snapshot nor a contention snapshot can
 * distinguish a request that just arrived from one that's been starved
 * for 150 ticks — sustained waiting is itself a risk signal, separate
 * from whether a cycle exists yet (see CycleProximityIndicator.ts) or how
 * much is being contended for right now (see
 * ContentionDensityIndicator.ts).
 * Inputs: the current requests, their owning processes (needed only to
 * determine which requests have actually arrived), and the current tick.
 * Output: a [0, 1] score and a human-readable explanation.
 */
import { RequestStatus } from '@shared-types/domain'
import type { Process, Request } from '@shared-types/domain'
import { average } from '@utils/math'
import { SIMULATION_LIMITS } from '@constants/simulationLimits'

export interface TemporalWaitingScore {
  readonly score: number
  readonly explanation: string
}

/**
 * A request counts as "currently outstanding" once it has arrived (left
 * its owning process's requestSequence) and hasn't been granted. Mirrors
 * the arrival concept WaitForGraphBuilder.ts uses internally — without
 * this check, a request whose issuedTick hasn't arrived yet could produce
 * a nonsensical negative wait time.
 */
function isOutstanding(
  request: Request,
  processes: readonly Process[],
): boolean {
  if (request.status === RequestStatus.Granted) {
    return false
  }
  const process = processes.find(
    (candidate) => candidate.id === request.processId,
  )
  return process !== undefined && !process.requestSequence.includes(request.id)
}

/** Normalizes a waiting-time figure against MAX_TICKS_PER_RUN — the longest a run can last, and therefore the longest any request could possibly wait — rather than an arbitrary constant. */
function normalizeAgainstRunLength(ticks: number): number {
  return Math.min(1, ticks / SIMULATION_LIMITS.MAX_TICKS_PER_RUN)
}

/**
 * Combines average waiting pressure (broad, steady-state waiting) with
 * the single longest wait (starvation risk) by taking whichever is
 * worse, rather than blending them with an arbitrary weight — a system
 * with many short waits and a system with one badly starved process are
 * both genuinely tense, for different reasons, and either should be able
 * to drive the score up on its own.
 */
export function analyzeTemporalWaiting(
  requests: readonly Request[],
  processes: readonly Process[],
  currentTick: number,
): TemporalWaitingScore {
  const waitingTimes = requests
    .filter((request) => isOutstanding(request, processes))
    .map((request) => Math.max(0, currentTick - request.issuedTick))

  if (waitingTimes.length === 0) {
    return {
      score: 0,
      explanation: 'No outstanding requests; no waiting pressure.',
    }
  }

  const cumulative = waitingTimes.reduce((total, ticks) => total + ticks, 0)
  const averageWait = average(waitingTimes)
  const longest = Math.max(...waitingTimes)

  const score = Math.max(
    normalizeAgainstRunLength(averageWait),
    normalizeAgainstRunLength(longest),
  )

  return {
    score,
    explanation: `${String(waitingTimes.length)} outstanding request(s); cumulative wait ${String(cumulative)} tick(s), average ${averageWait.toFixed(1)} tick(s), longest ${String(longest)} tick(s) (run limit ${String(SIMULATION_LIMITS.MAX_TICKS_PER_RUN)} tick(s)).`,
  }
}
