import Phaser from "phaser";
import GameEvents from "../../../shared/GameEvents";
import SceneKeys from "../consts/SceneKeys";

export default class Bootstrap extends Phaser.Scene {
  private settings?: any;

  constructor() {
    super(SceneKeys.Bootstrap);
  }

  preload() {
    this.game.events.once(
      GameEvents.PreloadFinished,
      this.handlePreloadFinished,
      this
    );

    // Load settings from the API endpoint
    const settingsLoader = this.load.json("settings", `/api/settings`);

    settingsLoader.on("loaderror", (e: any) => {
      console.error("Bootstrap: Failed to load settings from API", e);
      // Fallback to default settings if API fails
      this.settings = {
        game: {
          title: "Interactive Kiosk Game",
          version: "1.0.0",
        },
      };
    });
  }

  async create() {
    this.settings = this.cache.json.get("settings");

    // Run Preload scene with settings and game config
    this.scene.run(SceneKeys.Preload, {
      settings: this.settings,
    });

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Loading...", {
        fontFamily: "MuseoSans",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
  }

  private handlePreloadFinished() {
    this.scene.stop(SceneKeys.Preload);
    console.log("Bootstrap: Preload finished");

    this.scene.start(SceneKeys.Content);
  }
}
