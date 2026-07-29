/**
 * Barrel export for the simulation engine foundation (Step 4): process,
 * resource, tick, completion, history, and scenario-loading mechanics,
 * plus the SimulationEngine facade that ties them together. Internal
 * modules are re-exported as namespaces to keep their responsibilities
 * visibly separated and avoid cross-module name collisions; the facade
 * (SimulationEngine) is re-exported flat since it's the primary entry
 * point most consumers need. The graph, risk, decision, and comparison
 * subsystems are separate, later phases and are not exported here yet.
 */
export * as ProcessManager from './simulation/ProcessManager'
export * as ResourceManager from './simulation/ResourceManager'
export * as AllocationManager from './simulation/AllocationManager'
export * as CompletionManager from './simulation/CompletionManager'
export * as TickManager from './simulation/TickManager'
export * as ScenarioLoader from './simulation/ScenarioLoader'
export * as HistoryStore from './history/HistoryStore'
export * from './SimulationEngine'
