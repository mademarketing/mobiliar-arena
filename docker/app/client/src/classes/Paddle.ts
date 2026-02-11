/**
 * Paddle - A player's paddle
 *
 * Renders as an arc segment on the edge of the arena.
 * Includes glow effect and smooth shrinking animation.
 * Collision detection is handled manually in GameArena using checkPaddleCollision().
 */

import Phaser from "phaser";
import { PADDLE, PLAYER, ARENA, DEPTH, EFFECTS } from "../consts/GameConstants";
import {
  normalizeAngle,
  getPaddleAngle,
  getPaddleArcLength,
  polarToCartesian,
  degreesToRadians,
} from "../utils/CircularPhysics";

export default class Paddle {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;

  private _playerIndex: number;
  private paddleIndex: number; // Position index (0 to totalPlayers-1)
  private totalPlayers: number;
  private _angle: number; // Current center angle in degrees
  private _arcWidth: number; // Arc width in degrees
  private _color: number;
  private _innerRadius: number;
  private _outerRadius: number;

  // Visual effects
  private _hitFlashTime: number = 0;
  private _isShrinking: boolean = false;

  constructor(
    scene: Phaser.Scene,
    playerIndex: number,
    paddleIndex: number,
    totalPlayers: number,
    arcPlayerCount?: number
  ) {
    this.scene = scene;
    this._playerIndex = playerIndex;
    this.paddleIndex = paddleIndex;
    this.totalPlayers = totalPlayers;

    // Initialize position (totalPlayers for slot position, arcPlayerCount for size)
    this._angle = getPaddleAngle(this.paddleIndex, this.totalPlayers);
    this._arcWidth = getPaddleArcLength(arcPlayerCount ?? this.totalPlayers);

    // Set color based on player index
    this._color = PLAYER.COLORS[playerIndex % PLAYER.COLORS.length];

    // Paddle dimensions
    this._innerRadius = PADDLE.INNER_RADIUS;
    this._outerRadius = PADDLE.OUTER_RADIUS;

    // Create glow graphics (rendered behind paddle)
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(DEPTH.PADDLES - 1);
    this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

    // Create graphics object for visual rendering
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(DEPTH.PADDLES);

    // Initial draw
    this.draw();
  }

  // Getters
  get playerIndex(): number {
    return this._playerIndex;
  }
  get angle(): number {
    return this._angle;
  }
  get arcWidth(): number {
    return this._arcWidth;
  }
  get color(): number {
    return this._color;
  }
  get innerRadius(): number {
    return this._innerRadius;
  }
  get outerRadius(): number {
    return this._outerRadius;
  }

  /**
   * Update paddle position based on input
   * @param leftPressed - Is left button pressed
   * @param rightPressed - Is right button pressed
   * @param delta - Time delta in milliseconds
   */
  update(leftPressed: boolean, rightPressed: boolean, delta: number): void {
    if (leftPressed === rightPressed) return;
    const deltaSeconds = delta / 1000;
    const movement = leftPressed
      ? -PADDLE.MOVE_SPEED * deltaSeconds
      : PADDLE.MOVE_SPEED * deltaSeconds;
    this._angle = normalizeAngle(this._angle + movement);
    this.draw();
  }

  /**
   * Set paddle angle externally (used by GameArena for clamping)
   */
  setAngle(angle: number): void {
    this._angle = normalizeAngle(angle);
    this.draw();
  }

  /**
   * Draw the paddle as an arc with glow effect
   */
  draw(): void {
    this.graphics.clear();
    this.glowGraphics.clear();

    // Calculate arc angles (convert from our coordinate system)
    const halfArc = this._arcWidth / 2;
    const startAngle = degreesToRadians(this._angle - halfArc - 90);
    const endAngle = degreesToRadians(this._angle + halfArc - 90);

    // Draw glow effect (multiple layers for soft glow)
    this.drawGlow(startAngle, endAngle);

    // Determine fill color (brighter when hit)
    const now = Date.now();
    const hitFlashProgress = Math.max(0, 1 - (now - this._hitFlashTime) / 150);
    const fillAlpha = 1;
    let fillColor = this._color;

    if (hitFlashProgress > 0) {
      // Brighten color during hit flash
      const r = Math.min(255, ((this._color >> 16) & 0xff) + 100 * hitFlashProgress);
      const g = Math.min(255, ((this._color >> 8) & 0xff) + 100 * hitFlashProgress);
      const b = Math.min(255, (this._color & 0xff) + 100 * hitFlashProgress);
      fillColor = (r << 16) | (g << 8) | b;
    }

    // Draw filled arc
    this.graphics.fillStyle(fillColor, fillAlpha);
    this.graphics.beginPath();

    // Draw outer arc
    this.graphics.arc(
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      this._outerRadius,
      startAngle,
      endAngle,
      false
    );

    // Draw line to inner arc
    const innerEndPos = polarToCartesian(
      this._angle + halfArc,
      this._innerRadius
    );
    this.graphics.lineTo(innerEndPos.x, innerEndPos.y);

    // Draw inner arc (reversed)
    this.graphics.arc(
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      this._innerRadius,
      endAngle,
      startAngle,
      true
    );

    // Close path
    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw outline
    this.graphics.lineStyle(3, 0xffffff, 0.8);
    this.graphics.strokePath();
  }

  /**
   * Draw the glow effect behind the paddle
   */
  private drawGlow(startAngle: number, endAngle: number): void {
    // Draw multiple glow layers for soft effect
    for (let i = 3; i >= 1; i--) {
      const glowRadius = EFFECTS.PADDLE_GLOW_RADIUS * i * 0.5;
      const glowAlpha = EFFECTS.PADDLE_GLOW_INTENSITY * (1 - i * 0.25);

      this.glowGraphics.lineStyle(glowRadius, this._color, glowAlpha);
      this.glowGraphics.beginPath();
      this.glowGraphics.arc(
        ARENA.CENTER_X,
        ARENA.CENTER_Y,
        this._outerRadius + glowRadius * 0.5,
        startAngle,
        endAngle,
        false
      );
      this.glowGraphics.strokePath();
    }
  }

  /**
   * Trigger hit flash effect
   */
  onHit(): void {
    this._hitFlashTime = Date.now();
  }

  /**
   * Update paddle configuration when player count changes
   */
  updatePlayerCount(newPaddleIndex: number, newTotalPlayers: number): void {
    this.paddleIndex = newPaddleIndex;
    this.totalPlayers = newTotalPlayers;
    this._arcWidth = getPaddleArcLength(this.totalPlayers);

    // Reset to center position
    this._angle = getPaddleAngle(this.paddleIndex, this.totalPlayers);

    this.draw();
  }

  /**
   * Shrink the paddle with smooth animation (difficulty increase)
   * @param factor - Factor to shrink by (0-1, where 1 = no change)
   */
  shrink(factor: number): void {
    if (this._isShrinking) return;

    const minArc = PADDLE.MIN_ARC_DEGREES;
    const targetArc = Math.max(this._arcWidth * factor, minArc);

    if (targetArc >= this._arcWidth) return;

    this._isShrinking = true;

    this.scene.tweens.add({
      targets: this,
      _arcWidth: targetArc,
      duration: EFFECTS.PADDLE_SHRINK_DURATION,
      ease: "Cubic.out",
      onUpdate: () => this.draw(),
      onComplete: () => {
        this._isShrinking = false;
      },
    });
  }

  /**
   * Instant shrink without animation (for initialization)
   */
  shrinkInstant(factor: number): void {
    const minArc = PADDLE.MIN_ARC_DEGREES;
    this._arcWidth = Math.max(this._arcWidth * factor, minArc);
    this.draw();
  }

  /**
   * Get collision data for physics checks
   */
  getCollisionData(): {
    angle: number;
    arcWidth: number;
    innerRadius: number;
    outerRadius: number;
  } {
    return {
      angle: this._angle,
      arcWidth: this._arcWidth,
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
    };
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
  }
}
