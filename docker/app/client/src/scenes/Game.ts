import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import { CANVAS, DEPTH } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

interface PrizeOutcome {
  isWin: boolean;
  prizeType?: string;
  displayName?: string;
  textureKey?: string;
  timestamp: string;
}

/**
 * Game Scene - Main gameplay scene
 *
 * This is the placeholder game scene. Implement your game mechanic here.
 *
 * The outcome (win/lose) is already determined by the server when this scene starts.
 * Your game should reveal the outcome in an entertaining way, then transition to Result.
 *
 * Example game mechanics:
 * - Prize wheel spin
 * - Scratch card reveal
 * - Memory game
 * - Slot machine
 * - Claw machine
 */
export default class Game extends Phaser.Scene {
  private outcome?: PrizeOutcome;
  private backdrop?: AnimatedBackdrop;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: { outcome: PrizeOutcome }) {
    this.outcome = data.outcome;
  }

  create() {
    this.events.once("shutdown", this.shutdown, this);

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Placeholder: Show "Game in progress" text
    this.add
      .text(centerX, centerY - 100, "Game Scene", {
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

    this.add
      .text(centerX, centerY + 50, "Implement your game mechanic here", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "36px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Show outcome hint (for development)
    const outcomeText = this.outcome?.isWin
      ? `Outcome: WIN (${this.outcome.prizeType || "unknown"})`
      : "Outcome: LOSE";

    this.add
      .text(centerX, centerY + 150, outcomeText, {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "24px",
        color: this.outcome?.isWin ? "#00ff00" : "#ff6666",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // TODO: Replace this auto-transition with your actual game logic
    // After your game animation/interaction completes, call transitionToResult()
    this.time.delayedCall(2000, () => {
      this.transitionToResult();
    });

    // Keyboard shortcut: Space to skip immediately
    this.input.keyboard?.on("keydown-SPACE", this.transitionToResult, this);
  }

  /**
   * Transition to the Result scene
   * Call this when your game mechanic has finished revealing the outcome
   */
  private transitionToResult = () => {
    this.scene.start(SceneKeys.Result, {
      isWin: this.outcome?.isWin ?? false,
      outcome: this.outcome,
    });
  };

  shutdown() {
    this.input.keyboard?.off("keydown-SPACE", this.transitionToResult, this);
    this.backdrop?.destroy();
    this.backdrop = undefined;
  }
}
