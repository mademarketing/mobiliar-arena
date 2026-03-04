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
  private _baseScale: number = 1;
  private _rotation: number = 0;
  private _trailPositions: TrailPosition[] = [];
  private _trailGraphics: Phaser.GameObjects.Graphics;
  private _glowGraphics: Phaser.GameObjects.Graphics;
  private _lastTrailUpdate: number = 0;
  private _trailUpdateInterval: number = 16; // ~60fps

  // Fireball tracking
  private _hitCount: number = 0;

  private static nextId = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._id = Ball.nextId++;
    this._isActive = false;

    // Create trail graphics (rendered behind ball)
    this._trailGraphics = scene.add.graphics();
    this._trailGraphics.setDepth(DEPTH.BALLS - 1);

    // Create glow graphics (rendered behind ball, above trail)
    this._glowGraphics = scene.add.graphics();
    this._glowGraphics.setDepth(DEPTH.BALLS - 1);
    this._glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

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
      this._baseScale = (BALL.RADIUS * 2) / Math.max(frame.width, frame.height);
      this._sprite.setScale(this._baseScale);
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
  get isOnFire(): boolean {
    return this._hitCount >= EFFECTS.FIRE_HIT_THRESHOLD;
  }
  get hitCount(): number {
    return this._hitCount;
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
    this._glowGraphics.clear();
    this._hitCount = 0;
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
   * Increment hit count and return whether fire mode just activated
   */
  incrementHitCount(): boolean {
    const wasFire = this.isOnFire;
    this._hitCount++;
    return !wasFire && this.isOnFire;
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
    this._glowGraphics.clear();
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

    // Depth scale: ball appears larger near center, smaller near edge
    const polar = cartesianToPolar(this._sprite.x, this._sprite.y);
    const t = Math.min(polar.radius / ARENA_RADIUS, 1);
    const depthScale = EFFECTS.BALL_DEPTH_SCALE_MAX - (EFFECTS.BALL_DEPTH_SCALE_MAX - EFFECTS.BALL_DEPTH_SCALE_MIN) * t;

    // Pulsating scale when on fire
    let fireScale = 1;
    if (this.isOnFire) {
      fireScale = 1 + 0.08 * Math.sin(time * 0.008);
    }
    this._sprite.setScale(this._baseScale * depthScale * fireScale);

    // Update trail positions (throttled)
    if (time - this._lastTrailUpdate > this._trailUpdateInterval) {
      this._lastTrailUpdate = time;

      // Add current position to trail
      this._trailPositions.unshift({ x: this._sprite.x, y: this._sprite.y });

      // Keep only the last N positions (longer trail when on fire)
      const maxTrail = this.isOnFire ? EFFECTS.FIRE_TRAIL_LENGTH : EFFECTS.BALL_TRAIL_LENGTH;
      while (this._trailPositions.length > maxTrail) {
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
    this._glowGraphics.clear();

    if (this._trailPositions.length < 2) return;

    const onFire = this.isOnFire;
    const fireColors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00];

    for (let i = 1; i < this._trailPositions.length; i++) {
      const pos = this._trailPositions[i];
      const progress = i / this._trailPositions.length;
      const trailAlpha = onFire
        ? EFFECTS.FIRE_TRAIL_ALPHA * (1 - progress)
        : EFFECTS.BALL_TRAIL_ALPHA * (1 - progress);
      const baseRadius = BALL.RADIUS * (1 - progress * 0.3);

      // Apply depth scale to trail circles
      const polar = cartesianToPolar(pos.x, pos.y);
      const t = Math.min(polar.radius / ARENA_RADIUS, 1);
      const trailDepthScale = EFFECTS.BALL_DEPTH_SCALE_MAX - (EFFECTS.BALL_DEPTH_SCALE_MAX - EFFECTS.BALL_DEPTH_SCALE_MIN) * t;

      const color = onFire ? fireColors[Math.min(i - 1, fireColors.length - 1)] : 0xffffff;
      this._trailGraphics.fillStyle(color, trailAlpha);
      this._trailGraphics.fillCircle(pos.x, pos.y, baseRadius * trailDepthScale);
    }

    // Draw glow around ball when on fire
    if (onFire) {
      const glowAlpha = 0.25 + 0.15 * Math.sin(Date.now() * 0.006);
      this._glowGraphics.fillStyle(0xff6600, glowAlpha);
      this._glowGraphics.fillCircle(this._sprite.x, this._sprite.y, BALL.RADIUS * 2.2);
      this._glowGraphics.fillStyle(0xff4500, glowAlpha * 0.5);
      this._glowGraphics.fillCircle(this._sprite.x, this._sprite.y, BALL.RADIUS * 3);
    }
  }

  /**
   * Destroy the ball and clean up
   */
  destroy(): void {
    this._isActive = false;
    this._sprite.destroy();
    this._trailGraphics.destroy();
    this._glowGraphics.destroy();
  }
}
