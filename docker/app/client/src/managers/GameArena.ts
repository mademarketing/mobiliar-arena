/**
 * GameArena - Manages the circular Pong game arena using Arcade Physics
 *
 * Handles players, paddles, balls, collisions, scoring, and game progression.
 */

import Phaser from "phaser";
import Ball from "../classes/Ball";
import Paddle from "../classes/Paddle";
import {
  ARENA,
  BALL,
  GAME,
  SCORING,
  DEPTH,
  COLORS,
} from "../consts/GameConstants";
import {
  reflectBallVelocity,
  degreesToRadians,
  checkPaddleCollision,
} from "../utils/CircularPhysics";

export interface GameState {
  score: number;
  combo: number;
  ballsInPlay: number;
  timeRemaining: number;
  isGameOver: boolean;
}

export default class GameArena {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;

  // Players and paddles
  private activePlayers: number[]; // Array of player indices
  private paddles: Map<number, Paddle>;

  // Balls
  private balls: Ball[];

  // Game state
  private _score: number;
  private _combo: number;
  private _lastBounceTime: number;
  private _isRunning: boolean;
  private _ballSpawnTimer?: Phaser.Time.TimerEvent;
  private _difficultyTimer?: Phaser.Time.TimerEvent;

  // Track recent collisions to prevent double-bouncing
  private recentCollisions: Map<number, number> = new Map();
  private readonly COLLISION_COOLDOWN = 100; // ms

  constructor(scene: Phaser.Scene, playerIndices: number[]) {
    this.scene = scene;
    this.activePlayers = [...playerIndices];
    this.paddles = new Map();
    this.balls = [];
    this._score = 0;
    this._combo = 0;
    this._lastBounceTime = 0;
    this._isRunning = false;

    // Create graphics for arena
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(DEPTH.ARENA);

    // Initialize
    this.drawArena();
    this.createPaddles();
  }

  // Getters
  get score(): number {
    return this._score;
  }
  get combo(): number {
    return this._combo;
  }
  get isRunning(): boolean {
    return this._isRunning;
  }
  get ballCount(): number {
    return this.balls.filter((b) => b.isActive).length;
  }
  get playerCount(): number {
    return this.activePlayers.length;
  }

  /**
   * Draw the arena background and border
   */
  private drawArena(): void {
    this.graphics.clear();

    // Arena fill
    this.graphics.fillStyle(COLORS.ARENA_FILL, 1);
    this.graphics.fillCircle(ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.RADIUS);

    // Arena border
    this.graphics.lineStyle(ARENA.BORDER_WIDTH, COLORS.ARENA_BORDER, 1);
    this.graphics.strokeCircle(ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.RADIUS);

    // Draw sector lines for each player
    const sectorAngle = 360 / this.activePlayers.length;
    this.graphics.lineStyle(2, COLORS.ARENA_BORDER, 0.3);

    for (let i = 0; i < this.activePlayers.length; i++) {
      const angle = degreesToRadians(i * sectorAngle - 90);
      const startX = ARENA.CENTER_X + Math.cos(angle) * 50;
      const startY = ARENA.CENTER_Y + Math.sin(angle) * 50;
      const endX = ARENA.CENTER_X + Math.cos(angle) * ARENA.RADIUS;
      const endY = ARENA.CENTER_Y + Math.sin(angle) * ARENA.RADIUS;

      this.graphics.lineBetween(startX, startY, endX, endY);
    }
  }

  /**
   * Create paddles for all active players
   */
  private createPaddles(): void {
    const totalPlayers = this.activePlayers.length;

    for (let i = 0; i < this.activePlayers.length; i++) {
      const playerIndex = this.activePlayers[i];
      const paddle = new Paddle(this.scene, playerIndex, i, totalPlayers);
      this.paddles.set(playerIndex, paddle);
    }
  }

  /**
   * Handle ball-paddle collision (manual collision detection)
   */
  private handleBallPaddleCollision(ball: Ball, paddle: Paddle): void {
    // Check collision cooldown to prevent double-bouncing
    const now = Date.now();
    const lastCollision = this.recentCollisions.get(ball.id) ?? 0;
    if (now - lastCollision < this.COLLISION_COOLDOWN) {
      return;
    }
    this.recentCollisions.set(ball.id, now);

    // Calculate new velocity based on paddle angle
    const newVelocity = reflectBallVelocity(
      ball.velocityX,
      ball.velocityY,
      ball.x,
      ball.y,
      paddle.angle,
      paddle.arcWidth
    );

    // Apply new velocity and increase speed
    ball.setVelocity(newVelocity.x, newVelocity.y);
    ball.increaseSpeed();

    // Update score
    this._combo++;
    const multiplier = Math.min(
      1 + (this._combo - 1) * SCORING.COMBO_MULTIPLIER,
      SCORING.MAX_COMBO_MULTIPLIER
    );
    const points = Math.round(SCORING.POINTS_PER_BOUNCE * multiplier);
    this._score += points;
    this._lastBounceTime = now;
  }

  /**
   * Start the game
   */
  start(): void {
    this._isRunning = true;
    this._score = 0;
    this._combo = 0;
    this._lastBounceTime = Date.now();
    this.recentCollisions.clear();

    // Spawn first ball
    this.spawnBall();

    // Setup ball spawn timer
    this._ballSpawnTimer = this.scene.time.addEvent({
      delay: BALL.SPAWN_INTERVAL_MS,
      callback: () => {
        if (this.ballCount < BALL.MAX_BALLS) {
          this.spawnBall();
        }
      },
      loop: true,
    });

    // Setup difficulty progression (shrink paddles over time)
    this._difficultyTimer = this.scene.time.addEvent({
      delay: 10000, // Every 10 seconds
      callback: () => {
        for (const paddle of this.paddles.values()) {
          paddle.shrink(0.95); // Shrink by 5%
        }
      },
      loop: true,
    });
  }

  /**
   * Stop the game
   */
  stop(): void {
    this._isRunning = false;

    this._ballSpawnTimer?.remove();
    this._ballSpawnTimer = undefined;

    this._difficultyTimer?.remove();
    this._difficultyTimer = undefined;
  }

  /**
   * Spawn a new ball
   */
  spawnBall(): Ball {
    const ball = new Ball(this.scene);
    ball.spawn();
    this.balls.push(ball);
    return ball;
  }

  /**
   * Move a paddle - called directly when key is pressed (Phaser tutorial pattern)
   * @param playerIndex - Which player's paddle to move
   * @param direction - -1 for left, 1 for right
   * @param delta - Time delta in milliseconds
   */
  movePaddle(playerIndex: number, direction: number, delta: number): void {
    const paddle = this.paddles.get(playerIndex);
    if (paddle) {
      const leftPressed = direction < 0;
      const rightPressed = direction > 0;
      paddle.update(leftPressed, rightPressed, delta);
    }
  }

  /**
   * Update game state (balls, collisions, scoring)
   * Called every frame from scene update
   * @param delta - Time delta in milliseconds
   */
  update(_delta: number): void {
    if (!this._isRunning) {
      return;
    }

    // Check combo timeout
    const now = Date.now();
    if (now - this._lastBounceTime > GAME.COMBO_TIMEOUT_MS) {
      this._combo = 0;
    }

    // Manual collision detection between balls and paddles
    for (const ball of this.balls) {
      if (!ball.isActive) continue;

      for (const paddle of this.paddles.values()) {
        if (
          checkPaddleCollision(
            ball.x,
            ball.y,
            BALL.RADIUS,
            paddle.angle,
            paddle.arcWidth,
            paddle.innerRadius,
            paddle.outerRadius
          )
        ) {
          this.handleBallPaddleCollision(ball, paddle);
        }
      }
    }

    // Check ball bounds (circular arena boundary)
    for (const ball of this.balls) {
      if (ball.isActive) {
        const wentOut = ball.checkBounds();
        if (wentOut) {
          // Ball went out of bounds - reset combo
          this._combo = 0;
        }
      }
    }

    // Clean up inactive balls
    this.balls = this.balls.filter((ball) => {
      if (!ball.isActive) {
        ball.destroy();
        return false;
      }
      return true;
    });

    // Clean up collision cooldowns for destroyed balls
    const activeBallIds = new Set(this.balls.map((b) => b.id));
    for (const id of this.recentCollisions.keys()) {
      if (!activeBallIds.has(id)) {
        this.recentCollisions.delete(id);
      }
    }
  }

  /**
   * Add a player to the game
   */
  addPlayer(playerIndex: number): void {
    if (this.activePlayers.includes(playerIndex)) {
      return;
    }

    this.activePlayers.push(playerIndex);

    // Recreate all paddles with new player count
    this.destroyPaddles();
    this.createPaddles();
    this.drawArena();
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerIndex: number): void {
    const idx = this.activePlayers.indexOf(playerIndex);
    if (idx === -1) {
      return;
    }

    this.activePlayers.splice(idx, 1);

    // Recreate all paddles with new player count
    this.destroyPaddles();
    this.createPaddles();
    this.drawArena();
  }

  /**
   * Destroy all paddles
   */
  private destroyPaddles(): void {
    for (const paddle of this.paddles.values()) {
      paddle.destroy();
    }
    this.paddles.clear();
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return {
      score: this._score,
      combo: this._combo,
      ballsInPlay: this.ballCount,
      timeRemaining: 0, // Managed by Game scene
      isGameOver: !this._isRunning,
    };
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.stop();

    // Destroy all balls
    for (const ball of this.balls) {
      ball.destroy();
    }
    this.balls = [];

    // Destroy all paddles
    this.destroyPaddles();

    // Destroy graphics
    this.graphics.destroy();

    // Clear collision tracking
    this.recentCollisions.clear();
  }
}
