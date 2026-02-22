# Feature: lil-gui Debug Panel

## Context
The game currently relies on hardcoded `as const` constants and scattered keyboard shortcuts for development. There's no way to tweak physics, visuals, or timing at runtime without editing code and waiting for hot-reload. A [lil-gui](https://lil-gui.georgealways.com/) debug panel gives instant feedback when tuning ball speed, paddle size, depth scale, effects, and difficulty — making iteration dramatically faster.

## Approach

Create a `DebugGUI` singleton manager that initializes lil-gui when the Game scene starts. Since all constants are `as const` (immutable), the GUI binds to a mutable `RuntimeConfig` object that shadows the constants. Game code reads from RuntimeConfig instead of GameConstants in hot paths, so slider changes take effect on the next frame.

The panel is organized into folders matching the constant groups, plus action buttons for common dev operations.

## Dependencies

- `lil-gui` (npm, ~8kb gzipped) — `npm install lil-gui --save-dev`

## New Files

### `docker/app/client/src/utils/RuntimeConfig.ts`
Mutable copies of game constants that the debug GUI can bind to. Other code imports from here for values that should be tweakable at runtime.

```ts
import { BALL, PADDLE, EFFECTS, GAME, SCORING } from "../consts/GameConstants";

export const runtimeBall = { ...BALL };
export const runtimePaddle = { ...PADDLE };
export const runtimeEffects = { ...EFFECTS };
export const runtimeGame = { ...GAME };
export const runtimeScoring = { ...SCORING };
```

Note: Spread on `as const` objects needs explicit mutable field assignments to get writable types.

### `docker/app/client/src/utils/DebugGUI.ts`
Singleton that creates a lil-gui instance with organized folders. Created/destroyed per Game scene lifecycle to avoid stale references and DOM leaks.

## GUI Layout

### Folder: Ball
| Control | Range | Bound To |
|---------|-------|----------|
| BASE_SPEED | 50–600 | `runtimeBall.BASE_SPEED` |
| MAX_SPEED | 100–1000 | `runtimeBall.MAX_SPEED` |
| SPEED_INCREMENT | 0–100 | `runtimeBall.SPEED_INCREMENT` |
| RADIUS | 5–50 | `runtimeBall.RADIUS` |
| SPAWN_INTERVAL_MS | 1000–15000 | `runtimeBall.SPAWN_INTERVAL_MS` |
| MAX_BALLS | 1–20 | `runtimeBall.MAX_BALLS` |

### Folder: Paddle
| Control | Range | Bound To |
|---------|-------|----------|
| MOVE_SPEED | 50–500 | `runtimePaddle.MOVE_SPEED` |
| BASE_ARC_DEGREES | 10–80 | `runtimePaddle.BASE_ARC_DEGREES` |
| MIN_ARC_DEGREES | 5–40 | `runtimePaddle.MIN_ARC_DEGREES` |

### Folder: Effects
| Control | Range | Bound To |
|---------|-------|----------|
| BALL_DEPTH_SCALE_MAX | 0.5–3.0 | `runtimeEffects.BALL_DEPTH_SCALE_MAX` |
| BALL_DEPTH_SCALE_MIN | 0.1–2.0 | `runtimeEffects.BALL_DEPTH_SCALE_MIN` |
| BALL_TRAIL_LENGTH | 0–20 | `runtimeEffects.BALL_TRAIL_LENGTH` |
| BALL_TRAIL_ALPHA | 0–1 | `runtimeEffects.BALL_TRAIL_ALPHA` |
| BALL_ROTATION_SPEED | 0–0.2 | `runtimeEffects.BALL_ROTATION_SPEED` |
| PADDLE_GLOW_INTENSITY | 0–1 | `runtimeEffects.PADDLE_GLOW_INTENSITY` |
| PADDLE_GLOW_RADIUS | 0–30 | `runtimeEffects.PADDLE_GLOW_RADIUS` |

### Folder: Game
| Control | Range | Bound To |
|---------|-------|----------|
| DURATION_MS | 10000–180000 | `runtimeGame.DURATION_MS` |
| COMBO_TIMEOUT_MS | 500–10000 | `runtimeGame.COMBO_TIMEOUT_MS` |

### Folder: Scoring
| Control | Range | Bound To |
|---------|-------|----------|
| POINTS_PER_BOUNCE | 1–100 | `runtimeScoring.POINTS_PER_BOUNCE` |
| COMBO_MULTIPLIER | 0–5 | `runtimeScoring.COMBO_MULTIPLIER` |
| MAX_COMBO_MULTIPLIER | 1–20 | `runtimeScoring.MAX_COMBO_MULTIPLIER` |

### Folder: Actions (buttons)
| Button | Action |
|--------|--------|
| Spawn Ball | `gameArena.spawnBall()` |
| End Game | `endGame()` |
| Toggle Physics Debug | Flip `game.physics.arcade.drawDebug` |
| Toggle Drag Mode | Enable/disable draggable game objects (also: `G` key) |
| Reset Positions | Restore all dragged objects to their original positions |

## Drag Mode (Visual Repositioning)

A dev-only toggle that makes game objects draggable in-place, so you can visually reposition UI elements and see pixel coordinates without a separate editor.

### Activation
- **Toggle key:** `G` (for "grab") — only active during Game scene
- Adds a `[DRAG MODE]` indicator text in the top-left corner when active

### Behavior When Active
- All scene text objects (`timerText`, `scoreText`, `comboText`) become interactive and draggable
- Key hint labels become draggable
- Objects get a subtle highlight border (1px outline) so you can see what's selectable
- Dragging updates position in real-time using Phaser's built-in drag system:
  ```ts
  gameObject.setInteractive({ draggable: true, useHandCursor: true });
  scene.input.on('drag', (pointer, obj, dragX, dragY) => {
    obj.setPosition(dragX, dragY);
  });
  ```

### Position Logging
- On every drag-end, log the object's name and final `(x, y)` to the console:
  ```
  [DragMode] scoreText → (960, 520)
  [DragMode] timerText → (960, 580)
  ```
- This lets you copy the coordinates back into code

### Coordinate Overlay
- While dragging, show a small tooltip near the cursor with the current `x, y` position
- Implemented as a lightweight `Phaser.GameObjects.Text` that follows the pointer during drag

### lil-gui Integration
- Add a **"Toggle Drag Mode"** button in the Actions folder of the debug GUI
- Add a checkbox: **"Log positions on drag"** (default: on)
- When drag mode is active, the lil-gui panel shows a read-only "Last dragged" field with the object name and position

### Scope
Only UI/static objects are draggable — not balls or paddles (they're physics-driven and would break). Specifically:
- `timerText`, `scoreText`, `comboText` — center HUD elements
- Key hint labels — the "1/2", "3/4" etc. labels outside the arena
- Any future static decorative elements

### Implementation Location
- Drag mode logic lives inside `DebugGUI.ts` (keeps all debug tooling in one place)
- Uses `scene.children.list` filtered to `Phaser.GameObjects.Text` instances to find draggable targets
- Stores original positions so drag mode can be toggled off to reset positions (optional, controlled by a "Reset positions" button)

## Files Modified

| File | Change |
|------|--------|
| `docker/app/client/package.json` | Add `lil-gui` devDependency |
| `docker/app/client/src/utils/RuntimeConfig.ts` | **New** — mutable config copies |
| `docker/app/client/src/utils/DebugGUI.ts` | **New** — lil-gui panel setup |
| `docker/app/client/src/classes/Ball.ts` | Import from RuntimeConfig for hot-path reads |
| `docker/app/client/src/classes/Paddle.ts` | Import from RuntimeConfig for hot-path reads |
| `docker/app/client/src/managers/GameArena.ts` | Import from RuntimeConfig for hot-path reads |
| `docker/app/client/src/scenes/Game.ts` | Init/destroy DebugGUI in `create()`/`shutdown()` |

## Files NOT Modified
- `GameConstants.ts` — remains the source of truth for defaults
- `TestHelper.ts` — no changes needed
- `CircularPhysics.ts` — ARENA constants don't need runtime tweaking

## Key Design Decisions

1. **RuntimeConfig pattern** — Constants stay `as const` for type safety. RuntimeConfig provides mutable shadows initialized from them. Only hot-path reads switch to RuntimeConfig; construction-time reads keep using originals.

2. **Per-scene lifecycle** — GUI is created in Game `create()` and destroyed in `shutdown()` to avoid stale references and DOM leaks across scene transitions.

3. **Positioned top-right, starts collapsed** — `closeFolders: true` so it doesn't obscure the game by default. Open folders as needed.

4. **Dev-only** — Installed as `--save-dev`. Can be tree-shaken or conditionally loaded via `import.meta.env.DEV` check for production builds.

## Verification
1. `npm install` in client dir
2. Start dev server, navigate to game
3. Debug panel appears top-right, collapsed by default
4. Open "Ball" folder → drag BASE_SPEED slider → balls immediately move faster/slower
5. Open "Effects" folder → adjust depth scale sliders → see depth effect change live
6. Click "Spawn Ball" → new ball appears
7. Click "Toggle Physics Debug" → see collision bodies
8. Leave Game scene → confirm panel is destroyed (no DOM leak)
9. Press `G` → "[DRAG MODE]" indicator appears, text objects get highlight
10. Drag `scoreText` to a new position → console logs `[DragMode] scoreText → (x, y)`
11. Coordinate tooltip follows cursor while dragging
12. Press `G` again → drag mode off, highlights removed
13. Click "Reset Positions" in GUI → objects snap back to original positions
