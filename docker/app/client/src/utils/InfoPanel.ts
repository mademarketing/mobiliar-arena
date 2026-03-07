/**
 * InfoPanel - Shared left panel for the second screen layout
 *
 * Renders Mobiliar logo and current highscore on the left side of the screen.
 */

import Phaser from "phaser";
import { CANVAS, LAYOUT, DEPTH } from "../consts/GameConstants";
import TextureKeys from "../consts/TextureKeys";
import { t } from "./translations";

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

    const hsLabel = scene.add.text(LEFT_PAD, 250, t("infoPanel.highScoreLabel"), {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "47px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(hsLabel);

    this.highScoreText = scene.add.text(LEFT_PAD, 310, t("infoPanel.score", { score: highScore }), {
      fontFamily: "MuseoSans, sans-serif",
      fontSize: "83px",
      color: "#333333",
    })
      .setOrigin(0, 0)
      .setDepth(PANEL_DEPTH + 1);
    this.elements.push(this.highScoreText);
  }

  /**
   * Update the highscore display (call after a new high score is set)
   */
  updateHighScore(): void {
    const highScore = this.scene.game.registry.get("highScore") || 0;
    this.highScoreText?.setText(t("infoPanel.score", { score: highScore }));
  }

  destroy(): void {
    for (const el of this.elements) {
      el.destroy();
    }
    this.elements = [];
    this.highScoreText = undefined;
  }
}
