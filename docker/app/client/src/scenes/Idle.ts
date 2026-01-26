import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import GamePlugin from "../plugins/GamePlugin";
import GameEvents from "../../../shared/GameEvents";
import { CANVAS, DEPTH, ANIMATION_DURATION } from "../consts/GameConstants";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";
import PauseOverlay from "../utils/PauseOverlay";

interface PrizeOutcome {
  isWin: boolean;
  prizeType?: string;
  displayName?: string;
  textureKey?: string;
  timestamp: string;
}

/**
 * Idle Scene - Attract screen
 *
 * Displays game branding and waits for buzzer press.
 * On buzzer: requests prize from server, then transitions to Game scene.
 *
 * Test shortcuts:
 * - Space: Normal buzzer press (server determines outcome)
 * - 1: Force win
 * - 2: Force lose
 */
export default class Idle extends Phaser.Scene {
  private gamePlugin?: GamePlugin;
  private lastBuzzerTime = 0;
  private isTransitioning = false;
  private backdrop?: AnimatedBackdrop;
  private pauseOverlay?: PauseOverlay;
  private isPaused = false;

  // UI elements
  private logo?: Phaser.GameObjects.Image;
  private instructionText?: Phaser.GameObjects.Text;
  private buzzerIcon?: Phaser.GameObjects.Image;

  constructor() {
    super(SceneKeys.Idle);
  }

  create() {
    this.tweens.killAll();
    this.isTransitioning = false;
    this.lastBuzzerTime = 0;
    this.isPaused = false;

    // Get GamePlugin
    this.gamePlugin = this.plugins.get("GamePlugin") as GamePlugin;
    this.events.once("shutdown", this.shutdown, this);

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    // Pause overlay (created but hidden)
    this.pauseOverlay = new PauseOverlay(this);

    // Listen for pause/resume events
    this.gamePlugin?.events.on(
      GameEvents.GamePaused,
      this.handleGamePaused,
      this
    );
    this.gamePlugin?.events.on(
      GameEvents.GameResumed,
      this.handleGameResumed,
      this
    );

    // Check if game is already paused
    if (this.gamePlugin?.isPaused) {
      this.isPaused = true;
      this.pauseOverlay?.show();
    }

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Logo
    this.logo = this.add
      .image(centerX, centerY - 150, TextureKeys.Logo)
      .setOrigin(0.5)
      .setScale(0.8)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Instruction text
    this.instructionText = this.add
      .text(centerX, centerY + 200, "Press buzzer to play!", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "60px",
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

    // Buzzer icon
    this.buzzerIcon = this.add
      .image(centerX, centerY + 400, TextureKeys.BuzzerIcon)
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS)
      .setScale(0.8);

    // Pulse animation on buzzer icon
    this.tweens.add({
      targets: this.buzzerIcon,
      scale: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Listen for buzzer events
    this.gamePlugin?.events.on(
      GameEvents.BuzzerPress,
      this.handleBuzzerPress,
      this
    );

    // Keyboard support
    this.input.keyboard?.on("keydown-SPACE", this.handleBuzzerPress, this);

    // Test shortcuts: 1 = force win, 2 = force lose
    this.input.keyboard?.on("keydown-ONE", this.handleForceWin, this);
    this.input.keyboard?.on("keydown-TWO", this.handleForceLose, this);

    // Fade in
    this.cameras.main.fadeIn(ANIMATION_DURATION.FADE_IN, 0, 0, 0);
  }

  private handleGamePaused = () => {
    this.isPaused = true;
    this.pauseOverlay?.show();
  };

  private handleGameResumed = () => {
    this.isPaused = false;
    this.pauseOverlay?.hide();
  };

  private handleBuzzerPress = () => {
    if (this.isPaused) return;

    // Debounce
    const now = Date.now();
    if (now - this.lastBuzzerTime < 500 || this.isTransitioning) {
      return;
    }
    this.lastBuzzerTime = now;
    this.isTransitioning = true;

    console.log("Buzzer pressed - requesting prize");

    let callbackReceived = false;

    // Timeout fallback
    const timeoutTimer = this.time.delayedCall(5000, () => {
      if (!callbackReceived) {
        console.warn("Server callback timeout - resetting transition state");
        this.isTransitioning = false;
        this.showConnectionError();
      }
    });

    // Request prize from server
    this.gamePlugin?.serverSocket.emit(
      GameEvents.RequestPrize,
      (outcome: PrizeOutcome) => {
        callbackReceived = true;
        timeoutTimer.remove();
        console.log("Prize outcome received:", outcome);
        this.scene.start(SceneKeys.Game, { outcome });
      }
    );
  };

  private showConnectionError() {
    const errorText = this.add
      .text(
        CANVAS.WIDTH / 2,
        CANVAS.HEIGHT - 100,
        "Connection error - please try again",
        {
          fontFamily: "MuseoSansBold, sans-serif",
          fontSize: "24px",
          color: "#ff6b6b",
        }
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: errorText,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 2000,
      onComplete: () => errorText.destroy(),
    });
  }

  /** Test shortcut: Press 1 to force a win */
  private handleForceWin = () => {
    if (this.isPaused || this.isTransitioning) return;
    this.isTransitioning = true;

    const mockOutcome: PrizeOutcome = {
      isWin: true,
      prizeType: "prize-a",
      displayName: "Test Prize",
      timestamp: new Date().toISOString(),
    };

    console.log("[TEST] Force WIN - bypassing server", mockOutcome);
    this.scene.start(SceneKeys.Game, { outcome: mockOutcome });
  };

  /** Test shortcut: Press 2 to force a lose */
  private handleForceLose = () => {
    if (this.isPaused || this.isTransitioning) return;
    this.isTransitioning = true;

    const mockOutcome: PrizeOutcome = {
      isWin: false,
      timestamp: new Date().toISOString(),
    };

    console.log("[TEST] Force LOSE - bypassing server", mockOutcome);
    this.scene.start(SceneKeys.Game, { outcome: mockOutcome });
  };

  shutdown() {
    this.tweens.killAll();

    if (this.gamePlugin) {
      this.gamePlugin.events.off(
        GameEvents.BuzzerPress,
        this.handleBuzzerPress,
        this
      );
      this.gamePlugin.events.off(
        GameEvents.GamePaused,
        this.handleGamePaused,
        this
      );
      this.gamePlugin.events.off(
        GameEvents.GameResumed,
        this.handleGameResumed,
        this
      );
    }
    this.input.keyboard?.off("keydown-SPACE", this.handleBuzzerPress, this);
    this.input.keyboard?.off("keydown-ONE", this.handleForceWin, this);
    this.input.keyboard?.off("keydown-TWO", this.handleForceLose, this);

    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
    this.backdrop?.destroy();
    this.backdrop = undefined;
    this.logo = undefined;
    this.instructionText = undefined;
    this.buzzerIcon = undefined;
  }
}
