/**
 * Countdown Scene - 3-2-1-GO! before gameplay
 *
 * Shows arena with paddles, allows practice movement during countdown.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import {
  CANVAS,
  ARENA,
  GAME,
  PLAYER,
  DEPTH,
  PLAYER_KEYS,
  PLAYER_KEY_HINTS,
} from "../consts/GameConstants";
import GameArena from "../managers/GameArena";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";
import { polarToCartesian } from "../utils/CircularPhysics";

export default class Countdown extends Phaser.Scene {
  private backdrop?: AnimatedBackdrop;
  private gameArena?: GameArena;
  private players: number[] = [];
  private playerKeys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }[] = [];
  private countdownText?: Phaser.GameObjects.Text;
  private countdownValue: number = GAME.COUNTDOWN_SECONDS;
  private countdownTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKeys.Countdown);
  }

  init(data: { players: number[] }): void {
    this.players = data.players || [0, 1];
    console.log("Countdown init with players:", this.players);
  }

  create(): void {
    this.events.once("shutdown", this.shutdown, this);

    // Reset state
    this.countdownValue = GAME.COUNTDOWN_SECONDS;

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

    // Initialize game arena (creates paddles)
    this.gameArena = new GameArena(this, this.players);

    // Key hint labels outside the arena for each active player
    for (const playerIndex of this.players) {
      const angle = (playerIndex * 360) / PLAYER.MAX_PLAYERS;
      const pos = polarToCartesian(angle, ARENA.RADIUS + 80);
      this.add
        .text(pos.x, pos.y, PLAYER_KEY_HINTS[playerIndex] ?? `P${playerIndex + 1}`, {
          fontFamily: "MuseoSansBold, sans-serif",
          fontSize: "22px",
          color: "#444444",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI_ELEMENTS);
    }

    // Create countdown text
    this.createCountdownUI();

    // Start countdown
    this.startCountdown();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  /**
   * Create countdown UI
   */
  private createCountdownUI(): void {
    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Large countdown number
    this.countdownText = this.add
      .text(centerX, centerY, String(this.countdownValue), {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "240px",
        color: "#ffffff",
        shadow: {
          offsetX: 6,
          offsetY: 6,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS)
      .setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: this.countdownText,
      alpha: 1,
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: "Back.out",
    });

  }

  /**
   * Start the countdown sequence
   */
  private startCountdown(): void {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this.onCountdownTick,
      callbackScope: this,
      repeat: GAME.COUNTDOWN_SECONDS, // Will fire COUNTDOWN_SECONDS + 1 times
    });
  }

  /**
   * Handle countdown tick
   */
  private onCountdownTick(): void {
    this.countdownValue--;

    if (this.countdownValue > 0) {
      // Update number with animation
      this.updateCountdownDisplay(String(this.countdownValue));
    } else if (this.countdownValue === 0) {
      // Show "GO!" (smaller to fit within circle)
      this.updateCountdownDisplay("GO!", "#ffffff", "130px");

      // Wait a moment then start game
      this.time.delayedCall(500, () => {
        this.startGame();
      });
    }
  }

  /**
   * Update countdown display with animation
   */
  private updateCountdownDisplay(text: string, color?: string, fontSize?: string): void {
    if (!this.countdownText) return;

    // Pulse animation
    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 1.3, to: 1 },
      duration: 200,
      ease: "Back.out",
    });

    if (fontSize) {
      this.countdownText.setFontSize(fontSize);
    }
    this.countdownText.setText(text);
    if (color) {
      this.countdownText.setColor(color);
    }

    // Play sound effect here if desired
  }

  /**
   * Start the game
   */
  private startGame(): void {
    // Clean up arena before transitioning (Game scene will create its own)
    this.gameArena?.destroy();
    this.gameArena = undefined;

    // Transition to Game scene
    this.scene.start(SceneKeys.Game, { players: this.players });
  }

  update(_time: number, delta: number): void {
    // Allow paddle movement during countdown (practice)
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
  }

  shutdown(): void {
    this.tweens.killAll();

    // Remove all keys to prevent state bleeding between scenes
    this.input.keyboard?.removeAllKeys(true);
    this.playerKeys = [];

    this.countdownTimer?.remove();
    this.countdownTimer = undefined;

    this.gameArena?.destroy();
    this.gameArena = undefined;

    this.backdrop?.destroy();
    this.backdrop = undefined;

    this.countdownText?.destroy();
    this.countdownText = undefined;
  }
}
