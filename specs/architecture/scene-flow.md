# Scene Architecture & Flow

## Overview

The Win for Life Roadshow Kiosk uses a multi-scene Phaser architecture. Initial scenes handle bootstrapping and asset loading, then the game flows through multiple gameplay scenes based on the prize outcome.

## Scene Flow

```
Bootstrap
    ↓
Preload (assets)
    ↓
Idle (waiting for player)
    ↓ [Buzzer Press → RequestPrize]
Intro ("Finde 3x WIN" instruction)
    ↓ [Auto-transition after animation]
IconGrid (3x3 anticipation phase)
    ↓
    ├─────────────────────────────────┐
    │ Win (3 yellow icons)            │ Lose (2 yellow + 1 red)
    ↓                                 ↓
Wheel (spin the wheel)             Result (consolation)
    ↓                                 │
Result (prize celebration)            │
    ↓                                 │
    └─────────────────────────────────┘
                  ↓ [Auto-dismiss or Space]
              Idle (loop)
```

## Scene Descriptions

### Bootstrap
- **File**: `docker/app/client/src/scenes/Bootstrap.ts`
- **Purpose**: Initial scene that loads settings from `/api/settings`
- **Lifecycle**: Runs once at startup, then stops
- **Next**: Launches `Preload` scene

### Preload
- **File**: `docker/app/client/src/scenes/Preload.ts`
- **Purpose**: Loads all game assets (images, fonts, sounds)
- **Lifecycle**: Runs once, then stops when complete
- **Next**: Emits `GameEvents.PreloadFinished`, triggering `Idle`

### Idle
- **File**: `docker/app/client/src/scenes/Idle.ts`
- **Purpose**: Attract mode / waiting for next player
- **Lifecycle**: Active until buzzer press
- **Contains**:
  - Win for Life branded background
  - Logo and "Buzzer drücken!" instruction
  - Buzzer icon
- **Server Interaction**: Requests prize via `RequestPrize` callback on buzzer press
- **Keyboard**: Space (server), 1 (force win), 2 (force lose)
- **Next**: Transitions to `Intro` with prize outcome

### Intro
- **File**: `docker/app/client/src/scenes/Intro.ts`
- **Purpose**: Brief instructional scene showing "Finde 3x WIN" with animated icons
- **Lifecycle**: ~2.5-3 seconds, auto-transitions when animation completes
- **Contains**:
  - "Finde 3x WIN" instruction text (fade in)
  - 3 WIN icons animating in below text (staggered scale animation)
  - OrangeGlitterBackdrop for consistent visual style
- **Animation Sequence**:
  1. Text fades in
  2. Icons appear one by one with bounce effect
  3. Brief hold, then auto-transition
- **Next**: Transitions to `IconGrid` with prize outcome

### IconGrid
- **File**: `docker/app/client/src/scenes/IconGrid.ts`
- **Purpose**: 3x3 icon grid anticipation phase
- **Lifecycle**: Active during icon reveal sequence
- **Contains**:
  - 9 icons in a 3x3 grid (beach, car, house, money, win)
  - 3-4 randomly positioned "win icons" per game (maintains suspense)
  - Sequential flashing animation (all flash yellow)
- **Game Logic**:
  - Prize outcome pre-determined by server before scene starts
  - Win: Shows 3 yellow icons, then transitions to Wheel
  - Lose: Shows 2 yellow + 1 red icon, then transitions to Result
- **Next**: `Wheel` (win path) or `Result` (lose path)

### Wheel
- **File**: `docker/app/client/src/scenes/Wheel.ts`
- **Purpose**: Spin the wheel to show prize type
- **Lifecycle**: Active during wheel spin animation
- **Contains**:
  - Animated prize wheel (6 segments: 4 WFL + 2 SWFL)
  - Spin animation with easing
  - Pointer indicator
- **Note**: Prize type already determined by server; wheel lands on matching segment
- **Next**: `Result` scene with prize display

### Result
- **File**: `docker/app/client/src/scenes/Result.ts`
- **Purpose**: Win celebration or lose consolation display
- **Lifecycle**: Auto-dismisses after 10 seconds, or Space to skip
- **Contains**:
  - Win: Congratulations text, prize image, celebration particles
  - Lose: Logo, consolation message, call to action
- **Keyboard**: Space to skip to Idle immediately
- **Next**: Returns to `Idle` after timeout or keypress

## Scene Registration

Scenes are registered in `docker/app/client/src/main.ts`:

```typescript
scene.add(SceneKeys.Bootstrap, Bootstrap);
scene.add(SceneKeys.Preload, Preload);
scene.add(SceneKeys.Idle, Idle);
scene.add(SceneKeys.Intro, Intro);
scene.add(SceneKeys.IconGrid, IconGrid);
scene.add(SceneKeys.Wheel, Wheel);
scene.add(SceneKeys.Result, Result);
```

Scene keys are defined in `docker/app/client/src/consts/SceneKeys.ts`.

## Adding New Features

### For Idle/Attract Mode
→ Edit **`Idle.ts`**

### For Intro Instructions
→ Edit **`Intro.ts`**

### For Icon Grid Mechanics
→ Edit **`IconGrid.ts`**

### For Wheel Animation
→ Edit **`Wheel.ts`**

### For Win/Lose Display
→ Edit **`Result.ts`**

### For Asset Loading
→ Edit **`Preload.ts`** and add keys to **`TextureKeys.ts`**

### For Initial Setup/Settings
→ Edit **`Bootstrap.ts`**

## Display Configuration

The kiosk uses a single HD horizontal screen:
- Resolution: 1920x1080
- Aspect Ratio: 16:9 (horizontal orientation)
- Output: Full-screen Chromium browser in kiosk mode

## Scene Transitions

All scene transitions use Phaser's built-in scene management:

```typescript
// Start a new scene (stops current scene)
this.scene.start(SceneKeys.IconGrid);

// Launch a scene in parallel (keeps current scene running)
this.scene.launch(SceneKeys.Overlay);

// Stop a scene
this.scene.stop(SceneKeys.Preload);
```

## Event Integration

Scenes communicate via Socket.io events through the GamePlugin:

- **BuzzerPress**: Triggers game start from Idle (hardware button)
- **RequestPrize**: Sent from Idle scene with callback to get prize outcome before Intro
- **PrizeAwarded**: Broadcast to all clients when prize is determined
- **AnimationComplete**: Sent from Result scene when returning to Idle

## References

- Scene keys: `docker/app/client/src/consts/SceneKeys.ts`
- Scene registration: `docker/app/client/src/main.ts`
- Game constants: `docker/app/client/src/consts/GameConstants.ts`
- Texture keys: `docker/app/client/src/consts/TextureKeys.ts`
- Game events: `docker/app/shared/GameEvents.ts`
