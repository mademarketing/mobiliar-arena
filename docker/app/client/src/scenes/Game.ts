/**
 * Game Scene - Main circular Pong gameplay
 *
 * 60-second cooperative game where players work together to keep balls in play.
 *
 * Dev keys:
 * - Space: Spawn extra ball
 * - Escape: End game early
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import {
  CANVAS,
  GAME,
  DEPTH,
} from "../consts/GameConstants";
import GameArena from "../managers/GameArena";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

// Input keys - declared outside class like Phaser tutorial
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let player2Left: Phaser.Input.Keyboard.Key;
let player2Right: Phaser.Input.Keyboard.Key;

export default class Game extends Phaser.Scene {
  private backdrop?: AnimatedBackdrop;
  private gameArena?: GameArena;
  private players: number[] = [];

  // UI elements
  private timerText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;

  // Game state
  private gameTimer?: Phaser.Time.TimerEvent;
  private timeRemaining: number = GAME.DURATION_MS;
  private isGameOver: boolean = false;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: { players: number[] }): void {
    this.players = data.players || [0, 1];
    console.log("Game init with players:", this.players);
  }

  create(): void {
    this.events.once("shutdown", this.shutdown, this);

    // Reset state
    this.timeRemaining = GAME.DURATION_MS;
    this.isGameOver = false;

    // Setup input - exactly like Phaser tutorial
    cursors = this.input.keyboard.createCursorKeys();
    player2Left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    player2Right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    // Initialize game arena
    this.gameArena = new GameArena(this, this.players);

    // Create UI
    this.createUI();

    // Setup dev keys
    this.setupDevKeys();

    // Start game
    this.startGame();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  /**
   * Create game UI
   */
  private createUI(): void {
    const centerX = CANVAS.WIDTH / 2;

    // Timer at top center
    this.timerText = this.add
      .text(centerX, 50, this.formatTime(this.timeRemaining), {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Score at center (large)
    this.scoreText = this.add
      .text(centerX, CANVAS.HEIGHT / 2, "0", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "120px",
        color: "#ffffff",
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS)
      .setAlpha(0.8);

    // Combo indicator below score
    this.comboText = this.add
      .text(centerX, CANVAS.HEIGHT / 2 + 80, "", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "36px",
        color: "#4ecdc4",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Player count indicator
    this.add
      .text(50, 50, `${this.players.length} Players`, {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "24px",
        color: "#888888",
      })
      .setDepth(DEPTH.UI_ELEMENTS);
  }

  /**
   * Setup development keyboard shortcuts
   */
  private setupDevKeys(): void {
    // Space: Spawn extra ball
    this.input.keyboard?.on("keydown-SPACE", this.handleSpawnBall, this);

    // Escape: End game early
    this.input.keyboard?.on("keydown-ESC", this.handleEndGame, this);
  }

  /**
   * Start the game
   */
  private startGame(): void {
    // Start the game arena
    this.gameArena?.start();

    // Start countdown timer
    this.gameTimer = this.time.addEvent({
      delay: 100, // Update every 100ms for smooth countdown
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Handle timer tick
   */
  private onTimerTick(): void {
    this.timeRemaining -= 100;

    // Update timer display
    this.timerText?.setText(this.formatTime(this.timeRemaining));

    // Flash timer when low
    if (this.timeRemaining <= 10000 && this.timeRemaining > 0) {
      this.timerText?.setColor(
        this.timeRemaining % 1000 < 500 ? "#ff6b6b" : "#ffffff"
      );
    }

    // Check for game end
    if (this.timeRemaining <= 0) {
      this.endGame();
    }
  }

  /**
   * Format milliseconds as MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Handle spawn ball dev key
   */
  private handleSpawnBall = (): void => {
    if (!this.isGameOver) {
      this.gameArena?.spawnBall();
    }
  };

  /**
   * Handle end game dev key
   */
  private handleEndGame = (): void => {
    this.endGame();
  };

  /**
   * End the game
   */
  private endGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop timer
    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = undefined;
    }

    // Stop game arena
    this.gameArena?.stop();

    // Get final score
    const finalScore = this.gameArena?.score ?? 0;
    const playerCount = this.players.length;

    console.log(`Game Over! Score: ${finalScore}, Players: ${playerCount}`);

    // Transition to Result scene
    this.time.delayedCall(500, () => {
      this.scene.start(SceneKeys.Result, {
        score: finalScore,
        playerCount,
        isTeamGame: true,
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    // Poll input and update - exactly like Phaser tutorial pattern
    // Player 1: Arrow keys
    if (cursors.left.isDown) {
      this.gameArena?.movePaddle(0, -1, delta);
    } else if (cursors.right.isDown) {
      this.gameArena?.movePaddle(0, 1, delta);
    }

    // Player 2: A/D keys
    if (player2Left.isDown) {
      this.gameArena?.movePaddle(1, -1, delta);
    } else if (player2Right.isDown) {
      this.gameArena?.movePaddle(1, 1, delta);
    }

    // Update game logic (balls, collisions, etc)
    this.gameArena?.update(delta);

    // Update UI
    this.updateUI();
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const state = this.gameArena?.getState();
    if (!state) return;

    // Update score
    this.scoreText?.setText(String(state.score));

    // Update combo
    if (state.combo > 1) {
      this.comboText?.setText(`${state.combo}x COMBO!`);
      this.comboText?.setAlpha(1);
    } else {
      this.comboText?.setAlpha(0);
    }
  }

  shutdown(): void {
    this.tweens.killAll();

    // Remove keyboard listeners
    this.input.keyboard?.off("keydown-SPACE", this.handleSpawnBall, this);
    this.input.keyboard?.off("keydown-ESC", this.handleEndGame, this);

    // Remove all keys to prevent state bleeding between scenes
    this.input.keyboard?.removeAllKeys(true);

    // Stop timer
    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = undefined;
    }

    // Clean up game arena
    this.gameArena?.destroy();
    this.gameArena = undefined;

    // Clean up UI
    this.backdrop?.destroy();
    this.backdrop = undefined;
    this.timerText?.destroy();
    this.timerText = undefined;
    this.scoreText?.destroy();
    this.scoreText = undefined;
    this.comboText?.destroy();
    this.comboText = undefined;
  }
}
