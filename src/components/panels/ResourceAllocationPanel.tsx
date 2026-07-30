import { memo, useMemo } from 'react'
import { Card } from '@components/common/Card'
import { useSimulation } from '@hooks/useSimulation'
import { sum } from '@utils/array'

/**
 * Resource Table: resource, total, allocated, available. "Allocated" is
 * a plain sum over Allocation records useSimulation() already exposes
 * (via @utils/array's sum, a generic presentation-layer helper) — not a
 * re-derivation of ResourceManager's engine logic. No engine calls.
 */
function ResourceAllocationPanelComponent() {
  const { simulationState } = useSimulation()
  const { resources, allocations } = simulationState

  const rows = useMemo(
    () =>
      resources.map((resource) => {
        const allocated = sum(
          allocations
            .filter((allocation) => allocation.resourceId === resource.id)
            .map((allocation) => allocation.unitsHeld),
        )
        return {
          resource,
          allocated,
          available: resource.totalInstances - allocated,
        }
      }),
    [resources, allocations],
  )

  return (
    <Card title="Resources">
      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted">No resources loaded.</p>
      ) : (
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-left text-foreground-muted">
              <th className="py-1.5 pr-3">Resource</th>
              <th className="py-1.5 pr-3">Total</th>
              <th className="py-1.5 pr-3">Allocated</th>
              <th className="py-1.5">Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ resource, allocated, available }) => (
              <tr key={resource.id} className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-foreground">
                  {resource.label}
                </td>
                <td className="py-1.5 pr-3 text-foreground-muted">
                  {resource.totalInstances}
                </td>
                <td className="py-1.5 pr-3 text-foreground-muted">
                  {allocated}
                </td>
                <td className="py-1.5 text-foreground-muted">{available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

export const ResourceAllocationPanel = memo(ResourceAllocationPanelComponent)
