# Scene Architecture & Flow

## Overview

Mobiliar Arena uses a multi-scene Phaser architecture. Initial scenes handle bootstrapping and asset loading, then the game flows through lobby, gameplay, and result phases in a continuous loop.

## Scene Flow

```
Bootstrap
    ↓
Preload (assets)
    ↓
Lobby (waiting for players)
    ↓ [Min 2 players joined + ready]
Countdown (3-2-1)
    ↓
Game (60 seconds gameplay)
    ↓ [Timer ends]
Result (score display)
    ↓ [Auto-dismiss after 10s]
Lobby (loop)
```

## Scene Descriptions

### Bootstrap
- **File**: `docker/app/client/src/scenes/Bootstrap.ts`
- **Purpose**: Initial scene that loads settings from `/api/settings`
- **Lifecycle**: Runs once at startup, then stops
- **Loads**: Theme configuration, player limits, game settings
- **Next**: Launches `Preload` scene

### Preload
- **File**: `docker/app/client/src/scenes/Preload.ts`
- **Purpose**: Loads all game assets (images, fonts, sounds)
- **Lifecycle**: Runs once, then stops when complete
- **Loads**:
  - Theme-specific background and ball sprites
  - Paddle graphics
  - UI elements (score display, timer)
  - Audio assets (when implemented)
- **Next**: Launches `Lobby` scene

### Lobby
- **File**: `docker/app/client/src/scenes/Lobby.ts`
- **Purpose**: Player join/ready screen
- **Lifecycle**: Active until minimum players ready

**Contains**:
- Circular arena outline showing player positions
- "Hold both buttons for 3 seconds to join" instruction
- Player indicators (empty → joining → ready states)
- Player count display
- Highscore display (best team score)

**Join Flow**:
1. Player positions shown as empty slots around circle
2. When player holds both buttons, progress indicator fills (3 seconds)
3. On successful join, slot lights up with player color
4. Minimum 2 players required
5. Auto-starts countdown when all joined players are ready

**Keyboard (dev)**:
- `1-6`: Toggle player join/leave
- `Enter`: Force start (skip wait)

**Next**: Transitions to `Countdown` when ready

### Countdown
- **File**: `docker/app/client/src/scenes/Countdown.ts`
- **Purpose**: Brief countdown before gameplay
- **Lifecycle**: 3-second countdown, then auto-transitions

**Contains**:
- Large centered countdown: 3... 2... 1... GO!
- Arena and paddles already visible
- Players can move paddles during countdown (practice)

**Next**: Transitions to `Game`

### Game
- **File**: `docker/app/client/src/scenes/Game.ts`
- **Purpose**: Main gameplay scene
- **Lifecycle**: Active for 60 seconds

**Contains**:
- Circular arena with theme background
- Player paddles around circumference
- Balls spawning from center
- Central score display
- Countdown timer
- Combo multiplier indicator

**Gameplay**:
- Timer counts down from 60 seconds
- New ball spawns every 5 seconds (12 balls total)
- Players move paddles left/right with buttons
- Balls bounce off paddles, walls redirect back to center area
- Missed balls disappear (pass through paddle zone)
- Paddle width shrinks over time (difficulty increase)
- Score: (balls in play) × (seconds elapsed) + combo bonuses

**Keyboard (dev)**:
- Arrow keys: Move player 1 paddle
- W/S: Move player 2 paddle
- Space: Spawn extra ball
- Esc: End game early

**Next**: Transitions to `Result` when timer reaches 0

### Result
- **File**: `docker/app/client/src/scenes/Result.ts`
- **Purpose**: Display final score and campaign message
- **Lifecycle**: Auto-dismisses after 10 seconds

**Contains**:
- Final team score (large, centered)
- "Besser zusammen" campaign tagline
- New highscore celebration (if applicable)
- Comparison to best score
- Player colors showing who participated

**Keyboard**: Space to skip to Lobby immediately

**Next**: Returns to `Lobby` after timeout or keypress

## Scene Registration

Scenes are registered in `docker/app/client/src/main.ts`:

```typescript
scene.add(SceneKeys.Bootstrap, Bootstrap);
scene.add(SceneKeys.Preload, Preload);
scene.add(SceneKeys.Lobby, Lobby);
scene.add(SceneKeys.Countdown, Countdown);
scene.add(SceneKeys.Game, Game);
scene.add(SceneKeys.Result, Result);
```

Scene keys are defined in `docker/app/client/src/consts/SceneKeys.ts`.

## Circular Arena Rendering

**Canvas**: 1920x1080 (standard HD)
**Arena Center**: 960, 540 (canvas center)
**Arena Radius**: ~480 pixels (fits within 1080 height with margin)

The game renders a circular playing field centered on the rectangular canvas. The external LED controller handles mapping this to the physical circular screen.

**Important**: Keep all game elements within the circular bounds. The corners of the 1920x1080 canvas will not be visible on the circular display.

## Player Positioning

Players are distributed evenly around the circle:

```
2 players: 180° apart (top and bottom)
3 players: 120° apart (triangle)
4 players: 90° apart (square)
5 players: 72° apart (pentagon)
6 players: 60° apart (hexagon)
```

**Paddle Arc**: Each paddle covers an arc of the circle. The arc size adjusts based on player count:
- More players = smaller individual arcs
- Paddles move within their designated arc

## Ball Physics

**Spawn**: Center of arena with random direction
**Movement**: Constant velocity (configurable, may increase over time)
**Paddle Collision**: Reflects based on paddle angle and hit position
**Wall Behavior**: No outer wall - balls that pass paddles disappear
**Inner boundary**: Balls reflect if they would cross through center (keeps them moving outward)

## Event Integration

Scenes communicate via Socket.io events through the GamePlugin:

**Input Events**:
- `PlayerInput`: Button press/release from Phidgets (server → client)
- `PlayerJoinRequest`: Player holding buttons to join (client → server)
- `PlayerJoined`: Confirmation of player join (server → client)

**Game Events**:
- `GameStart`: All players ready, begin countdown
- `BallSpawn`: New ball entering play
- `BallMissed`: Ball left the arena
- `ScoreUpdate`: Score changed
- `GameEnd`: Timer finished

**Admin Events**:
- `GamePaused` / `GameResumed`: Pause control from admin
- `ThemeChanged`: Theme update from admin
- `SettingsUpdated`: Configuration change

## Adding New Features

### For Player Join Experience
→ Edit **`Lobby.ts`**

### For Countdown Animation
→ Edit **`Countdown.ts`**

### For Core Gameplay
→ Edit **`Game.ts`**

### For Score Display & Campaign Message
→ Edit **`Result.ts`**

### For Asset Loading
→ Edit **`Preload.ts`** and add keys to **`TextureKeys.ts`**

### For Initial Setup/Settings
→ Edit **`Bootstrap.ts`**

### For Ball Physics
→ Create/edit physics utilities in `utils/` folder

### For Paddle Movement
→ Edit paddle class/utilities referenced by `Game.ts`

## References

- Scene keys: `docker/app/client/src/consts/SceneKeys.ts`
- Scene registration: `docker/app/client/src/main.ts`
- Game constants: `docker/app/client/src/consts/GameConstants.ts`
- Texture keys: `docker/app/client/src/consts/TextureKeys.ts`
- Game events: `docker/app/shared/GameEvents.ts`
