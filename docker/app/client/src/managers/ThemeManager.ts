/**
 * ThemeManager - Handles theme loading and asset management
 *
 * Singleton that manages the current theme and provides texture keys
 * for theme-specific assets (backgrounds, balls).
 */

import Phaser from "phaser";
import { THEMES } from "../consts/GameConstants";

export type ThemeName = (typeof THEMES.AVAILABLE)[number];

export default class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeName = THEMES.DEFAULT;

  private constructor() {}

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Set the current theme
   */
  setTheme(theme: string): void {
    if (THEMES.AVAILABLE.includes(theme as ThemeName)) {
      this.currentTheme = theme as ThemeName;
    } else {
      console.warn(`ThemeManager: Unknown theme "${theme}", using default`);
      this.currentTheme = THEMES.DEFAULT;
    }
  }

  /**
   * Get the current theme name
   */
  getTheme(): ThemeName {
    return this.currentTheme;
  }

  /**
   * Get the texture key for the current theme's background
   */
  getBackgroundKey(): string {
    return `theme-${this.currentTheme}-background`;
  }

  /**
   * Get the texture key for the current theme's ball
   */
  getBallKey(): string {
    return `theme-${this.currentTheme}-ball`;
  }

  /**
   * Get the video key for the current theme's intro video
   */
  getIntroVideoKey(): string {
    return `theme-${this.currentTheme}-intro`;
  }

  /**
   * Load theme assets into the scene
   * Call this in the Preload scene's preload() method
   */
  loadThemeAssets(scene: Phaser.Scene): void {
    const theme = this.currentTheme;

    scene.load.image(
      this.getBackgroundKey(),
      `assets/themes/${theme}/background.png`
    );

    scene.load.image(
      this.getBallKey(),
      `assets/themes/${theme}/ball.png`
    );

    scene.load.video(
      this.getIntroVideoKey(),
      `assets/themes/${theme}/intro.mp4`,
      true
    );

    console.log(`ThemeManager: Loading assets for theme "${theme}"`);
  }

  /**
   * Get theme-specific ball rotation speed multiplier
   * Some ball types (handball, volleyball) look better with slow rotation
   */
  getBallRotationMultiplier(): number {
    switch (this.currentTheme) {
      case "basketball":
        return 1.0;
      case "handball":
        return 0.7;
      case "volleyball":
        return 0.1;
      case "floorball":
        return 0.2;
      default:
        return 1.0;
    }
  }

  /**
   * Get theme-specific colors for particles/effects
   */
  getThemeColors(): number[] {
    switch (this.currentTheme) {
      case "basketball":
        return [0xff7832, 0xffa060, 0xff5020];
      case "handball":
        return [0xdc3c3c, 0xff6060, 0xffffff];
      case "volleyball":
        return [0xffdc64, 0xffffa0, 0xffffff];
      case "floorball":
        return [0x3296c8, 0x60c0ff, 0xffffff];
      case "corporate":
        return [0xc81e32, 0xff4050, 0xffffff];
      default:
        return [0xffffff, 0x4ecdc4, 0xffd700];
    }
  }
}
