/**
 * Paddle - A player's paddle using Arcade Physics
 *
 * Renders as an arc segment on the edge of the arena.
 * Uses a physics group of small bodies to approximate the arc for collisions.
 */

import Phaser from "phaser";
import { PADDLE, PLAYER, ARENA, DEPTH } from "../consts/GameConstants";
import {
  normalizeAngle,
  getPaddleAngle,
  getPaddleArcLength,
  getPaddleMovementRange,
  polarToCartesian,
  degreesToRadians,
} from "../utils/CircularPhysics";

const COLLISION_SEGMENTS = 8; // Number of small bodies to approximate the arc

export default class Paddle {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup;
  private collisionBodies: Phaser.Physics.Arcade.Sprite[] = [];

  private _playerIndex: number;
  private paddleIndex: number; // Position index (0 to totalPlayers-1)
  private totalPlayers: number;
  private _angle: number; // Current center angle in degrees
  private _arcWidth: number; // Arc width in degrees
  private _minAngle: number; // Movement boundary
  private _maxAngle: number; // Movement boundary
  private _color: number;
  private _innerRadius: number;
  private _outerRadius: number;

  constructor(
    scene: Phaser.Scene,
    playerIndex: number,
    paddleIndex: number,
    totalPlayers: number
  ) {
    this.scene = scene;
    this._playerIndex = playerIndex;
    this.paddleIndex = paddleIndex;
    this.totalPlayers = totalPlayers;

    // Initialize position
    this._angle = getPaddleAngle(this.paddleIndex, this.totalPlayers);
    this._arcWidth = getPaddleArcLength(this.totalPlayers);

    // Get movement boundaries
    const range = getPaddleMovementRange(this.paddleIndex, this.totalPlayers);
    this._minAngle = range.minAngle;
    this._maxAngle = range.maxAngle;

    // Set color based on player index
    this._color = PLAYER.COLORS[playerIndex % PLAYER.COLORS.length];

    // Paddle dimensions
    this._innerRadius = PADDLE.INNER_RADIUS;
    this._outerRadius = PADDLE.OUTER_RADIUS;

    // Create graphics object for visual rendering
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(DEPTH.PADDLES);

    // Create physics collision group
    this.collisionGroup = scene.physics.add.staticGroup();
    this.createCollisionBodies();

    // Initial draw
    this.draw();
  }

  /**
   * Create small physics bodies to approximate the arc shape
   */
  private createCollisionBodies(): void {
    // Create a small texture for collision bodies
    const key = `paddle_segment_${this._playerIndex}`;
    if (!this.scene.textures.exists(key)) {
      const segmentWidth = 20;
      const segmentHeight = this._outerRadius - this._innerRadius;
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff, 0); // Invisible
      graphics.fillRect(0, 0, segmentWidth, segmentHeight);
      graphics.generateTexture(key, segmentWidth, segmentHeight);
      graphics.destroy();
    }

    // Create collision bodies along the arc
    for (let i = 0; i < COLLISION_SEGMENTS; i++) {
      const body = this.collisionGroup.create(0, 0, key) as Phaser.Physics.Arcade.Sprite;
      body.setVisible(false); // Invisible - graphics handle visuals
      body.setData("paddleInstance", this);
      body.setData("segmentIndex", i);
      this.collisionBodies.push(body);
    }

    this.updateCollisionBodies();
  }

  /**
   * Update collision body positions to match current paddle angle
   */
  private updateCollisionBodies(): void {
    const segmentArc = this._arcWidth / COLLISION_SEGMENTS;
    const startAngle = this._angle - this._arcWidth / 2 + segmentArc / 2;
    const midRadius = (this._innerRadius + this._outerRadius) / 2;

    for (let i = 0; i < COLLISION_SEGMENTS; i++) {
      const segmentAngle = startAngle + i * segmentArc;
      const pos = polarToCartesian(segmentAngle, midRadius);
      const body = this.collisionBodies[i];

      body.setPosition(pos.x, pos.y);
      // Rotate body to align with arc tangent
      body.setAngle(segmentAngle);
      body.refreshBody();
    }
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
  get minAngle(): number {
    return this._minAngle;
  }
  get maxAngle(): number {
    return this._maxAngle;
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
  get physicsGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.collisionGroup;
  }

  /**
   * Update paddle position based on input
   * @param leftPressed - Is left button pressed
   * @param rightPressed - Is right button pressed
   * @param delta - Time delta in milliseconds
   */
  update(leftPressed: boolean, rightPressed: boolean, delta: number): void {
    if (!leftPressed && !rightPressed) {
      return;
    }

    // Calculate movement (degrees per second * seconds)
    const deltaSeconds = delta / 1000;
    let movement = 0;

    if (leftPressed && !rightPressed) {
      movement = -PADDLE.MOVE_SPEED * deltaSeconds;
    } else if (rightPressed && !leftPressed) {
      movement = PADDLE.MOVE_SPEED * deltaSeconds;
    }

    if (movement === 0) {
      return;
    }

    // Apply movement with boundary checking
    const newAngle = normalizeAngle(this._angle + movement);

    // Check if new position is within bounds
    if (this.isAngleInRange(newAngle)) {
      this._angle = newAngle;
      this.draw();
      this.updateCollisionBodies();
    }
  }

  /**
   * Check if an angle is within the paddle's movement range
   * Handles the wrap-around case where minAngle > maxAngle
   */
  private isAngleInRange(angle: number): boolean {
    if (this._minAngle <= this._maxAngle) {
      // Normal case: range doesn't cross 0
      return angle >= this._minAngle && angle <= this._maxAngle;
    } else {
      // Wrap-around case: range crosses 0 (e.g., 350 to 10)
      return angle >= this._minAngle || angle <= this._maxAngle;
    }
  }

  /**
   * Draw the paddle as an arc
   */
  draw(): void {
    this.graphics.clear();

    // Calculate arc angles (convert from our coordinate system)
    const halfArc = this._arcWidth / 2;
    const startAngle = degreesToRadians(this._angle - halfArc - 90);
    const endAngle = degreesToRadians(this._angle + halfArc - 90);

    // Draw filled arc
    this.graphics.fillStyle(this._color, 1);
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
   * Update paddle configuration when player count changes
   */
  updatePlayerCount(newPaddleIndex: number, newTotalPlayers: number): void {
    this.paddleIndex = newPaddleIndex;
    this.totalPlayers = newTotalPlayers;
    this._arcWidth = getPaddleArcLength(this.totalPlayers);

    const range = getPaddleMovementRange(this.paddleIndex, this.totalPlayers);
    this._minAngle = range.minAngle;
    this._maxAngle = range.maxAngle;

    // Reset to center position
    this._angle = getPaddleAngle(this.paddleIndex, this.totalPlayers);

    this.draw();
    this.updateCollisionBodies();
  }

  /**
   * Shrink the paddle (difficulty increase)
   * @param factor - Factor to shrink by (0-1, where 1 = no change)
   */
  shrink(factor: number): void {
    const minArc = PADDLE.MIN_ARC_DEGREES;
    this._arcWidth = Math.max(this._arcWidth * factor, minArc);
    this.draw();
    this.updateCollisionBodies();
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
    this.collisionGroup.destroy(true);
    this.collisionBodies = [];
  }
}
