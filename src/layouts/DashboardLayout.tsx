import type { ReactNode } from 'react'

export interface DashboardLayoutProps {
  readonly controls: ReactNode
  readonly processes: ReactNode
  readonly resources: ReactNode
  readonly graphSummary: ReactNode
  readonly ctiPanel: ReactNode
  readonly decisionPanel: ReactNode
  readonly comparisonPanel: ReactNode
  readonly trends: ReactNode
  readonly timeline: ReactNode
}

/**
 * Pure responsive grid arrangement of the dashboard's panel slots — no
 * hooks, no state, no data of its own. DashboardPage.tsx is the
 * composition root that decides which components fill each slot;
 * DashboardLayout only decides where they sit on screen. Single column
 * on small screens; a 3-column grid from `lg` up, with Controls,
 * Comparison, Trends, and Timeline spanning the full width.
 */
export function DashboardLayout({
  controls,
  processes,
  resources,
  graphSummary,
  ctiPanel,
  decisionPanel,
  comparisonPanel,
  trends,
  timeline,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">{controls}</div>
        <div className="lg:col-span-2">{processes}</div>
        <div className="lg:col-span-1">{resources}</div>
        <div className="lg:col-span-1">{graphSummary}</div>
        <div className="lg:col-span-1">{ctiPanel}</div>
        <div className="lg:col-span-1">{decisionPanel}</div>
        <div className="lg:col-span-3">{comparisonPanel}</div>
        <div className="lg:col-span-3">{trends}</div>
        <div className="lg:col-span-3">{timeline}</div>
      </div>
    </div>
  )
}
