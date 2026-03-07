import * as fs from "fs";
import type { GameSettings } from "../types/settings";

/**
 * Simple Settings Loader Service
 *
 * Handles loading and validation of the game configuration from settings.json
 */
export class SettingsLoader {
  private settings: GameSettings;
  private settingsPath: string;

  constructor(settingsPath: string) {
    this.settingsPath = settingsPath;
    this.settings = this.loadSettings();
    this.validateSettings();
  }

  /**
   * Load settings from the JSON file
   */
  private loadSettings(): GameSettings {
    try {
      const settingsData = fs.readFileSync(this.settingsPath, "utf8");
      return JSON.parse(settingsData);
    } catch (error) {
      throw new Error(
        `Failed to load settings from ${this.settingsPath}: ${error}`
      );
    }
  }

  /**
   * Validate the loaded settings structure
   */
  private validateSettings(): void {
    if (!this.settings.game || typeof this.settings.game !== "object") {
      throw new Error('Settings must contain a "game" object');
    }

    console.log("Settings validation passed");
  }

  /**
   * Get the complete settings object
   */
  public getAllSettings(): GameSettings {
    return { ...this.settings };
  }
}
