/**
 * FloatingText - Score popup that rises and fades
 *
 * Creates animated text that floats upward and fades out,
 * used for score popups, combo notifications, etc.
 */

import Phaser from "phaser";
import { EFFECTS, DEPTH } from "../consts/GameConstants";

/**
 * Create a floating text that rises and fades
 * @param scene - The Phaser scene
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param text - Text to display
 * @param color - Text color (hex string, e.g., "#ffffff")
 * @param fontSize - Font size (default: "32px")
 */
export function createFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = "#ffffff",
  fontSize: string = "32px"
): Phaser.GameObjects.Text {
  const floatText = scene.add
    .text(x, y, text, {
      fontFamily: "MuseoSansBold, sans-serif",
      fontSize,
      color,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000000",
        blur: 0,
        fill: true,
      },
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.PARTICLES);

  scene.tweens.add({
    targets: floatText,
    y: y - EFFECTS.FLOATING_TEXT_RISE,
    alpha: 0,
    scale: 1.3,
    duration: EFFECTS.FLOATING_TEXT_DURATION,
    ease: "Cubic.out",
    onComplete: () => floatText.destroy(),
  });

  return floatText;
}

/**
 * Create a large milestone text (for combo milestones)
 * @param scene - The Phaser scene
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param text - Text to display
 * @param color - Text color
 */
export function createMilestoneText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = "#ffe66d"
): Phaser.GameObjects.Text {
  const milestoneText = scene.add
    .text(x, y, text, {
      fontFamily: "MuseoSansBold, sans-serif",
      fontSize: "64px",
      color,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: "#000000",
        blur: 0,
        fill: true,
      },
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.PARTICLES + 10)
    .setScale(0.5)
    .setAlpha(0);

  // Pop in, then fade out
  scene.tweens.add({
    targets: milestoneText,
    scale: 1.2,
    alpha: 1,
    duration: 200,
    ease: "Back.out",
    onComplete: () => {
      scene.tweens.add({
        targets: milestoneText,
        scale: 1.5,
        alpha: 0,
        y: y - 80,
        duration: 600,
        ease: "Cubic.out",
        delay: 300,
        onComplete: () => milestoneText.destroy(),
      });
    },
  });

  return milestoneText;
}
