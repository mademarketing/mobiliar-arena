# Game Testing with agent-browser

The Mobiliar Arena game exposes a `window.__gameTest` API for automated testing via `agent-browser eval`.

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
# Returns: "lobby" | "countdown" | "game" | "result" | null

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

**Lobby Scene:**
```json
{
  "sceneKey": "lobby",
  "joinedPlayers": [0, 1]
}
```

**Game Scene:**
```json
{
  "sceneKey": "game",
  "score": 150,
  "combo": 3
}
```

**Result Scene:**
```json
{
  "sceneKey": "result",
  "score": 420
}
```

### Actions

```bash
# Press a key (Space, Enter, 1-6, Arrow keys, A/D)
agent-browser eval "window.__gameTest.pressKey('Space')"

# Go to specific scene
agent-browser eval "window.__gameTest.goToScene('lobby')"
agent-browser eval "window.__gameTest.goToScene('result', { score: 420 })"
```

### Wait Helpers

```bash
# Wait for scene (returns true/false)
agent-browser eval "await window.__gameTest.waitForScene('game')"
agent-browser eval "await window.__gameTest.waitForScene('result', 15000)"

# Wait for game ready
agent-browser eval "await window.__gameTest.waitForReady()"
```

## Example Test Flows

### Test Arena Game Flow

```bash
agent-browser open http://localhost:8080
agent-browser wait 2000
agent-browser eval "await window.__gameTest.waitForScene('lobby')"
agent-browser screenshot 01-lobby.png

# Join players using keyboard shortcuts
agent-browser eval "window.__gameTest.pressKey('1')"
agent-browser wait 500
agent-browser eval "window.__gameTest.pressKey('2')"
agent-browser wait 500
agent-browser screenshot 02-players-joined.png

# Start the game
agent-browser eval "window.__gameTest.pressKey('Enter')"
agent-browser eval "await window.__gameTest.waitForScene('game', 10000)"
agent-browser screenshot 03-game-started.png

# Take screenshots during gameplay
agent-browser wait 5000
agent-browser eval "window.__gameTest.getSceneState()"
agent-browser screenshot 04-game-playing.png

# Wait for result
agent-browser eval "await window.__gameTest.waitForScene('result', 70000)"
agent-browser screenshot 05-result.png

# Verify score
agent-browser eval "window.__gameTest.getSceneState().score"

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
