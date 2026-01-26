# Game Testing with agent-browser

The Win for Life game exposes a `window.__gameTest` API for automated testing via `agent-browser eval`.

## Quick Start

```bash
# Open the game
agent-browser open http://localhost:8000

# Wait for game to be ready
agent-browser eval "await window.__gameTest.waitForReady()"

# Check current state
agent-browser eval "window.__gameTest.getState()"

# Take screenshot
agent-browser screenshot game-state.png

# Close when done
agent-browser close
```

## Available Commands

### State Queries

```bash
# Get complete state snapshot
agent-browser eval "window.__gameTest.getState()"
# Returns: { ready, currentScene, isPaused, isConnected, sceneState }

# Get current scene name
agent-browser eval "window.__gameTest.getCurrentScene()"
# Returns: "idle" | "icon-grid" | "wheel" | "result" | null

# Check if game is ready
agent-browser eval "window.__gameTest.isReady()"
# Returns: boolean

# Check if paused
agent-browser eval "window.__gameTest.isPaused()"
# Returns: boolean

# Check server connection
agent-browser eval "window.__gameTest.isConnected()"
# Returns: boolean

# Get scene-specific state
agent-browser eval "window.__gameTest.getSceneState()"
# Returns scene-specific data (see below)
```

### Scene-Specific State

**Idle Scene:**
```json
{
  "sceneKey": "idle",
  "isTransitioning": false,
  "isPaused": false
}
```

**IconGrid Scene:**
```json
{
  "sceneKey": "icon-grid",
  "scratchCount": 2,
  "isScratching": false,
  "scratchedPositions": [0, 3],
  "isWin": true,
  "currentHighlightIndex": 4
}
```

**Wheel Scene:**
```json
{
  "sceneKey": "wheel",
  "isStopping": false,
  "outcome": { "isWin": true, "prizeType": "wfl", ... }
}
```

**Result Scene:**
```json
{
  "sceneKey": "result",
  "isWin": true,
  "outcome": { "prizeType": "swfl", ... }
}
```

### Actions

```bash
# Press a key (Space, Enter, 1, 2)
agent-browser eval "window.__gameTest.pressKey('Space')"

# Trigger buzzer (same as Space)
agent-browser eval "window.__gameTest.triggerBuzzer()"

# Force win (press 1 key - works in Idle and IconGrid)
agent-browser eval "window.__gameTest.forceWin()"

# Force lose (press 2 key - works in Idle and IconGrid)
agent-browser eval "window.__gameTest.forceLose()"

# Go to specific scene
agent-browser eval "window.__gameTest.goToScene('idle')"
agent-browser eval "window.__gameTest.goToScene('result', { isWin: true })"
```

### Wait Helpers

```bash
# Wait for scene (returns true/false)
agent-browser eval "await window.__gameTest.waitForScene('wheel')"
agent-browser eval "await window.__gameTest.waitForScene('result', 15000)"

# Wait for game ready
agent-browser eval "await window.__gameTest.waitForReady()"
```

## Example Test Flows

### Test Win Flow

```bash
agent-browser open http://localhost:8000
agent-browser wait 2000
agent-browser eval "await window.__gameTest.waitForScene('idle')"
agent-browser screenshot 01-idle.png

# Force win from Idle
agent-browser eval "window.__gameTest.forceWin()"
agent-browser eval "await window.__gameTest.waitForScene('icon-grid')"
agent-browser screenshot 02-icongrid.png

# Watch scratching
agent-browser wait 3000
agent-browser eval "window.__gameTest.getSceneState()"
agent-browser screenshot 03-scratching.png

# Wait for wheel
agent-browser eval "await window.__gameTest.waitForScene('wheel', 15000)"
agent-browser screenshot 04-wheel.png

# Stop wheel
agent-browser eval "window.__gameTest.triggerBuzzer()"
agent-browser wait 5000
agent-browser screenshot 05-wheel-stopped.png

# Wait for result
agent-browser eval "await window.__gameTest.waitForScene('result', 10000)"
agent-browser screenshot 06-result.png

# Verify win
agent-browser eval "window.__gameTest.getSceneState().isWin"

agent-browser close
```

### Test Lose Flow

```bash
agent-browser open http://localhost:8000
agent-browser eval "await window.__gameTest.waitForScene('idle')"

# Force lose
agent-browser eval "window.__gameTest.forceLose()"
agent-browser eval "await window.__gameTest.waitForScene('icon-grid')"

# Wait for scratching to complete
agent-browser wait 8000

# Should go directly to Result (no Wheel)
agent-browser eval "await window.__gameTest.waitForScene('result', 10000)"
agent-browser eval "window.__gameTest.getSceneState().isWin === false"

agent-browser close
```

### Test Wheel Lands on Correct Segment

```bash
agent-browser open http://localhost:8000
agent-browser eval "await window.__gameTest.waitForScene('idle')"

# Force win
agent-browser eval "window.__gameTest.forceWin()"
agent-browser eval "await window.__gameTest.waitForScene('wheel', 15000)"

# Get prize type
agent-browser eval "window.__gameTest.getSceneState().outcome?.prizeType"

# Stop wheel and verify
agent-browser eval "window.__gameTest.triggerBuzzer()"
agent-browser wait 5000
agent-browser screenshot wheel-landing.png

agent-browser close
```

## Direct Game Access

For advanced testing, you can also access the Phaser game directly:

```bash
# Get Phaser game instance
agent-browser eval "window.game"

# Access scene manager
agent-browser eval "window.game.scene.getScenes(true).map(s => s.scene.key)"

# Access registry data
agent-browser eval "window.game.registry.getAll()"
```

## Troubleshooting

**Game not ready:**
```bash
agent-browser eval "window.__gameTest?.isReady() ?? 'TestHelper not loaded'"
```

**Scene not transitioning:**
```bash
# Check if blocked by transition lock
agent-browser eval "window.__gameTest.getSceneState().isTransitioning"
```

**Socket not connected:**
```bash
agent-browser eval "window.__gameTest.isConnected()"
```
