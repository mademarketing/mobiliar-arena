/**
 * InfoPanel - Shared left panel for the second screen layout
 *
 * Renders Mobiliar logo, current highscore, giveaway threshold text,
 * and giveaway product image on the left side of the screen.
 */

import Phaser from "phaser";
import { CANVAS, LAYOUT, DEPTH } from "../consts/GameConstants";
import TextureKeys from "../consts/TextureKeys";

const PANEL_DEPTH = DEPTH.UI_ELEMENTS + 20;
const LEFT_PAD = 65;

export default class InfoPanel {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private highScoreText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const { scene } = this;
    const pw = LAYOUT.PANEL_WIDTH;

    // White background rectangle
    const bg = scene.add.rectangle(0, 0, pw, CANVAS.HEIGHT, 0xffffff)
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH);
    this.elements.push(bg);

    // Mobiliar logo (top-left, left-aligned)
    if (scene.textures.exists(TextureKeys.MobiliarLogo)) {
      const logo = scene.add.image(55, -10, TextureKeys.MobiliarLogo)
        .setOrigin(0, 0)
        .setDepth(PANEL_DEPTH + 1);
      const maxWidth = pw - 80;
      const scale = Math.min(1, maxWidth / logo.width) * 0.8;
      logo.setScale(scale);
      this.elements.push(logo);
    }

    // Highscore section — left-aligned, large text
    const highScore = scene.game.registry.get("highScore") || 0;

    const hsLabel = scene.add.text(LEFT_PAD, 250, "Aktueller Highscore:", {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "47px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(hsLabel);

    this.highScoreText = scene.add.text(LEFT_PAD, 310, `${highScore} Punkte`, {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "83px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(this.highScoreText);

    // Giveaway threshold text — left-aligned
    const settings = scene.game.registry.get("gameSettings") || {};
    const threshold = settings.giveawayThreshold ?? 245;

    const giveawayLabel = scene.add.text(LEFT_PAD, 540, "Hol Dir dein Give-Away", {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "36px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(giveawayLabel);

    const thresholdText = scene.add.text(LEFT_PAD, 590, `ab ${threshold} Punkten!`, {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "36px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(thresholdText);

    // Giveaway product image — left-aligned below text
    if (scene.textures.exists(TextureKeys.Giveaway)) {
      const giveaway = scene.add.image(LEFT_PAD, 670, TextureKeys.Giveaway)
        .setOrigin(0, 0)
        .setDepth(PANEL_DEPTH + 1);
      const maxImgWidth = pw - LEFT_PAD * 2;
      const maxImgHeight = 400;
      const scaleW = giveaway.width > maxImgWidth ? maxImgWidth / giveaway.width : 1;
      const scaleH = giveaway.height > maxImgHeight ? maxImgHeight / giveaway.height : 1;
      giveaway.setScale(Math.min(scaleW, scaleH));
      this.elements.push(giveaway);
    }
  }

  /**
   * Update the highscore display (call after a new high score is set)
   */
  updateHighScore(): void {
    const highScore = this.scene.game.registry.get("highScore") || 0;
    this.highScoreText?.setText(`${highScore} Punkte`);
  }

  destroy(): void {
    for (const el of this.elements) {
      el.destroy();
    }
    this.elements = [];
    this.highScoreText = undefined;
  }
}
