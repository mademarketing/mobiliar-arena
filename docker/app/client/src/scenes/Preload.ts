import Phaser from "phaser";
import GameEvents from "../../../shared/GameEvents";
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import ThemeManager from "../managers/ThemeManager";

/**
 * Preload Scene - Load all game assets here
 *
 * Add your asset loading code in the preload() method.
 * Assets are loaded from the public/assets/ directory.
 *
 * Example usage:
 *   this.load.image("background", "assets/images/background.png");
 *   this.load.image("logo", "assets/images/logo.png");
 *   this.load.spritesheet("player", "assets/sprites/player.png", { frameWidth: 32, frameHeight: 32 });
 */
export default class Preload extends Phaser.Scene {
  private settings!: any;

  constructor() {
    super(SceneKeys.Preload);
  }

  init(data: { settings: any }) {
    this.settings = data.settings;
  }

  preload() {
    console.log("Preload: Starting to load assets...");
    console.log("Preload: Settings received:", this.settings);

    // Load web fonts
    this.load.rexWebFont({
      custom: {
        families: ["MuseoSans", "MuseoSansBold"],
        urls: ["assets/fonts/font.css"],
      },
    });

    // Load game assets - add your assets here
    this.load.image(TextureKeys.Logo, "assets/images/logo.png");
    this.load.image(TextureKeys.BuzzerIcon, "assets/images/buzzer-icon.png");
    this.load.image(TextureKeys.Background, "assets/images/background.png");

    // Set theme from settings and load theme assets
    const themeManager = ThemeManager.getInstance();
    const theme = this.settings?.theme || "basketball";
    themeManager.setTheme(theme);
    themeManager.loadThemeAssets(this);

    // Create particle texture for collision effects
    this.createParticleTexture();

    // Create confetti texture for celebrations
    this.createConfettiTexture();

    // Add load complete handler
    this.load.on("complete", () => {
      console.log("Preload: All assets loaded successfully");
    });

    this.load.on("loaderror", (fileObj: any) => {
      console.error("Preload: Error loading file:", fileObj.key, fileObj.src);
    });
  }

  /**
   * Create a small white circle texture for collision particles
   */
  private createParticleTexture(): void {
    const key = "particle";
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture(key, 16, 16);
    graphics.destroy();
  }

  /**
   * Create a small rectangle texture for confetti
   */
  private createConfettiTexture(): void {
    const key = "confetti";
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 12, 8);
    graphics.generateTexture(key, 12, 8);
    graphics.destroy();
  }

  create() {
    // Store settings in registry for other scenes to access
    this.game.registry.set("gameSettings", this.settings);

    // Emit preload finished event
    this.game.events.emit(GameEvents.PreloadFinished);
  }
}
