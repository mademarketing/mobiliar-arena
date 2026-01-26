import Phaser from "phaser";
import { CANVAS } from "../consts/GameConstants";

/**
 * PauseOverlay
 *
 * Displays a semi-transparent overlay with pause message when the game is paused.
 * Used by all interactive scenes to show consistent pause UI.
 */
export default class PauseOverlay {
  private scene: Phaser.Scene;
  private overlay?: Phaser.GameObjects.Rectangle;
  private text?: Phaser.GameObjects.Text;
  private isVisible = false;

  // Very high depth to ensure overlay is always on top
  private static readonly OVERLAY_DEPTH = 1000;
  private static readonly TEXT_DEPTH = 1001;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show the pause overlay with optional custom message
   */
  show(message?: string): void {
    if (this.isVisible) return;
    this.isVisible = true;

    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;

    // Semi-transparent black overlay
    this.overlay = this.scene.add
      .rectangle(centerX, centerY, CANVAS.WIDTH, CANVAS.HEIGHT, 0x000000, 0.8)
      .setDepth(PauseOverlay.OVERLAY_DEPTH);

    // Pause message
    const displayMessage = message || "Spielpause";
    this.text = this.scene.add
      .text(centerX, centerY, displayMessage, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(PauseOverlay.TEXT_DEPTH);
  }

  /**
   * Hide the pause overlay
   */
  hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;

    this.overlay?.destroy();
    this.overlay = undefined;

    this.text?.destroy();
    this.text = undefined;
  }

  /**
   * Check if overlay is currently visible
   */
  get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.hide();
  }
}
