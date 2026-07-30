import type { ScenarioId } from '@config/scenarios'
import { ALL_SCENARIO_IDS, SCENARIO_LABELS } from './demoScenarios'

export interface ScenarioSelectorProps {
  readonly value: ScenarioId
  readonly onChange: (id: ScenarioId) => void
}

/** Dropdown for picking which demo scenario Initialize will load. */
export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <label className="flex flex-col gap-1 font-mono text-xs text-foreground-muted">
      Scenario
      <select
        className="rounded-control border border-border bg-surface-raised px-2 py-1 text-foreground"
        value={value}
        onChange={(event) => {
          onChange(event.target.value as ScenarioId)
        }}
      >
        {ALL_SCENARIO_IDS.map((id) => (
          <option key={id} value={id}>
            {SCENARIO_LABELS[id]}
          </option>
        ))}
      </select>
    </label>
  )
}
