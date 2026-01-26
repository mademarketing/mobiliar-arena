import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import GamePlugin from "../plugins/GamePlugin";
import GameEvents from "../../../shared/GameEvents";
import { CANVAS, DEPTH, ANIMATION_DURATION } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

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
 * Shows either a win celebration with prize info,
 * or a consolation message for losing.
 * Auto-dismisses after 6 seconds.
 */
export default class Result extends Phaser.Scene {
  private gamePlugin?: GamePlugin;
  private isWin = false;
  private outcome?: PrizeOutcome;
  private autoDismissTimer?: Phaser.Time.TimerEvent;
  private backdrop?: AnimatedBackdrop;

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: { isWin: boolean; outcome?: PrizeOutcome }) {
    this.isWin = data.isWin;
    this.outcome = data.outcome;
  }

  create() {
    this.gamePlugin = this.plugins.get("GamePlugin") as GamePlugin;
    this.events.once("shutdown", this.shutdown, this);

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    if (this.isWin) {
      this.createWinDisplay(centerX, centerY);
    } else {
      this.createLoseDisplay(centerX, centerY);
    }

    // Notify server to trigger receipt print
    this.gamePlugin?.serverSocket.emit(GameEvents.ResultShown, {
      isWin: this.isWin,
      prizeType: this.outcome?.prizeType,
      prizeId: this.outcome?.prizeId,
      displayName: this.outcome?.displayName,
      timestamp: this.outcome?.timestamp || new Date().toISOString(),
    });

    // Auto-dismiss after 6 seconds
    this.autoDismissTimer = this.time.delayedCall(6000, () => {
      this.returnToIdle();
    });

    // Keyboard shortcut: Space to skip to Idle immediately
    this.input.keyboard?.on("keydown-SPACE", this.returnToIdle, this);

    // Fade in
    this.cameras.main.fadeIn(ANIMATION_DURATION.FADE_IN, 0, 0, 0);
  }

  private createWinDisplay(centerX: number, centerY: number) {
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

  private createLoseDisplay(centerX: number, centerY: number) {
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

  private addCelebrationEffect(_centerX: number, _centerY: number) {
    // Simple particle-like effect using tweening circles
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(100, CANVAS.WIDTH - 100);
      const startY = Phaser.Math.Between(-100, -50);
      const color = Phaser.Math.RND.pick([
        0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d,
      ]);

      const particle = this.add
        .circle(x, startY, Phaser.Math.Between(5, 15), color)
        .setAlpha(0.8)
        .setDepth(DEPTH.PARTICLES);

      this.tweens.add({
        targets: particle,
        y: CANVAS.HEIGHT + 100,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
        ease: "Linear",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private returnToIdle = () => {
    this.gamePlugin?.serverSocket.emit(GameEvents.AnimationComplete);
    this.scene.start(SceneKeys.Idle);
  };

  shutdown() {
    if (this.autoDismissTimer) {
      this.autoDismissTimer.remove();
    }
    this.input.keyboard?.off("keydown-SPACE", this.returnToIdle, this);
    this.backdrop?.destroy();
    this.backdrop = undefined;
  }
}
