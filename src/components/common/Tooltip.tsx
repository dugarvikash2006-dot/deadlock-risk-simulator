import type { ReactNode } from 'react'

export interface TooltipProps {
  readonly label: string
  readonly children: ReactNode
}

/** Hover tooltip, pure CSS (group-hover) — no state, no portal, no positioning library. */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-control border border-border bg-surface-raised px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
