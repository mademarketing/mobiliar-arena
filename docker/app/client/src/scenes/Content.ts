/**
 * Content Scene - Plays looping theme intro video before Lobby
 *
 * Displays a full-screen intro video that loops continuously.
 * Press Enter to transition to Lobby.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import { ARENA } from "../consts/GameConstants";
import ThemeManager from "../managers/ThemeManager";
import InfoPanel from "../utils/InfoPanel";

export default class Content extends Phaser.Scene {
  private video?: Phaser.GameObjects.Video;
  private infoPanel?: InfoPanel;

  constructor() {
    super(SceneKeys.Content);
  }

  create() {
    const centerX = ARENA.CENTER_X;
    const centerY = ARENA.CENTER_Y;
    const themeManager = ThemeManager.getInstance();

    // Info panel (left side)
    this.infoPanel = new InfoPanel(this);

    // Create video centered on arena
    this.video = this.add.video(centerX, centerY, themeManager.getIntroVideoKey());

    // Apply circular mask matching arena radius
    const maskShape = this.make.graphics({}, false);
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(centerX, centerY, ARENA.RADIUS);
    this.video.setMask(maskShape.createGeometryMask());

    // Set size once the video has dimensions, then play looping
    const videoSize = ARENA.RADIUS * 2 + 40;
    this.video.once("playing", () => {
      this.video?.setDisplaySize(videoSize, videoSize);
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
    this.infoPanel?.destroy();
    this.infoPanel = undefined;
  }
}
