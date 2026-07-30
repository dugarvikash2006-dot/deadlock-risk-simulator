/**
 * Composes the app's providers into one wrapper. Currently just
 * StoreProvider — a single place to add future app-level providers
 * (theme, routing, etc.) without every consumer needing to update.
 */
import type { ReactNode } from 'react'
import { StoreProvider } from '@state/StoreProvider'

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>
}
