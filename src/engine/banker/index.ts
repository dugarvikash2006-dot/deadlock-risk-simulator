/**
 * Barrel export for the classical Banker's Algorithm layer (Step 6):
 * Need/Available derivation, the safety algorithm and its hypothetical
 * request/release simulation, structural input validation, and
 * persistence. A pure analysis library — it never touches
 * SimulationState, never grants anything, and has no scheduling or
 * resource-grant policy of its own. Wiring its verdicts into an actual
 * grant/hold decision is the Decision Engine's job, a separate, later
 * step.
 */
export * from './NeedMatrix'
export * from './AvailableVector'
export * from './BankerEngine'
export * from './BankerValidation'
export * from './BankerSerializer'
