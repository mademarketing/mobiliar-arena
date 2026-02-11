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
  PLAYER_KEYS,
} from "../consts/GameConstants";
import GameArena from "../managers/GameArena";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

export default class Game extends Phaser.Scene {
  private backdrop?: AnimatedBackdrop;
  private gameArena?: GameArena;
  private players: number[] = [];
  private playerKeys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }[] = [];

  // UI elements
  private timerText?: Phaser.GameObjects.Text;
  private timerTextFlipped?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private scoreTextFlipped?: Phaser.GameObjects.Text;
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

    // Setup input from shared key mapping
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.playerKeys = PLAYER_KEYS.map((mapping) => ({
        left: keyboard.addKey(mapping.left),
        right: keyboard.addKey(mapping.right),
      }));
    }

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

    // Timer at bottom
    this.timerText = this.add
      .text(centerX, 1080 - 60, this.formatTime(this.timeRemaining), {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "32px",
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

    // Timer flipped at top
    this.timerTextFlipped = this.add
      .text(centerX, 60, this.formatTime(this.timeRemaining), {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "32px",
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
      .setRotation(Math.PI)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Score at center (large)
    this.scoreText = this.add
      .text(centerX, CANVAS.HEIGHT / 2 + 80, "0", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "80px",
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

    // Score flipped 180° for opposite side
    this.scoreTextFlipped = this.add
      .text(centerX, CANVAS.HEIGHT / 2 - 80, "0", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "80px",
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
      .setRotation(Math.PI)
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

    // Update timer display (both orientations)
    const timeStr = this.formatTime(this.timeRemaining);
    this.timerText?.setText(timeStr);
    this.timerTextFlipped?.setText(timeStr);

    // Flash timer when low
    if (this.timeRemaining <= 10000 && this.timeRemaining > 0) {
      const color = this.timeRemaining % 1000 < 500 ? "#ff6b6b" : "#ffffff";
      this.timerText?.setColor(color);
      this.timerTextFlipped?.setColor(color);
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
    this.gameTimer?.remove();
    this.gameTimer = undefined;

    // Stop game arena
    this.gameArena?.stop();

    // Get final score
    const finalScore = this.gameArena?.score ?? 0;
    const playerCount = this.players.length;

    console.log(`Game Over! Score: ${finalScore}, Players: ${playerCount}`);

    // Transition to Result screen
    this.time.delayedCall(500, () => {
      this.scene.start(SceneKeys.Result, {
        score: finalScore,
        playerCount: playerCount,
        isTeamGame: true,
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    // Poll input for all active players
    for (let i = 0; i < this.players.length; i++) {
      const playerIndex = this.players[i];
      const keys = this.playerKeys[playerIndex];
      if (!keys) continue;

      if (keys.left.isDown) {
        this.gameArena?.movePaddle(playerIndex, -1, delta);
      } else if (keys.right.isDown) {
        this.gameArena?.movePaddle(playerIndex, 1, delta);
      }
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

    // Update score (both orientations)
    this.scoreText?.setText(String(state.score));
    this.scoreTextFlipped?.setText(String(state.score));

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
    this.playerKeys = [];

    // Stop timer
    this.gameTimer?.remove();
    this.gameTimer = undefined;

    // Clean up game arena
    this.gameArena?.destroy();
    this.gameArena = undefined;

    // Clean up UI
    this.backdrop?.destroy();
    this.backdrop = undefined;
    this.timerText?.destroy();
    this.timerText = undefined;
    this.timerTextFlipped?.destroy();
    this.timerTextFlipped = undefined;
    this.scoreText?.destroy();
    this.scoreText = undefined;
    this.scoreTextFlipped?.destroy();
    this.scoreTextFlipped = undefined;
    this.comboText?.destroy();
    this.comboText = undefined;
  }
}
