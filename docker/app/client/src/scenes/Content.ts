/**
 * Content Scene - Plays looping theme intro video before Lobby
 *
 * Displays a full-screen intro video that loops continuously.
 * Press Enter to transition to Lobby.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import { CANVAS } from "../consts/GameConstants";
import ThemeManager from "../managers/ThemeManager";

export default class Content extends Phaser.Scene {
  private video?: Phaser.GameObjects.Video;

  constructor() {
    super(SceneKeys.Content);
  }

  create() {
    const centerX = CANVAS.WIDTH / 2;
    const centerY = CANVAS.HEIGHT / 2;
    const themeManager = ThemeManager.getInstance();

    // Create video centered on canvas
    this.video = this.add.video(centerX, centerY, themeManager.getIntroVideoKey());

    // Apply circular mask (960px diameter = 480px radius)
    const maskShape = this.make.graphics({}, false);
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(centerX, centerY, 480);
    this.video.setMask(maskShape.createGeometryMask());

    // Set size once the video has dimensions, then play looping
    this.video.once("playing", () => {
      this.video?.setDisplaySize(1000, 1000);
    });
    this.video.play(true);

    // Enter to transition to Lobby
    this.input.keyboard?.on("keydown-ENTER", this.goToLobby, this);
  }

  private goToLobby() {
    this.scene.start(SceneKeys.Lobby);
  }

  shutdown() {
    if (this.video) {
      this.video.stop();
      this.video.destroy();
      this.video = undefined;
    }
    this.input.keyboard?.off("keydown-ENTER", this.goToLobby, this);
  }
}
