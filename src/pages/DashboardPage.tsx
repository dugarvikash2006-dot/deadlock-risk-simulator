import { DashboardLayout } from '@layouts/DashboardLayout'
import { SimulationControlsPanel } from '@components/controls/SimulationControlsPanel'
import { TimelinePanel } from '@components/controls/TimelinePanel'
import { ProcessTablePanel } from '@components/panels/ProcessTablePanel'
import { ResourceAllocationPanel } from '@components/panels/ResourceAllocationPanel'
import { DecisionLogPanel } from '@components/panels/DecisionLogPanel'
import { WaitForGraphCanvas } from '@components/graph/WaitForGraphCanvas'
import { CTIBreakdownView } from '@components/indicators/CTIBreakdownView'
import { ComparisonPanel } from '@components/comparison/ComparisonPanel'
import { AnalysisTrendCharts } from '@components/comparison/AnalysisTrendCharts'

/**
 * Composition root for the dashboard: owns no state itself, renders no
 * data directly — it only decides which panel fills which DashboardLayout
 * slot. Every panel calls its own hooks (useSimulation/usePlayback/
 * useComparison) independently, so this component needs no props threaded
 * down and stays a pure wiring diagram.
 */
export function DashboardPage() {
  return (
    <DashboardLayout
      controls={<SimulationControlsPanel />}
      processes={<ProcessTablePanel />}
      resources={<ResourceAllocationPanel />}
      graphSummary={<WaitForGraphCanvas />}
      ctiPanel={<CTIBreakdownView />}
      decisionPanel={<DecisionLogPanel />}
      comparisonPanel={<ComparisonPanel />}
      trends={<AnalysisTrendCharts />}
      timeline={<TimelinePanel />}
    />
  )
}
