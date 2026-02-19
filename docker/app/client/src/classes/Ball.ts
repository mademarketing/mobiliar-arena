/**
 * Ball - A ball entity using Arcade Physics
 *
 * Uses Phaser Arcade Physics for movement and velocity.
 * Custom boundary checking for circular arena.
 * Includes rotation animation and motion trail effects.
 */

import Phaser from "phaser";
import { BALL, ARENA, DEPTH, EFFECTS } from "../consts/GameConstants";
import {
  cartesianToPolar,
  getRandomSpawnPosition,
  getRandomVelocity,
  ARENA_RADIUS,
} from "../utils/CircularPhysics";
import ThemeManager from "../managers/ThemeManager";

interface TrailPosition {
  x: number;
  y: number;
}

export default class Ball {
  private scene: Phaser.Scene;
  private _sprite: Phaser.Physics.Arcade.Sprite;
  private _isActive: boolean;
  private _id: number;

  // Visual effects
  private _rotation: number = 0;
  private _trailPositions: TrailPosition[] = [];
  private _trailGraphics: Phaser.GameObjects.Graphics;
  private _lastTrailUpdate: number = 0;
  private _trailUpdateInterval: number = 16; // ~60fps

  private static nextId = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._id = Ball.nextId++;
    this._isActive = false;

    // Create trail graphics (rendered behind ball)
    this._trailGraphics = scene.add.graphics();
    this._trailGraphics.setDepth(DEPTH.BALLS - 1);

    // Create physics sprite using theme ball texture
    const themeManager = ThemeManager.getInstance();
    const ballKey = themeManager.getBallKey();

    // Check if theme ball texture exists, otherwise use generated texture
    if (scene.textures.exists(ballKey)) {
      this._sprite = scene.physics.add.sprite(
        ARENA.CENTER_X,
        ARENA.CENTER_Y,
        ballKey
      );
      // Scale theme ball to match expected ball radius
      const texture = scene.textures.get(ballKey);
      const frame = texture.get();
      const scale = (BALL.RADIUS * 2) / Math.max(frame.width, frame.height);
      this._sprite.setScale(scale);
    } else {
      // Fallback to generated texture
      this.createBallTexture();
      this._sprite = scene.physics.add.sprite(
        ARENA.CENTER_X,
        ARENA.CENTER_Y,
        `ball_${this._id}`
      );
    }

    // Configure physics body
    this._sprite.setCircle(BALL.RADIUS);
    this._sprite.setBounce(1, 1);
    this._sprite.setCollideWorldBounds(false); // We handle circular bounds manually
    this._sprite.setDepth(DEPTH.BALLS);
    this._sprite.setVisible(false);
    this._sprite.setActive(false);

    // Store reference to this Ball instance on the sprite for collision callbacks
    this._sprite.setData("ballInstance", this);
  }

  /**
   * Create a circle texture for the ball
   */
  private createBallTexture(): void {
    const key = `ball_${this._id}`;
    if (this.scene.textures.exists(key)) return;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(BALL.RADIUS, BALL.RADIUS, BALL.RADIUS);
    graphics.lineStyle(2, 0xcccccc, 1);
    graphics.strokeCircle(BALL.RADIUS, BALL.RADIUS, BALL.RADIUS);
    graphics.generateTexture(key, BALL.RADIUS * 2, BALL.RADIUS * 2);
    graphics.destroy();
  }

  // Getters
  get x(): number {
    return this._sprite.x;
  }
  get y(): number {
    return this._sprite.y;
  }
  get velocityX(): number {
    return this._sprite.body?.velocity.x ?? 0;
  }
  get velocityY(): number {
    return this._sprite.body?.velocity.y ?? 0;
  }
  get radius(): number {
    return BALL.RADIUS;
  }
  get speed(): number {
    return Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get id(): number {
    return this._id;
  }
  get sprite(): Phaser.Physics.Arcade.Sprite {
    return this._sprite;
  }
  get body(): Phaser.Physics.Arcade.Body | null {
    return this._sprite.body as Phaser.Physics.Arcade.Body | null;
  }

  /**
   * Spawn the ball at a random position near center with random velocity
   */
  spawn(speed?: number): void {
    const actualSpeed = speed ?? BALL.BASE_SPEED;

    // Get random spawn position near center
    const spawnPos = getRandomSpawnPosition(30);

    // Get random initial velocity
    const velocity = getRandomVelocity(actualSpeed);

    this._sprite.setPosition(spawnPos.x, spawnPos.y);
    this._sprite.setVelocity(velocity.x, velocity.y);
    this._sprite.setVisible(true);
    this._sprite.setActive(true);
    this._isActive = true;

    // Reset visual effects
    this._rotation = 0;
    this._trailPositions = [];
    this._trailGraphics.clear();
  }

  /**
   * Spawn at a specific position with specific velocity
   */
  spawnAt(x: number, y: number, velocityX: number, velocityY: number): void {
    this._sprite.setPosition(x, y);
    this._sprite.setVelocity(velocityX, velocityY);
    this._sprite.setVisible(true);
    this._sprite.setActive(true);
    this._isActive = true;
  }

  /**
   * Check if ball is out of circular bounds
   * @returns true if ball went out of bounds and was deactivated
   */
  checkBounds(): boolean {
    if (!this._isActive) return true;

    const polar = cartesianToPolar(this._sprite.x, this._sprite.y);
    if (polar.radius + BALL.RADIUS > ARENA_RADIUS + 50) {
      // Ball is outside arena (with small buffer)
      this.deactivate();
      return true;
    }
    return false;
  }

  /**
   * Set new velocity (used after paddle collision)
   */
  setVelocity(velocityX: number, velocityY: number): void {
    this._sprite.setVelocity(velocityX, velocityY);
  }

  /**
   * Increase ball speed (called after each bounce)
   */
  increaseSpeed(): void {
    const currentSpeed = this.speed;
    if (currentSpeed <= 0) return;

    const newSpeed = Math.min(currentSpeed + BALL.SPEED_INCREMENT, BALL.MAX_SPEED);
    const ratio = newSpeed / currentSpeed;

    this._sprite.setVelocity(
      this.velocityX * ratio,
      this.velocityY * ratio
    );
  }

  /**
   * Deactivate the ball (went out of bounds)
   */
  deactivate(): void {
    this._isActive = false;
    this._sprite.setVisible(false);
    this._sprite.setActive(false);
    this._sprite.setVelocity(0, 0);
    this._trailGraphics.clear();
    this._trailPositions = [];
  }

  /**
   * Update ball visual effects (rotation and trail)
   * Should be called every frame from GameArena
   */
  updateVisuals(time: number): void {
    if (!this._isActive) return;

    // Update rotation based on velocity (theme-dependent speed)
    const speed = this.speed;
    if (speed > 0) {
      const themeMultiplier = ThemeManager.getInstance().getBallRotationMultiplier();
      const rotationAmount = speed * EFFECTS.BALL_ROTATION_SPEED * themeMultiplier * 0.016; // ~60fps
      this._rotation += rotationAmount;
      this._sprite.setRotation(this._rotation);
    }

    // Update trail positions (throttled)
    if (time - this._lastTrailUpdate > this._trailUpdateInterval) {
      this._lastTrailUpdate = time;

      // Add current position to trail
      this._trailPositions.unshift({ x: this._sprite.x, y: this._sprite.y });

      // Keep only the last N positions
      if (this._trailPositions.length > EFFECTS.BALL_TRAIL_LENGTH) {
        this._trailPositions.pop();
      }

      // Draw trail
      this.drawTrail();
    }
  }

  /**
   * Draw the motion trail behind the ball
   */
  private drawTrail(): void {
    this._trailGraphics.clear();

    if (this._trailPositions.length < 2) return;

    for (let i = 1; i < this._trailPositions.length; i++) {
      const pos = this._trailPositions[i];
      const alpha = EFFECTS.BALL_TRAIL_ALPHA * (1 - i / this._trailPositions.length);
      const radius = BALL.RADIUS * (1 - i / this._trailPositions.length * 0.3);

      this._trailGraphics.fillStyle(0xffffff, alpha);
      this._trailGraphics.fillCircle(pos.x, pos.y, radius);
    }
  }

  /**
   * Destroy the ball and clean up
   */
  destroy(): void {
    this._isActive = false;
    this._sprite.destroy();
    this._trailGraphics.destroy();
  }
}
