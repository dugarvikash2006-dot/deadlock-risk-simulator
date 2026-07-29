# Graduated Deadlock Avoidance — Wait-For Graph Risk Scoring

A browser-based Operating Systems simulator comparing Banker's Algorithm,
classical Wait-For Graph cycle detection, and a proposed graduated,
risk-informed avoidance framework (Cyclic Tension Index).

Fully simulated — no kernel modification, no elevated privileges, no
virtualization.

## Stack

React, TypeScript, Tailwind CSS, Framer Motion, Recharts, d3-force.

## Scripts

- `npm run dev` — start the local dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run typecheck` — type-check without emitting
- `npm run lint` — run ESLint
- `npm run lint:fix` — run ESLint with automatic fixes
- `npm run format` — format with Prettier
- `npm run format:check` — check formatting without writing
- `npm test` — run the test suite (Vitest)
- `npm run test:ui` — run Vitest with its UI runner

## Status

Project scaffold. Simulation engine, graph engine, risk engine, decision
engine, and UI are implemented in subsequent phases.
