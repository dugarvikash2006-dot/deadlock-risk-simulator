import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-grant text-background hover:opacity-90',
  secondary:
    'border border-border bg-surface-raised text-foreground hover:bg-surface',
}

/** Generic button — styling only, all behavior comes from the onClick a caller supplies. */
export function Button({
  variant = 'secondary',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-control px-3 py-1.5 font-mono text-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  )
}
