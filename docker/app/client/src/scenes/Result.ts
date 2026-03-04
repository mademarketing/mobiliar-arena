/**
 * Result Scene - Team score display
 *
 * Shows final score with emotions video backdrop, confetti celebration,
 * and high score detection. Auto-returns to Lobby after configured time.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import { CANVAS, ARENA, DEPTH, GAME, PLAYER } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";
import InfoPanel from "../utils/InfoPanel";
import ThemeManager from "../managers/ThemeManager";
import { t } from "../utils/translations";

interface GameStats {
  maxBallsInPlay: number;
  longestRally: number;
  fireBallCount: number;
}

interface GameResult {
  score: number;
  playerCount: number;
  isTeamGame: boolean;
  stats: GameStats;
}

// Bonus point values
const BONUS = {
  PER_MAX_BALL: 20,       // 20 pts per max concurrent ball
  PER_RALLY_HIT: 5,       // 5 pts per hit in longest rally
  PER_FIRE_BALL: 50,      // 50 pts per ball that caught fire
} as const;

export default class Result extends Phaser.Scene {
  private autoDismissTimer?: Phaser.Time.TimerEvent;
  private backdrop?: AnimatedBackdrop;
  private infoPanel?: InfoPanel;
  private emotionsVideo?: Phaser.GameObjects.Video;
  private confettiEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private circleMask?: Phaser.Display.Masks.GeometryMask;

  // Team game mode
  private gameResult?: GameResult;
  private highScore: number = 0;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: { score?: number; playerCount?: number; isTeamGame?: boolean; stats?: GameStats }) {
    this.gameResult = {
      score: data.score ?? 0,
      playerCount: data.playerCount ?? 2,
      isTeamGame: true,
      stats: data.stats ?? { maxBallsInPlay: 0, longestRally: 0, fireBallCount: 0 },
    };
  }

  create(): void {
    this.events.once("shutdown", this.shutdown, this);

    // Get high score from registry
    this.highScore = this.game.registry.get("highScore") || 0;

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    // Info panel (left side)
    this.infoPanel = new InfoPanel(this);

    const centerX = ARENA.CENTER_X;
    const centerY = ARENA.CENTER_Y;

    // Create circular mask for video, confetti, and effects
    const maskGraphics = this.make.graphics({}, false);
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillCircle(centerX, centerY, ARENA.RADIUS);
    this.circleMask = maskGraphics.createGeometryMask();

    // Play emotions video as backdrop over the arena
    this.createEmotionsVideo(centerX, centerY);

    // Show team score display (overlaid on video)
    this.createTeamScoreDisplay(centerX, centerY);

    // Auto-dismiss timer
    this.autoDismissTimer = this.time.delayedCall(GAME.RESULT_DISPLAY_MS, () => {
      this.returnToLobby();
    });

    // Keyboard shortcut: Space to skip
    this.input.keyboard?.on("keydown-SPACE", this.returnToLobby, this);
  }

  /**
   * Create and play emotions video with circular mask over the arena
   */
  private createEmotionsVideo(centerX: number, centerY: number): void {
    const themeManager = ThemeManager.getInstance();
    const videoKey = themeManager.getEmotionsVideoKey();

    if (!this.cache.video.has(videoKey)) return;

    this.emotionsVideo = this.add.video(centerX, centerY, videoKey);
    this.emotionsVideo.setDepth(DEPTH.ARENA + 2);

    // Apply circular mask
    if (this.circleMask) {
      this.emotionsVideo.setMask(this.circleMask);
    }

    // Scale video to cover arena once it starts playing
    const videoSize = ARENA.RADIUS * 2 + 40;
    this.emotionsVideo.once("playing", () => {
      if (!this.emotionsVideo) return;
      const scaleW = videoSize / this.emotionsVideo.width;
      const scaleH = videoSize / this.emotionsVideo.height;
      this.emotionsVideo.setScale(Math.max(scaleW, scaleH));
    });

    // Fade in the video
    this.emotionsVideo.setAlpha(0);
    this.tweens.add({
      targets: this.emotionsVideo,
      alpha: 0.7,
      duration: 800,
      ease: "Sine.out",
    });

    this.emotionsVideo.play(false);

    // Fade out when video ends
    this.emotionsVideo.on("complete", () => {
      if (this.emotionsVideo) {
        this.tweens.add({
          targets: this.emotionsVideo,
          alpha: 0,
          duration: 1500,
          ease: "Sine.in",
          onComplete: () => {
            this.emotionsVideo?.stop();
          },
        });
      }
    });
  }

  /**
   * Create team score display for arena game
   */
  private createTeamScoreDisplay(centerX: number, centerY: number): void {
    if (!this.gameResult) return;

    const { stats } = this.gameResult;

    // Calculate bonus points
    const bonusMaxBalls = stats.maxBallsInPlay * BONUS.PER_MAX_BALL;
    const bonusRally = stats.longestRally * BONUS.PER_RALLY_HIT;
    const bonusFire = stats.fireBallCount * BONUS.PER_FIRE_BALL;
    const totalBonus = bonusMaxBalls + bonusRally + bonusFire;
    const totalScore = this.gameResult.score + totalBonus;

    // Update the score with bonus included
    this.gameResult.score = totalScore;

    const isNewHighScore = totalScore > this.highScore;

    // Large score number with dramatic reveal
    const scoreText = this.add
      .text(centerX, centerY - 40, "0", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "180px",
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

    // Animate score counting up (base score first, then add bonuses)
    this.animateScoreCount(scoreText, this.gameResult.score - totalBonus);

    // Show bonus breakdown after base score finishes counting
    const bonusDelay = Math.min(2000, (this.gameResult.score - totalBonus) * 10) + 500;
    this.time.delayedCall(bonusDelay, () => {
      this.showBonusBreakdown(centerX, centerY, scoreText, totalScore, stats, bonusMaxBalls, bonusRally, bonusFire);
    });

    // NEW HIGH SCORE banner if applicable
    if (isNewHighScore) {
      // Delay high score banner until after bonuses are shown
      this.time.delayedCall(bonusDelay + 2500, () => {
        this.createHighScoreBanner(centerX, centerY);
      });
      // Save new high score locally and to server, update panel
      this.game.registry.set("highScore", totalScore);
      this.infoPanel?.updateHighScore();
      this.saveHighScoreToServer(totalScore);
    }

    // Enhanced celebration effect
    this.createConfetti(isNewHighScore);
    this.addCelebrationEffect(centerX, centerY);
  }

  /**
   * Show bonus point breakdown with animated additions
   */
  private showBonusBreakdown(
    centerX: number,
    centerY: number,
    scoreText: Phaser.GameObjects.Text,
    totalScore: number,
    stats: GameStats,
    bonusMaxBalls: number,
    bonusRally: number,
    bonusFire: number,
  ): void {
    const bonusLines: { label: string; value: number; type: "balls" | "rally" | "fire" }[] = [];

    if (bonusMaxBalls > 0) {
      bonusLines.push({ label: t("result.maxBalls", { n: stats.maxBallsInPlay }), value: bonusMaxBalls, type: "balls" });
    }
    if (bonusRally > 0) {
      bonusLines.push({ label: t("result.longestRally", { n: stats.longestRally }), value: bonusRally, type: "rally" });
    }
    if (bonusFire > 0) {
      bonusLines.push({ label: t("result.onFire", { n: stats.fireBallCount }), value: bonusFire, type: "fire" });
    }

    if (bonusLines.length === 0) return;

    let runningScore = totalScore - bonusMaxBalls - bonusRally - bonusFire;
    const lineHeight = 59;
    const panelPadding = 16;
    const iconWidth = 60;
    const panelHeight = bonusLines.length * lineHeight + panelPadding * 2 - 5;
    const panelWidth = 480;
    const startY = centerY + 130;
    const panelCenterX = centerX + 10;
    const panelLeft = panelCenterX - panelWidth / 2;

    // White background panel behind bonus lines
    const panelBg = this.add.rectangle(
      panelCenterX, startY + (bonusLines.length - 1) * lineHeight / 2,
      panelWidth, panelHeight, 0xffffff, 0.85
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS - 1)
      .setStrokeStyle(2, 0xe0e0e0)
      .setAlpha(0);

    this.tweens.add({
      targets: panelBg,
      alpha: 1,
      duration: 300,
    });

    bonusLines.forEach((line, i) => {
      const delay = i * 600;
      const y = startY + i * lineHeight;

      this.time.delayedCall(delay, () => {
        // Icon (left side of panel)
        const iconElements = this.createBonusIcon(line.type, panelLeft + 14, y);
        for (const el of iconElements) {
          el.setAlpha(0);
          this.tweens.add({
            targets: el,
            alpha: el.getData("targetAlpha") ?? 1,
            y: el.y - 5,
            duration: 300,
            ease: "Back.out",
          });
        }

        // Label (after icon)
        const labelText = this.add
          .text(panelLeft + iconWidth + 20, y, line.label, {
            fontFamily: "MuseoSansBold, sans-serif",
            fontSize: "26px",
            color: "#333333",
          })
          .setOrigin(0, 0.5)
          .setDepth(DEPTH.UI_ELEMENTS)
          .setAlpha(0);

        // Points value (right-aligned, red)
        const pointsText = this.add
          .text(panelCenterX + panelWidth / 2 - 24, y, `+${line.value}`, {
            fontFamily: "MuseoSansBold, sans-serif",
            fontSize: "26px",
            color: "#da2323",
          })
          .setOrigin(1, 0.5)
          .setDepth(DEPTH.UI_ELEMENTS)
          .setAlpha(0);

        for (const el of [labelText, pointsText]) {
          this.tweens.add({
            targets: el,
            alpha: 1,
            y: y - 5,
            duration: 300,
            ease: "Back.out",
          });
        }

        // Animate score counting up to include this bonus
        runningScore += line.value;
        const newScore = runningScore;
        this.tweens.addCounter({
          from: newScore - line.value,
          to: newScore,
          duration: 400,
          ease: "Cubic.out",
          onUpdate: (tween) => {
            scoreText.setText(String(Math.round(tween.getValue() ?? 0)));
          },
        });
      });
    });
  }

  /**
   * Create bonus icon based on type using the ball texture
   */
  private createBonusIcon(type: "balls" | "rally" | "fire", x: number, y: number): (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[] {
    const themeManager = ThemeManager.getInstance();
    const ballKey = themeManager.getBallKey();
    const iconSize = 13; // 30% smaller than 18
    const elements: (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[] = [];

    if (!this.textures.exists(ballKey)) return elements;

    const texture = this.textures.get(ballKey);
    const frame = texture.get();
    const ballScale = (iconSize * 2) / Math.max(frame.width, frame.height);

    if (type === "balls") {
      // Three balls in a triangle: 2 on bottom, 1 on top
      const cx = x + 24;
      const spacing = 14;
      // Top ball
      const top = this.add.image(cx, y - spacing * 0.5, ballKey)
        .setScale(ballScale).setDepth(DEPTH.UI_ELEMENTS).setOrigin(0.5);
      // Bottom-left
      const bl = this.add.image(cx - spacing * 0.55, y + spacing * 0.5, ballKey)
        .setScale(ballScale).setDepth(DEPTH.UI_ELEMENTS).setOrigin(0.5);
      // Bottom-right
      const br = this.add.image(cx + spacing * 0.55, y + spacing * 0.5, ballKey)
        .setScale(ballScale).setDepth(DEPTH.UI_ELEMENTS).setOrigin(0.5);
      elements.push(top, bl, br);
    } else if (type === "rally") {
      // Ball with motion trail extending to the left
      const trailGraphics = this.add.graphics()
        .setDepth(DEPTH.UI_ELEMENTS - 1);
      const ballCenterX = x + 38;
      // Draw 4 fading trail circles going left
      for (let i = 4; i >= 1; i--) {
        const progress = i / 5;
        const trailAlpha = 0.35 * (1 - progress);
        const trailRadius = iconSize * (1 - progress * 0.4);
        trailGraphics.fillStyle(0x888888, trailAlpha);
        trailGraphics.fillCircle(ballCenterX - i * 10, y, trailRadius);
      }
      trailGraphics.setData("targetAlpha", 1);
      elements.push(trailGraphics);

      const ball = this.add.image(ballCenterX, y, ballKey)
        .setScale(ballScale).setDepth(DEPTH.UI_ELEMENTS).setOrigin(0.5);
      elements.push(ball);
    } else if (type === "fire") {
      // Ball with orange glow
      const glowGraphics = this.add.graphics()
        .setDepth(DEPTH.UI_ELEMENTS - 1);
      const ballCenterX = x + 24;
      glowGraphics.fillStyle(0xff6600, 0.3);
      glowGraphics.fillCircle(ballCenterX, y, iconSize * 1.8);
      glowGraphics.fillStyle(0xff4500, 0.15);
      glowGraphics.fillCircle(ballCenterX, y, iconSize * 2.5);
      glowGraphics.setData("targetAlpha", 1);
      elements.push(glowGraphics);

      const ball = this.add.image(ballCenterX, y, ballKey)
        .setScale(ballScale).setDepth(DEPTH.UI_ELEMENTS).setOrigin(0.5);
      elements.push(ball);
    }

    return elements;
  }

  /**
   * Create NEW HIGH SCORE banner
   */
  private createHighScoreBanner(centerX: number, _centerY: number): void {
    const banner = this.add
      .text(centerX, 180, t("result.newHighScore"), {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "42px",
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

    this.confettiEmitter = this.add.particles(ARENA.CENTER_X, -50, "confetti", {
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
    if (this.circleMask) {
      this.confettiEmitter.setMask(this.circleMask);
    }

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
      if (this.circleMask) {
        particle.setMask(this.circleMask);
      }

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

  private saveHighScoreToServer(score: number): void {
    fetch("/api/highscore", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highScore: score }),
    }).catch((err) => console.error("Failed to save high score:", err));
  }

  private returnToLobby = () => {
    this.scene.start(SceneKeys.Lobby);
  };

  shutdown(): void {
    this.autoDismissTimer?.remove();
    this.autoDismissTimer = undefined;
    this.input.keyboard?.off("keydown-SPACE", this.returnToLobby, this);
    this.infoPanel?.destroy();
    this.infoPanel = undefined;
    this.backdrop?.destroy();
    this.backdrop = undefined;

    if (this.emotionsVideo) {
      this.emotionsVideo.stop();
      this.emotionsVideo.destroy();
      this.emotionsVideo = undefined;
    }

    if (this.confettiEmitter) {
      this.confettiEmitter.stop();
      this.confettiEmitter.destroy();
      this.confettiEmitter = undefined;
    }
  }
}
