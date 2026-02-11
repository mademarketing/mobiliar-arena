# Plan: Free paddle movement with paddle-paddle collision

## Task Description
Currently each paddle is locked to its own sector (60° for 6 players). Paddles cannot leave their sector or touch neighboring paddles. The user wants paddles to move freely around the full 360° circle, only stopping when they collide with another paddle.

## Objective
Remove sector-based movement constraints and replace them with dynamic paddle-paddle collision so paddles can roam freely until they bump into a neighbor.

## Problem Statement
With fixed sectors, paddles have very limited range — especially with 6 players where each only gets 60°. This makes gameplay feel restrictive. Paddles should be free to cover gaps left by other players (cooperative game), blocked only by physical contact with another paddle.

## Solution Approach
1. Remove static min/max angle boundaries from `Paddle`
2. Move boundary logic to `GameArena` which knows all paddle positions
3. Before applying movement, compute dynamic bounds from the nearest clockwise and counter-clockwise neighbor
4. Clamp the new angle so paddles touch but never overlap

## Relevant Files

- **`docker/app/client/src/classes/Paddle.ts`** — Remove static boundary fields/methods, simplify `update()` to accept an externally-computed new angle
- **`docker/app/client/src/managers/GameArena.ts`** — Add dynamic neighbor-based clamping in `movePaddle()`
- **`docker/app/client/src/utils/CircularPhysics.ts`** — Remove `getPaddleMovementRange()` (now unused), add `angularDistance()` helper

## Step by Step Tasks

### 1. Add `angularDistance` helper to CircularPhysics.ts
- Add a signed angular distance function that returns the shortest path between two angles (-180 to +180):
```ts
/** Signed shortest angular distance from `from` to `to` (positive = clockwise) */
export function signedAngularDistance(from: number, to: number): number {
  let diff = normalizeAngle(to - from);
  if (diff > 180) diff -= 360;
  return diff;
}
```

### 2. Simplify Paddle.ts — remove sector boundaries
- Remove `_minAngle`, `_maxAngle` private fields
- Remove `minAngle`, `maxAngle` getters
- Remove `isAngleInRange()` private method
- Remove `getPaddleMovementRange` import
- Change `update()` to calculate desired angle and apply it unconditionally (no boundary check):
```ts
update(leftPressed: boolean, rightPressed: boolean, delta: number): void {
  if (leftPressed === rightPressed) return;
  const deltaSeconds = delta / 1000;
  const movement = leftPressed
    ? -PADDLE.MOVE_SPEED * deltaSeconds
    : PADDLE.MOVE_SPEED * deltaSeconds;
  this._angle = normalizeAngle(this._angle + movement);
  this.draw();
}
```
- Add a public setter so GameArena can clamp the angle after movement:
```ts
setAngle(angle: number): void {
  this._angle = normalizeAngle(angle);
  this.draw();
}
```
- In `updatePlayerCount()`, remove the `getPaddleMovementRange` call and the min/max angle assignment. Keep the arc width update and center-position reset.

### 3. Add paddle clamping to GameArena.ts
- Import `signedAngularDistance` from CircularPhysics
- Add a `clampPaddleAgainstNeighbors(paddle)` method:
```ts
private clampPaddleAgainstNeighbors(paddle: Paddle): void {
  for (const other of this.paddles.values()) {
    if (other.playerIndex === paddle.playerIndex) continue;

    const minGap = (paddle.arcWidth + other.arcWidth) / 2;
    const dist = signedAngularDistance(paddle.angle, other.angle);
    const absDist = Math.abs(dist);

    if (absDist < minGap) {
      // Overlapping — push this paddle to just touching
      const pushAngle = dist > 0
        ? other.angle - minGap   // other is CW, push us CCW
        : other.angle + minGap;  // other is CCW, push us CW
      paddle.setAngle(pushAngle);
    }
  }
}
```
- In `movePaddle()`, call clamp after `paddle.update()`:
```ts
movePaddle(playerIndex: number, direction: number, delta: number): void {
  const paddle = this.paddles.get(playerIndex);
  if (paddle) {
    const leftPressed = direction < 0;
    const rightPressed = direction > 0;
    paddle.update(leftPressed, rightPressed, delta);
    this.clampPaddleAgainstNeighbors(paddle);
  }
}
```

### 4. Clean up unused code
- In `CircularPhysics.ts`: remove `getPaddleMovementRange()` function (now unused)
- Verify no other files reference it

### 5. Validate
- `cd docker/app/client && npx tsc --noEmit` — TypeScript compiles
- Open http://localhost:8080, join 2 players, start game
- Verify paddles can move freely past their original sector boundaries
- Verify paddles stop when they bump into each other (no overlap)
- Verify ball collision still works correctly at all paddle positions

## Acceptance Criteria
- Paddles move freely around the full 360° circle
- Paddles stop at the edge of a neighboring paddle (no overlap)
- Ball-paddle collision still works correctly at any position
- No TypeScript compilation errors (excluding pre-existing `checkComboMilestone` warning)

## Validation Commands
- `cd docker/app/client && npx tsc --noEmit` — Compiles without new errors
