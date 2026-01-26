import Phaser from "phaser";

export interface CountdownTimerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius?: number;
  duration?: number;
  onComplete: () => void;
}

/**
 * Visual countdown timer using a depleting pie chart.
 * Colors change from blue → orange → red as time runs out.
 */
export class CountdownTimer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private tween?: Phaser.Tweens.Tween;
  private x: number;
  private y: number;
  private radius: number;
  private duration: number;
  private onComplete: () => void;
  private completed = false;

  constructor(config: CountdownTimerConfig) {
    this.scene = config.scene;
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius ?? 40;
    this.duration = config.duration ?? 10000;
    this.onComplete = config.onComplete;

    this.graphics = this.scene.add.graphics();
    this.drawFull();
  }

  /** Draw full pie (initial state) */
  private drawFull(): void {
    this.graphics.clear();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.slice(
      this.x,
      this.y,
      this.radius,
      Phaser.Math.DegToRad(270),
      Phaser.Math.DegToRad(630),
      false
    );
    this.graphics.fillPath();
  }

  /** Start the countdown */
  start(): void {
    this.completed = false;

    this.tween = this.scene.tweens.addCounter({
      from: 270,
      to: 630,
      duration: this.duration,
      onUpdate: (tween) => {
        if (this.completed) return;

        const value = tween.getValue() ?? 270;
        const progress = (value - 270) / 360;

        this.graphics.clear();
        this.graphics.slice(
          this.x,
          this.y,
          this.radius,
          Phaser.Math.DegToRad(value),
          Phaser.Math.DegToRad(630),
          false
        );

        // Color based on progress
        if (progress > 0.86) {
          this.graphics.fillStyle(0xff0000, 1); // Red (last 14%)
        } else if (progress > 0.5) {
          this.graphics.fillStyle(0xf8ab02, 1); // Orange (50-86%)
        } else {
          this.graphics.fillStyle(0xffffff, 1); // white (0-50%)
        }

        this.graphics.fillPath();
      },
      onComplete: () => {
        if (!this.completed) {
          this.triggerComplete();
        }
      },
    });
  }

  /** Stop the countdown early and trigger completion */
  stop(): void {
    if (this.completed) return;
    this.triggerComplete();
  }

  private triggerComplete(): void {
    this.completed = true;

    if (this.tween) {
      this.tween.stop();
      this.tween = undefined;
    }

    this.graphics.clear();
    this.onComplete();
  }

  /** Clean up resources */
  destroy(): void {
    this.completed = true;

    if (this.tween) {
      this.tween.stop();
      this.tween = undefined;
    }

    this.graphics.destroy();
  }
}
