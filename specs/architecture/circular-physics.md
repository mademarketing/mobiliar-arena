# Circular Physics System

## Overview

Mobiliar Arena uses a circular coordinate system for positioning paddles and calculating ball collisions. This document describes the math and implementation patterns for the circular arena.

## Coordinate System

### Canvas vs Arena

**Canvas**: Standard 1920x1080 rectangular Phaser canvas
**Arena**: Circular playing field centered on the canvas

```
Canvas (1920x1080)
┌────────────────────────────────────────┐
│                                        │
│       ┌──────────────────────┐         │
│       │                      │         │
│       │     Circular Arena   │         │
│       │     (radius ~480)    │         │
│       │                      │         │
│       │         ●            │         │
│       │     (960, 540)       │         │
│       │                      │         │
│       └──────────────────────┘         │
│                                        │
└────────────────────────────────────────┘
```

### Arena Constants

```typescript
const ARENA_CENTER_X = 960;  // Canvas center
const ARENA_CENTER_Y = 540;  // Canvas center
const ARENA_RADIUS = 480;    // Fits within 1080 height with margin
```

## Paddle Positioning

### Angular Distribution

Paddles are distributed evenly around the circle based on player count:

```typescript
function getPaddleAngle(playerIndex: number, totalPlayers: number): number {
  const anglePerPlayer = (2 * Math.PI) / totalPlayers;
  // Start from top (negative Y direction in screen coordinates)
  const startAngle = -Math.PI / 2;
  return startAngle + (playerIndex * anglePerPlayer);
}
```

**Examples**:
- 2 players: 180° apart (top and bottom)
- 3 players: 120° apart (triangle)
- 4 players: 90° apart (square)
- 6 players: 60° apart (hexagon)

### Paddle Arc Length

Each paddle covers an arc of the circle. Arc size is dynamic:

```typescript
function getPaddleArcLength(totalPlayers: number, baseArcDegrees: number = 40): number {
  // More players = smaller paddles
  // Base arc is for 2 players, scales down for more
  const scaleFactor = 2 / totalPlayers;
  return baseArcDegrees * scaleFactor;
}
```

### Paddle Position on Arc

Paddles move within their assigned arc segment:

```typescript
function getPaddlePosition(
  angle: number,  // Current angle in radians
  radius: number  // Distance from center
): { x: number; y: number } {
  return {
    x: ARENA_CENTER_X + radius * Math.cos(angle),
    y: ARENA_CENTER_Y + radius * Math.sin(angle)
  };
}
```

### Paddle Movement

Movement converts button input to angular velocity:

```typescript
function updatePaddleAngle(
  currentAngle: number,
  minAngle: number,      // Left boundary of paddle's zone
  maxAngle: number,      // Right boundary of paddle's zone
  leftButtonDown: boolean,
  rightButtonDown: boolean,
  angularSpeed: number,  // Radians per second
  deltaTime: number      // Seconds since last update
): number {
  let newAngle = currentAngle;

  if (leftButtonDown) {
    newAngle -= angularSpeed * deltaTime;
  }
  if (rightButtonDown) {
    newAngle += angularSpeed * deltaTime;
  }

  // Clamp to paddle's zone
  return Math.max(minAngle, Math.min(maxAngle, newAngle));
}
```

## Ball Physics

### Ball State

```typescript
interface Ball {
  x: number;           // Position X
  y: number;           // Position Y
  velocityX: number;   // Velocity X (pixels per second)
  velocityY: number;   // Velocity Y (pixels per second)
  radius: number;      // Ball radius for collision
}
```

### Ball Spawning

Balls spawn from center with random direction:

```typescript
function spawnBall(speed: number): Ball {
  const angle = Math.random() * 2 * Math.PI;
  return {
    x: ARENA_CENTER_X,
    y: ARENA_CENTER_Y,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    radius: 15
  };
}
```

### Ball Movement

Simple linear movement per frame:

```typescript
function updateBallPosition(ball: Ball, deltaTime: number): void {
  ball.x += ball.velocityX * deltaTime;
  ball.y += ball.velocityY * deltaTime;
}
```

### Distance from Center

```typescript
function getDistanceFromCenter(x: number, y: number): number {
  const dx = x - ARENA_CENTER_X;
  const dy = y - ARENA_CENTER_Y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

## Collision Detection

### Ball-Paddle Collision

Check if ball is within a paddle's arc and at the right distance:

```typescript
function checkPaddleCollision(
  ball: Ball,
  paddleCenterAngle: number,
  paddleArcHalfWidth: number,  // Half the arc in radians
  paddleRadius: number,         // Distance from center
  paddleThickness: number       // Paddle depth
): boolean {
  // Get ball's polar coordinates
  const dx = ball.x - ARENA_CENTER_X;
  const dy = ball.y - ARENA_CENTER_Y;
  const ballDistance = Math.sqrt(dx * dx + dy * dy);
  const ballAngle = Math.atan2(dy, dx);

  // Check if ball is at paddle's radius (with thickness tolerance)
  const radiusMatch =
    ballDistance >= paddleRadius - paddleThickness &&
    ballDistance <= paddleRadius + paddleThickness + ball.radius;

  // Check if ball is within paddle's arc
  const angleDiff = normalizeAngle(ballAngle - paddleCenterAngle);
  const arcMatch = Math.abs(angleDiff) <= paddleArcHalfWidth;

  return radiusMatch && arcMatch;
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}
```

### Ball-Paddle Bounce

Reflect the ball when hitting a paddle:

```typescript
function bounceOffPaddle(
  ball: Ball,
  paddleCenterAngle: number,
  hitPosition: number  // -1 to 1, position on paddle
): void {
  // Normal vector points inward (toward center)
  const normalX = -Math.cos(paddleCenterAngle);
  const normalY = -Math.sin(paddleCenterAngle);

  // Reflect velocity around normal
  const dotProduct = ball.velocityX * normalX + ball.velocityY * normalY;
  ball.velocityX -= 2 * dotProduct * normalX;
  ball.velocityY -= 2 * dotProduct * normalY;

  // Add spin based on hit position (optional)
  const spinFactor = hitPosition * 0.3;  // Adjust for feel
  ball.velocityX += normalY * spinFactor * Math.abs(ball.velocityX);
  ball.velocityY -= normalX * spinFactor * Math.abs(ball.velocityY);
}
```

### Ball Exit Detection

Check if ball has passed the paddle zone (missed):

```typescript
function hasBallExitedArena(ball: Ball): boolean {
  const distance = getDistanceFromCenter(ball.x, ball.y);
  return distance > ARENA_RADIUS + ball.radius + 50;  // Buffer zone
}
```

## Difficulty Progression

### Paddle Shrinking

Paddle arc width decreases over time:

```typescript
function getPaddleArcMultiplier(
  elapsedTime: number,    // Seconds since game start
  gameDuration: number,   // Total game duration (60s)
  startMultiplier: number = 1.0,
  endMultiplier: number = 0.6
): number {
  const progress = elapsedTime / gameDuration;
  return startMultiplier - (progress * (startMultiplier - endMultiplier));
}
```

### Ball Speed Increase (Optional)

```typescript
function getBallSpeedMultiplier(
  elapsedTime: number,
  gameDuration: number,
  startMultiplier: number = 1.0,
  endMultiplier: number = 1.3
): number {
  const progress = elapsedTime / gameDuration;
  return startMultiplier + (progress * (endMultiplier - startMultiplier));
}
```

## Visual Representation

### Paddle Drawing

```typescript
function drawPaddle(
  graphics: Phaser.GameObjects.Graphics,
  centerAngle: number,
  arcHalfWidth: number,
  innerRadius: number,
  outerRadius: number,
  color: number
): void {
  graphics.lineStyle(outerRadius - innerRadius, color);
  graphics.beginPath();
  graphics.arc(
    ARENA_CENTER_X,
    ARENA_CENTER_Y,
    (innerRadius + outerRadius) / 2,
    centerAngle - arcHalfWidth,
    centerAngle + arcHalfWidth,
    false
  );
  graphics.strokePath();
}
```

### Player Colors

Distinct colors for each player slot:

```typescript
const PLAYER_COLORS = [
  0xFF0000,  // Red
  0x00FF00,  // Green
  0x0066FF,  // Blue
  0xFFFF00,  // Yellow
  0xFF00FF,  // Magenta
  0x00FFFF,  // Cyan
];
```

## Testing Considerations

### Collision Edge Cases

- Ball hits corner of paddle arc
- Ball traveling parallel to paddle
- Multiple balls hitting same paddle
- Ball speed faster than paddle thickness (tunneling)

### Player Count Changes

- Test all configurations (2, 3, 4, 5, 6 players)
- Verify even distribution of paddle zones
- Check that paddle movement bounds are correct

### Performance

- Aim for O(n) collision checks per frame (n = number of balls)
- Consider spatial partitioning if many balls (>50)
- Profile arc drawing performance with many paddles
