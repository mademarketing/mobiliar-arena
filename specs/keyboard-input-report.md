# Keyboard Input Implementation Report

## Current Architecture

```
Game.ts (Scene)
    │
    ├── create(): Creates keyboard keys
    │   └── cursors = this.input.keyboard.createCursorKeys()
    │   └── player2Left = this.input.keyboard.addKey(...)
    │
    └── update(): Polls key state and calls movePaddle
        └── if (cursors.left.isDown) → gameArena.movePaddle(0, -1, delta)
            │
            ▼
        GameArena.ts
            │
            └── movePaddle(playerIndex, direction, delta)
                └── paddle.update(leftPressed, rightPressed, delta)
                    │
                    ▼
                Paddle.ts
                    │
                    └── update(leftPressed, rightPressed, delta)
                        └── Calculates movement: PADDLE.MOVE_SPEED * (delta / 1000)
                        └── Updates this._angle
                        └── Calls draw() and updateCollisionBodies()
```

## Observed Problem

User reports: "If I press the arrow button for a short moment the paddle moves until it stops about 1 second later"

Debug logging showed `cursors.left.isDown` returning `true` continuously even after key release.

## What Was Tried

1. **Class property approach** (`this.cursors`) - Failed
2. **Module-level variables** (like Phaser tutorial) - Failed
3. **`removeAllKeys(true)` on shutdown** - Failed
4. **Non-null assertions removed** (`!` to direct access) - Failed

## Potential Root Causes NOT Yet Investigated

1. **Phaser configuration issue** - Maybe keyboard plugin needs explicit enabling in config
2. **iframe/focus issues** - If game runs in iframe, keyboard events may not work correctly
3. **Event capture/preventDefault** - Keys may need `enableCapture: true` parameter
4. **Vite HMR interference** - Hot module replacement may cause key state to persist
5. **Multiple scene keyboard plugins** - Previous scenes may still be capturing events

## Code Comparison: Phaser Tutorial vs Current Implementation

**Phaser Tutorial (works):**
```javascript
// Global scope
var cursors;

function create() {
    cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else {
        player.setVelocityX(0);
    }
}
```

**Current Implementation (doesn't work):**
```typescript
// Module scope
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

create(): void {
    cursors = this.input.keyboard.createCursorKeys();
}

update(_time: number, delta: number): void {
    if (cursors.left.isDown) {
        this.gameArena?.movePaddle(0, -1, delta);
    }
}
```

## Key Differences

| Aspect | Tutorial | Current Code |
|--------|----------|--------------|
| Language | JavaScript | TypeScript |
| Variable declaration | `var` | `let` with type |
| Movement target | Physics sprite (`setVelocityX`) | Custom Paddle class |
| Scene structure | Plain functions | ES6 class |
| Movement method | Direct velocity set | Angle calculation with delta |

## Questions to Investigate

1. Is `this.input.keyboard` actually defined when `createCursorKeys()` is called?
2. Are multiple keyboard plugins being created across scenes?
3. Is the Phaser game config correctly enabling keyboard input?
4. Is there something in Vite's dev server interfering with keyboard events?

## Relevant Files

- `docker/app/client/src/scenes/Game.ts` - Scene with keyboard input
- `docker/app/client/src/managers/GameArena.ts` - Arena manager with `movePaddle()`
- `docker/app/client/src/classes/Paddle.ts` - Paddle with `update()` method
- `docker/app/client/src/consts/config.ts` - Phaser game configuration

## Recommendation

The implementation pattern appears correct based on Phaser documentation. The issue is likely environmental or configuration-related rather than a code logic issue. Need to verify:

1. Check browser console for any Phaser warnings about keyboard
2. Verify keyboard is enabled in Phaser config
3. Test with a minimal Phaser scene (no GameArena, just cursor keys + console.log)
4. Check if the game canvas has focus when testing keyboard input
