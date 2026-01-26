/**
 * Result Scene - Team score display
 *
 * Shows final score, "Besser zusammen" message, and player count.
 * Auto-returns to Lobby after 10 seconds.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import GamePlugin from "../plugins/GamePlugin";
import GameEvents from "../../../shared/GameEvents";
import { CANVAS, DEPTH, ANIMATION_DURATION, GAME } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

interface GameResult {
  score: number;
  playerCount: number;
  isTeamGame: boolean;
}

// Legacy interface for prize-based games
interface PrizeOutcome {
  isWin: boolean;
  prizeType?: string;
  prizeId?: string;
  displayName?: string;
  textureKey?: string;
  timestamp: string;
}

/**
 * Result Scene - Win/Lose display
 *
 * Shows either team score for arena game,
 * or prize result for legacy games.
 * Auto-dismisses after configured time.
 */
export default class Result extends Phaser.Scene {
  private gamePlugin?: GamePlugin;
  private autoDismissTimer?: Phaser.Time.TimerEvent;
  private backdrop?: AnimatedBackdrop;

  // Legacy prize mode
  private isWin = false;
  private outcome?: PrizeOutcome;

  // Team game mode
  private gameResult?: GameResult;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: { isWin?: boolean; outcome?: PrizeOutcome; score?: number; playerCount?: number; isTeamGame?: boolean }) {
    // Check if this is a team game result
    if (data.isTeamGame) {
      this.gameResult = {
        score: data.score ?? 0,
        playerCount: data.playerCount ?? 2,
        isTeamGame: true,
      };
      this.isWin = false;
      this.outcome = undefined;
    } else {
      // Legacy prize mode
      this.isWin = data.isWin ?? false;
      this.outcome = data.outcome;
      this.gameResult = undefined;
    }
  }

  create(): void {
    this.gamePlugin = this.plugins.get("GamePlugin") as GamePlugin;
    this.events.once("shutdown", this.shutdown, this);

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Show appropriate display based on game mode
    if (this.gameResult) {
      this.createTeamScoreDisplay(centerX, centerY);
    } else if (this.isWin) {
      this.createWinDisplay(centerX, centerY);
    } else {
      this.createLoseDisplay(centerX, centerY);
    }

    // Notify server (for legacy prize mode)
    if (!this.gameResult) {
      this.gamePlugin?.serverSocket.emit(GameEvents.ResultShown, {
        isWin: this.isWin,
        prizeType: this.outcome?.prizeType,
        prizeId: this.outcome?.prizeId,
        displayName: this.outcome?.displayName,
        timestamp: this.outcome?.timestamp || new Date().toISOString(),
      });
    }

    // Auto-dismiss timer
    const displayTime = this.gameResult ? GAME.RESULT_DISPLAY_MS : 6000;
    this.autoDismissTimer = this.time.delayedCall(displayTime, () => {
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

    // "Besser zusammen" tagline
    this.add
      .text(centerX, 100, "Besser zusammen", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "48px",
        color: "#4ecdc4",
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Team Score label
    this.add
      .text(centerX, centerY - 150, "TEAM SCORE", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "36px",
        color: "#888888",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Large score number
    const scoreText = this.add
      .text(centerX, centerY, String(this.gameResult.score), {
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
      .setDepth(DEPTH.UI_ELEMENTS);

    // Animate score counting up
    this.animateScoreCount(scoreText, this.gameResult.score);

    // Player count
    this.add
      .text(centerX, centerY + 180, `${this.gameResult.playerCount} Players`, {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "32px",
        color: "#888888",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Celebration effect
    this.addCelebrationEffect(centerX, centerY);

    // "Play again" hint
    this.add
      .text(centerX, CANVAS.HEIGHT - 80, "Press SPACE to play again", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "28px",
        color: "#666666",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);
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

  private createWinDisplay(centerX: number, centerY: number): void {
    // Congratulations text
    this.add
      .text(centerX, 150, "Congratulations!", {
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
      .setDepth(DEPTH.UI_ELEMENTS);

    // Prize name
    const prizeName = this.outcome?.displayName || "You won a prize!";

    this.add
      .text(centerX, centerY, prizeName, {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "72px",
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
      .setDepth(DEPTH.UI_ELEMENTS);

    // Add celebratory effect
    this.addCelebrationEffect(centerX, centerY);
  }

  private createLoseDisplay(centerX: number, centerY: number): void {
    // Logo
    this.add
      .image(centerX, centerY - 100, TextureKeys.Logo)
      .setOrigin(0.5)
      .setDepth(DEPTH.GAME_OBJECTS);

    // Consolation message
    this.add
      .text(centerX, centerY + 200, "Better luck next time!", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "72px",
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
      .setDepth(DEPTH.UI_ELEMENTS);
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
    // For legacy mode, emit animation complete
    if (!this.gameResult) {
      this.gamePlugin?.serverSocket.emit(GameEvents.AnimationComplete);
    }

    // Go to Lobby for team games, Idle for legacy
    if (this.gameResult) {
      this.scene.start(SceneKeys.Lobby);
    } else {
      this.scene.start(SceneKeys.Idle);
    }
  };

  shutdown(): void {
    this.autoDismissTimer?.remove();
    this.autoDismissTimer = undefined;
    this.input.keyboard?.off("keydown-SPACE", this.returnToLobby, this);
    this.backdrop?.destroy();
    this.backdrop = undefined;
  }
}
