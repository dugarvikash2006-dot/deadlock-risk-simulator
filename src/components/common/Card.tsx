import type { ReactNode } from 'react'

export interface CardProps {
  readonly title?: string
  readonly className?: string
  readonly children: ReactNode
}

/** Generic panel container used by every dashboard panel — styling only, no data of its own. */
export function Card({ title, className, children }: CardProps) {
  return (
    <section
      className={`rounded-card border border-border bg-surface p-4 ${className ?? ''}`}
    >
      {title && (
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
