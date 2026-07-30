import { memo } from 'react'
import { ReplayMode } from '@shared-types/history'
import { Card } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { usePlayback } from '@hooks/useReplay'

/**
 * Timeline: tick history and replay controls (scrub + return-to-live).
 * All data and actions come from usePlayback() (Step 10), which itself
 * reuses @engine/history's snapshotAt/latestSnapshot — no engine call
 * happens here.
 */
function TimelinePanelComponent() {
  const { snapshots, replayState, seek, clear } = usePlayback()

  return (
    <Card title="Timeline">
      {snapshots.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No history recorded yet.
        </p>
      ) : (
        <>
          <input
            type="range"
            className="w-full"
            min={0}
            max={snapshots.length - 1}
            step={1}
            value={replayState.scrubIndex ?? snapshots.length - 1}
            onChange={(event) => {
              seek(Number(event.target.value))
            }}
          />
          <div className="mt-2 flex items-center justify-between font-mono text-xs text-foreground-muted">
            <span>
              Tick {replayState.scrubIndex ?? snapshots.length - 1} of{' '}
              {snapshots.length - 1}
            </span>
            <span>
              {replayState.mode === ReplayMode.Replay ? 'Replay' : 'Live'}
            </span>
          </div>
          {replayState.mode === ReplayMode.Replay && (
            <Button className="mt-2" onClick={clear}>
              Return to Live
            </Button>
          )}
        </>
      )}
    </Card>
  )
}

export const TimelinePanel = memo(TimelinePanelComponent)
