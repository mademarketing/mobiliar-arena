import Phaser from "phaser";
import TextureKeys from "../consts/TextureKeys";
import { DEPTH } from "../consts/GameConstants";

interface BuzzerHintConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  scale?: number;
  animationInterval?: number;
}

/**
 * BuzzerHint - Animated buzzer icon reminder
 *
 * Displays a continuously animating buzzer icon to remind users
 * they can press the buzzer. Used in IconGrid and Wheel scenes.
 */
export default class BuzzerHint {
  private scene: Phaser.Scene;
  private buzzerIcon?: Phaser.GameObjects.Image;
  private config: Required<BuzzerHintConfig>;
  private animationTimer?: Phaser.Time.TimerEvent;
  private finalY: number;

  constructor(config: BuzzerHintConfig) {
    this.scene = config.scene;
    this.config = {
      scene: config.scene,
      x: config.x,
      y: config.y,
      scale: config.scale ?? 0.5,
      animationInterval: config.animationInterval ?? 3000,
    };
    this.finalY = this.config.y;
  }

  create(): this {
    // Create buzzer icon
    this.buzzerIcon = this.scene.add
      .image(this.config.x, this.config.y, TextureKeys.BuzzerIcon)
      .setOrigin(0.5)
      .setScale(this.config.scale)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Start animation loop
    this.startAnimationLoop();

    return this;
  }

  private startAnimationLoop(): void {
    // Animate immediately, then repeat on interval
    this.animateBuzzerPress();

    this.animationTimer = this.scene.time.addEvent({
      delay: this.config.animationInterval,
      callback: () => this.animateBuzzerPress(),
      loop: true,
    });
  }

  private animateBuzzerPress(): void {
    if (!this.buzzerIcon) return;

    const pressDuration = 200;
    const pressOffset = 15 * this.config.scale;
    const pressScaleX = 0.9 * this.config.scale;
    const pressScaleY = 0.85 * this.config.scale;

    // Press down
    this.scene.tweens.add({
      targets: this.buzzerIcon,
      scaleX: pressScaleX,
      scaleY: pressScaleY,
      y: this.finalY + pressOffset,
      duration: pressDuration,
      ease: "Quad.easeIn",
      onComplete: () => {
        // Spring back up
        this.scene.tweens.add({
          targets: this.buzzerIcon,
          scaleX: this.config.scale,
          scaleY: this.config.scale,
          y: this.finalY,
          duration: pressDuration,
          ease: "Back.easeOut",
        });
      },
    });
  }

  /**
   * Fade out the buzzer hint with alpha animation
   * @param duration - Duration of fade in ms (default 500)
   */
  fadeOut(duration = 500): void {
    // Stop animation timer immediately
    if (this.animationTimer) {
      this.animationTimer.remove();
      this.animationTimer = undefined;
    }

    if (!this.buzzerIcon) return;

    // Fade out
    this.scene.tweens.add({
      targets: this.buzzerIcon,
      alpha: 0,
      duration,
      ease: "Sine.easeOut",
    });
  }

  destroy(): void {
    // Stop animation timer
    if (this.animationTimer) {
      this.animationTimer.remove();
      this.animationTimer = undefined;
    }

    // Destroy buzzer icon
    if (this.buzzerIcon) {
      this.buzzerIcon.destroy();
      this.buzzerIcon = undefined;
    }
  }
}
