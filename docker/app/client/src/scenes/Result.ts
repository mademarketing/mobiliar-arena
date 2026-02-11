/**
 * Result Scene - Team score display
 *
 * Shows final score, "Besser zusammen" message, and player count.
 * Includes enhanced confetti celebration and high score detection.
 * Auto-returns to Lobby after 10 seconds.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import { CANVAS, DEPTH, ANIMATION_DURATION, GAME, PLAYER } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

interface GameResult {
  score: number;
  playerCount: number;
  isTeamGame: boolean;
}

/**
 * Result Scene - Team score display
 *
 * Shows team score for arena game.
 * Auto-dismisses after configured time.
 */
export default class Result extends Phaser.Scene {
  private autoDismissTimer?: Phaser.Time.TimerEvent;
  private backdrop?: AnimatedBackdrop;
  private confettiEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Team game mode
  private gameResult?: GameResult;
  private highScore: number = 0;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: { score?: number; playerCount?: number; isTeamGame?: boolean }) {
    this.gameResult = {
      score: data.score ?? 0,
      playerCount: data.playerCount ?? 2,
      isTeamGame: true,
    };
  }

  create(): void {
    this.events.once("shutdown", this.shutdown, this);

    // Get high score from registry
    this.highScore = this.game.registry.get("highScore") || 0;

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Show team score display
    this.createTeamScoreDisplay(centerX, centerY);

    // Auto-dismiss timer
    this.autoDismissTimer = this.time.delayedCall(GAME.RESULT_DISPLAY_MS, () => {
      this.returnToLobby();
    });

    // Keyboard shortcut: Space to skip
    this.input.keyboard?.on("keydown-SPACE", this.returnToLobby, this);

    // Fade in
    this.cameras.main.fadeIn(ANIMATION_DURATION.FADE_IN, 0, 0, 0);
  }

  /**
   * Create team score display for arena game
   */
  private createTeamScoreDisplay(centerX: number, centerY: number): void {
    if (!this.gameResult) return;

    const isNewHighScore = this.gameResult.score > this.highScore;

    // Large score number with dramatic reveal
    const scoreText = this.add
      .text(centerX, centerY, "0", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "200px",
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
      .setScale(0.5);

    // Scale up score text dramatically
    this.tweens.add({
      targets: scoreText,
      scale: 1,
      duration: 400,
      ease: "Back.out",
      delay: 100,
    });

    // Animate score counting up
    this.animateScoreCount(scoreText, this.gameResult.score);

    // NEW HIGH SCORE banner if applicable
    if (isNewHighScore) {
      this.createHighScoreBanner(centerX, centerY);
      // Save new high score
      this.game.registry.set("highScore", this.gameResult.score);
    }

    // Enhanced celebration effect
    this.createConfetti(isNewHighScore);
    this.addCelebrationEffect(centerX, centerY);

  }

  /**
   * Create NEW HIGH SCORE banner
   */
  private createHighScoreBanner(centerX: number, _centerY: number): void {
    const banner = this.add
      .text(centerX, 180, "NEW HIGH SCORE!", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "42px",
        color: "#ffd700",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS + 10)
      .setScale(0)
      .setAlpha(0);

    // Dramatic entrance
    this.tweens.add({
      targets: banner,
      scale: 1.2,
      alpha: 1,
      duration: 300,
      ease: "Back.out",
      delay: 800,
      onComplete: () => {
        // Pulse effect
        this.tweens.add({
          targets: banner,
          scale: { from: 1.2, to: 1.0 },
          duration: 400,
          ease: "Sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // Camera flash for extra impact
    this.time.delayedCall(800, () => {
      this.cameras.main.flash(200, 255, 215, 0);
    });
  }

  /**
   * Create enhanced confetti particle effect
   */
  private createConfetti(isNewHighScore: boolean): void {
    if (!this.textures.exists("confetti")) return;

    const colors = [
      ...PLAYER.COLORS,
      0xffd700, // Gold
    ];

    const quantity = isNewHighScore ? 5 : 3;
    const frequency = isNewHighScore ? 30 : 50;

    this.confettiEmitter = this.add.particles(CANVAS.WIDTH / 2, -50, "confetti", {
      x: { min: -CANVAS.WIDTH / 2, max: CANVAS.WIDTH / 2 },
      speed: { min: 100, max: 300 },
      angle: { min: 80, max: 100 },
      rotate: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.3 },
      alpha: { start: 1, end: 0.6 },
      lifespan: 4000,
      gravityY: 200,
      tint: colors,
      quantity,
      frequency,
    });

    this.confettiEmitter.setDepth(DEPTH.PARTICLES);

    // Stop confetti after a while
    this.time.delayedCall(6000, () => {
      if (this.confettiEmitter) {
        this.confettiEmitter.stop();
      }
    });
  }

  /**
   * Animate score counting up from 0
   */
  private animateScoreCount(textObject: Phaser.GameObjects.Text, targetScore: number): void {
    const duration = Math.min(2000, targetScore * 10); // Cap at 2 seconds
    let currentScore = 0;

    this.tweens.addCounter({
      from: 0,
      to: targetScore,
      duration,
      ease: "Cubic.out",
      onUpdate: (tween) => {
        const value = tween.getValue();
        currentScore = Math.round(value ?? 0);
        textObject.setText(String(currentScore));
      },
    });
  }

  private addCelebrationEffect(_centerX: number, _centerY: number): void {
    // Simple particle-like effect using tweening circles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(100, CANVAS.WIDTH - 100);
      const startY = Phaser.Math.Between(-100, -50);
      const color = Phaser.Math.RND.pick([
        0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3,
      ]);

      const particle = this.add
        .circle(x, startY, Phaser.Math.Between(5, 20), color)
        .setAlpha(0.8)
        .setDepth(DEPTH.PARTICLES);

      this.tweens.add({
        targets: particle,
        y: CANVAS.HEIGHT + 100,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        ease: "Linear",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private returnToLobby = () => {
    this.scene.start(SceneKeys.Lobby);
  };

  shutdown(): void {
    this.autoDismissTimer?.remove();
    this.autoDismissTimer = undefined;
    this.input.keyboard?.off("keydown-SPACE", this.returnToLobby, this);
    this.backdrop?.destroy();
    this.backdrop = undefined;

    if (this.confettiEmitter) {
      this.confettiEmitter.stop();
      this.confettiEmitter.destroy();
      this.confettiEmitter = undefined;
    }
  }
}
