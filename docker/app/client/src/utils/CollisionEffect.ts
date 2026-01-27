/**
 * CollisionEffect - Particle burst on ball-paddle collision
 *
 * Creates a brief burst of particles at the collision point
 * to provide visual feedback when a ball is deflected.
 */

import Phaser from "phaser";
import { EFFECTS, DEPTH } from "../consts/GameConstants";

/**
 * Create a particle burst effect at the collision point
 * @param scene - The Phaser scene
 * @param x - X coordinate of the collision
 * @param y - Y coordinate of the collision
 * @param color - Color tint for the particles (paddle color)
 */
export function createCollisionEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number
): void {
  // Check if particle texture exists
  if (!scene.textures.exists("particle")) {
    console.warn("CollisionEffect: particle texture not found");
    return;
  }

  const particles = scene.add.particles(x, y, "particle", {
    speed: { min: 50, max: EFFECTS.COLLISION_PARTICLE_SPEED },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 400,
    quantity: EFFECTS.COLLISION_PARTICLES,
    tint: color,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });

  particles.setDepth(DEPTH.PARTICLES);

  // Emit particles once
  particles.explode(EFFECTS.COLLISION_PARTICLES);

  // Auto-destroy after particles fade
  scene.time.delayedCall(500, () => {
    particles.destroy();
  });
}

/**
 * Create a larger celebration particle burst
 * @param scene - The Phaser scene
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param colors - Array of colors to use
 */
export function createCelebrationBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colors: number[]
): void {
  if (!scene.textures.exists("particle")) return;

  const particles = scene.add.particles(x, y, "particle", {
    speed: { min: 100, max: 300 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 800,
    quantity: 20,
    tint: colors,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });

  particles.setDepth(DEPTH.PARTICLES);
  particles.explode(20);

  scene.time.delayedCall(1000, () => {
    particles.destroy();
  });
}
