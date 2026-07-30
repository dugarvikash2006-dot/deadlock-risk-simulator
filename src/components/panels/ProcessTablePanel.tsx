import { memo, useMemo } from 'react'
import { ProcessStatus, RequestStatus } from '@shared-types/domain'
import type { Request } from '@shared-types/domain'
import { Card } from '@components/common/Card'
import { Badge } from '@components/common/Badge'
import type { BadgeTone } from '@components/common/Badge'
import { useSimulation } from '@hooks/useSimulation'

const STATUS_TONE: Record<ProcessStatus, BadgeTone> = {
  [ProcessStatus.Active]: 'grant',
  [ProcessStatus.Held]: 'hold',
  [ProcessStatus.Completed]: 'neutral',
}

/**
 * Process Table: id, state, allocations, outstanding requests, and
 * waiting time (currentTick - oldest outstanding request's issuedTick —
 * simple display arithmetic over data useSimulation() already exposes,
 * not a re-derivation of any engine's risk/timing analysis). All data
 * comes from useSimulation()'s simulationState; no engine calls.
 */
function ProcessTablePanelComponent() {
  const { simulationState } = useSimulation()
  const { processes, allocations, requests, tick } = simulationState

  const rows = useMemo(
    () =>
      processes.map((process) => {
        const processAllocations = allocations.filter(
          (allocation) => allocation.processId === process.id,
        )
        const outstandingRequests = requests.filter(
          (request) =>
            request.processId === process.id &&
            request.status !== RequestStatus.Granted,
        )
        const oldestRequest = outstandingRequests.reduce<Request | null>(
          (oldest, request) =>
            !oldest || request.issuedTick < oldest.issuedTick
              ? request
              : oldest,
          null,
        )
        return {
          process,
          allocationSummary:
            processAllocations
              .map(
                (allocation) =>
                  `${allocation.resourceId}:${String(allocation.unitsHeld)}`,
              )
              .join(', ') || '—',
          requestSummary:
            outstandingRequests
              .map(
                (request) =>
                  `${request.resourceId}:${String(request.unitsRequested)}`,
              )
              .join(', ') || '—',
          waitingTicks: oldestRequest
            ? Math.max(0, tick - oldestRequest.issuedTick)
            : null,
        }
      }),
    [processes, allocations, requests, tick],
  )

  return (
    <Card title="Processes">
      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted">No processes loaded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="py-1.5 pr-3">Process</th>
                <th className="py-1.5 pr-3">State</th>
                <th className="py-1.5 pr-3">Allocations</th>
                <th className="py-1.5 pr-3">Requests</th>
                <th className="py-1.5">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(
                ({
                  process,
                  allocationSummary,
                  requestSummary,
                  waitingTicks,
                }) => (
                  <tr key={process.id} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 text-foreground">
                      {process.id}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Badge tone={STATUS_TONE[process.status]}>
                        {process.status}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-3 text-foreground-muted">
                      {allocationSummary}
                    </td>
                    <td className="py-1.5 pr-3 text-foreground-muted">
                      {requestSummary}
                    </td>
                    <td className="py-1.5 text-foreground-muted">
                      {waitingTicks === null
                        ? '—'
                        : `${String(waitingTicks)} tick(s)`}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export const ProcessTablePanel = memo(ProcessTablePanelComponent)
