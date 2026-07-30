import { useState } from 'react'
import { SimulationStatus } from '@shared-types/simulation'
import type { ScenarioId } from '@config/scenarios'
import { SCENARIO_IDS } from '@config/scenarios'
import { Card } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Badge } from '@components/common/Badge'
import { ScenarioSelector } from './ScenarioSelector'
import { buildDemoScenario } from './demoScenarios'
import { useSimulation } from '@hooks/useSimulation'
import { usePlayback } from '@hooks/useReplay'
import { useStore } from '@state/storeContext'

/**
 * Controls + Simulation status panel: Initialize/Play/Pause/Tick/Reset,
 * the speed slider, and the scenario selector. Every action is a direct
 * call into useSimulation()/usePlayback() (Step 10) — no engine call and
 * no decision/allocation logic lives here.
 */
export function SimulationControlsPanel() {
  const { simulationState, initialize, reset, tick } = useSimulation()
  const { play, pause, isPlaying } = usePlayback()
  const { settings } = useStore()
  const [scenarioId, setScenarioId] = useState<ScenarioId>(
    SCENARIO_IDS.SIMPLE_ALLOCATION,
  )
  const [initError, setInitError] = useState<string | null>(null)

  const handleInitialize = () => {
    const result = initialize(buildDemoScenario(scenarioId))
    setInitError(result.loaded ? null : result.errors.join(' '))
  }

  const canPlay =
    simulationState.status === SimulationStatus.Idle ||
    simulationState.status === SimulationStatus.Paused
  const canTick = simulationState.status !== SimulationStatus.Completed

  return (
    <Card title="Controls">
      <div className="flex flex-wrap items-end gap-3">
        <ScenarioSelector value={scenarioId} onChange={setScenarioId} />
        <Button onClick={handleInitialize}>Initialize</Button>
        <Button variant="primary" onClick={play} disabled={!canPlay}>
          Play
        </Button>
        <Button onClick={pause} disabled={!isPlaying}>
          Pause
        </Button>
        <Button onClick={tick} disabled={!canTick}>
          Tick
        </Button>
        <Button onClick={reset}>Reset</Button>
      </div>

      {initError && <p className="mt-2 text-xs text-hold">{initError}</p>}

      <label className="mt-4 flex flex-col gap-1 font-mono text-xs text-foreground-muted">
        Speed ({settings.simulationSpeed.toFixed(1)} tick/s)
        <input
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={settings.simulationSpeed}
          onChange={(event) => {
            settings.setSimulationSpeed(Number(event.target.value))
          }}
        />
      </label>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 font-mono text-xs text-foreground-muted">
        <span>Tick: {simulationState.tick}</span>
        <Badge
          tone={
            simulationState.status === SimulationStatus.Running
              ? 'grant'
              : 'neutral'
          }
        >
          {simulationState.status}
        </Badge>
      </div>
    </Card>
  )
}
