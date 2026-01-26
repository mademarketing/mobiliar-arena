/**
 * CircularPhysics - Utility functions for circular arena physics
 *
 * Handles coordinate conversions, paddle positioning, and collision detection
 * for the circular Pong arena.
 */

import { ARENA, PADDLE } from "../consts/GameConstants";

// Re-export arena constants for convenience
export const ARENA_CENTER_X = ARENA.CENTER_X;
export const ARENA_CENTER_Y = ARENA.CENTER_Y;
export const ARENA_RADIUS = ARENA.RADIUS;

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Get the center angle for a player's paddle based on their position
 * Players are distributed evenly around the circle starting from the top
 *
 * @param playerIndex - Player index (0-5)
 * @param totalPlayers - Total number of active players (2-6)
 * @returns Center angle in degrees (0 = top, 90 = right, 180 = bottom, 270 = left)
 */
export function getPaddleAngle(
  playerIndex: number,
  totalPlayers: number
): number {
  // Start from top (270 degrees in standard math coords, but we use 0 = top)
  // Distribute evenly around the circle
  const anglePerPlayer = 360 / totalPlayers;
  return normalizeAngle(playerIndex * anglePerPlayer);
}

/**
 * Calculate the arc length (in degrees) for a paddle based on player count
 * More players = smaller paddles
 *
 * @param totalPlayers - Total number of active players (2-6)
 * @returns Arc width in degrees
 */
export function getPaddleArcLength(totalPlayers: number): number {
  // Base arc divided by a factor that scales with player count
  // 2 players: 40 degrees, 6 players: ~26 degrees
  const arcDegrees = PADDLE.BASE_ARC_DEGREES - (totalPlayers - 2) * 3;
  return Math.max(arcDegrees, PADDLE.MIN_ARC_DEGREES);
}

/**
 * Get the angular range a paddle can move within
 * Each player has a "sector" they can move in
 *
 * @param playerIndex - Player index (0-5)
 * @param totalPlayers - Total number of active players (2-6)
 * @returns Object with minAngle and maxAngle in degrees
 */
export function getPaddleMovementRange(
  playerIndex: number,
  totalPlayers: number
): { minAngle: number; maxAngle: number } {
  const centerAngle = getPaddleAngle(playerIndex, totalPlayers);
  const sectorSize = 360 / totalPlayers;
  const paddleArc = getPaddleArcLength(totalPlayers);

  // The paddle can move within its sector, minus half the paddle width on each side
  const halfPaddle = paddleArc / 2;
  const halfSector = sectorSize / 2;

  return {
    minAngle: normalizeAngle(centerAngle - halfSector + halfPaddle),
    maxAngle: normalizeAngle(centerAngle + halfSector - halfPaddle),
  };
}

/**
 * Convert polar coordinates to Cartesian (screen) coordinates
 * Note: In our system, 0 degrees is at the top, increasing clockwise
 *
 * @param angle - Angle in degrees (0 = top, 90 = right)
 * @param radius - Distance from center
 * @param centerX - Center X coordinate (default: ARENA_CENTER_X)
 * @param centerY - Center Y coordinate (default: ARENA_CENTER_Y)
 * @returns Object with x and y screen coordinates
 */
export function polarToCartesian(
  angle: number,
  radius: number,
  centerX: number = ARENA_CENTER_X,
  centerY: number = ARENA_CENTER_Y
): { x: number; y: number } {
  // Convert to standard math convention (0 = right, counter-clockwise)
  // Our convention: 0 = top, clockwise
  // Standard: 0 = right, counter-clockwise
  // So: our 0 -> standard -90 (270), our 90 -> standard 0
  const standardAngle = degreesToRadians(angle - 90);

  return {
    x: centerX + radius * Math.cos(standardAngle),
    y: centerY + radius * Math.sin(standardAngle),
  };
}

/**
 * Convert Cartesian (screen) coordinates to polar coordinates
 *
 * @param x - Screen X coordinate
 * @param y - Screen Y coordinate
 * @param centerX - Center X coordinate (default: ARENA_CENTER_X)
 * @param centerY - Center Y coordinate (default: ARENA_CENTER_Y)
 * @returns Object with angle (degrees) and radius
 */
export function cartesianToPolar(
  x: number,
  y: number,
  centerX: number = ARENA_CENTER_X,
  centerY: number = ARENA_CENTER_Y
): { angle: number; radius: number } {
  const dx = x - centerX;
  const dy = y - centerY;

  const radius = Math.sqrt(dx * dx + dy * dy);
  // atan2 gives angle in standard convention (0 = right, counter-clockwise)
  const standardAngle = Math.atan2(dy, dx);
  // Convert to our convention (0 = top, clockwise)
  const angle = normalizeAngle(radiansToDegrees(standardAngle) + 90);

  return { angle, radius };
}

/**
 * Check if a ball collides with a paddle
 *
 * @param ballX - Ball X position
 * @param ballY - Ball Y position
 * @param ballRadius - Ball radius
 * @param paddleAngle - Paddle center angle in degrees
 * @param paddleArcWidth - Paddle arc width in degrees
 * @param paddleInnerRadius - Inner edge of paddle
 * @param paddleOuterRadius - Outer edge of paddle
 * @returns true if collision detected
 */
export function checkPaddleCollision(
  ballX: number,
  ballY: number,
  ballRadius: number,
  paddleAngle: number,
  paddleArcWidth: number,
  paddleInnerRadius: number = PADDLE.INNER_RADIUS,
  paddleOuterRadius: number = PADDLE.OUTER_RADIUS
): boolean {
  const ball = cartesianToPolar(ballX, ballY);

  // Check if ball is in the radial range of the paddle (with ball radius considered)
  const ballOuterEdge = ball.radius + ballRadius;
  const ballInnerEdge = ball.radius - ballRadius;

  if (ballOuterEdge < paddleInnerRadius || ballInnerEdge > paddleOuterRadius) {
    return false;
  }

  // Check if ball is within the angular range of the paddle
  const halfArc = paddleArcWidth / 2;
  const minAngle = normalizeAngle(paddleAngle - halfArc);
  const maxAngle = normalizeAngle(paddleAngle + halfArc);

  // Handle angle wrapping (e.g., paddle spanning 350-10 degrees)
  if (minAngle > maxAngle) {
    // Paddle spans across 0 degrees
    return ball.angle >= minAngle || ball.angle <= maxAngle;
  }

  return ball.angle >= minAngle && ball.angle <= maxAngle;
}

/**
 * Reflect ball velocity after hitting a paddle
 * The ball bounces back toward the center with some angle based on where it hit
 *
 * @param ballVelocityX - Current ball X velocity
 * @param ballVelocityY - Current ball Y velocity
 * @param ballX - Ball X position
 * @param ballY - Ball Y position
 * @param paddleAngle - Paddle center angle in degrees
 * @param paddleArcWidth - Paddle arc width in degrees
 * @returns New velocity object with x and y components
 */
export function reflectBallVelocity(
  ballVelocityX: number,
  ballVelocityY: number,
  ballX: number,
  ballY: number,
  paddleAngle: number,
  paddleArcWidth: number
): { x: number; y: number } {
  const ball = cartesianToPolar(ballX, ballY);
  const speed = Math.sqrt(
    ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY
  );

  // Calculate where on the paddle the ball hit (-1 to 1, 0 = center)
  const halfArc = paddleArcWidth / 2;
  let hitOffset = ball.angle - paddleAngle;

  // Normalize hit offset for paddles spanning 0 degrees
  if (hitOffset > 180) hitOffset -= 360;
  if (hitOffset < -180) hitOffset += 360;

  // Normalize to -1 to 1 range
  const normalizedHit = hitOffset / halfArc;

  // Base reflection angle: toward center with offset based on hit position
  // Hitting the edge of the paddle deflects the ball more
  const baseAngle = ball.angle + 180; // Toward center
  const deflectionAngle = normalizedHit * 45; // Up to 45 degree deflection
  const reflectionAngle = normalizeAngle(baseAngle + deflectionAngle);

  // Convert to velocity components
  const velocity = polarToCartesian(reflectionAngle, speed, 0, 0);

  return velocity;
}

/**
 * Check if a ball has left the arena (missed by all paddles)
 *
 * @param ballX - Ball X position
 * @param ballY - Ball Y position
 * @param ballRadius - Ball radius
 * @returns true if ball is outside the arena
 */
export function isBallOutOfBounds(
  ballX: number,
  ballY: number,
  ballRadius: number
): boolean {
  const ball = cartesianToPolar(ballX, ballY);
  return ball.radius - ballRadius > ARENA_RADIUS;
}

/**
 * Generate a random spawn position for a ball near the center
 *
 * @param maxOffset - Maximum offset from center
 * @returns Object with x and y spawn coordinates
 */
export function getRandomSpawnPosition(
  maxOffset: number = 50
): { x: number; y: number } {
  const angle = Math.random() * 360;
  const radius = Math.random() * maxOffset;
  return polarToCartesian(angle, radius);
}

/**
 * Generate a random initial velocity for a ball
 *
 * @param speed - Initial speed
 * @returns Object with x and y velocity components
 */
export function getRandomVelocity(speed: number): { x: number; y: number } {
  const angle = Math.random() * 360;
  return polarToCartesian(angle, speed, 0, 0);
}
