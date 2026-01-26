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

    this.validatePrizes();

    console.log("Settings validation passed");
  }

  /**
   * Validate prize configuration
   * Note: Prize definitions and consolation wishes now managed in database/frontend
   */
  private validatePrizes(): void {
    if (!this.settings.prizes) {
      throw new Error('Settings must contain a "prizes" object');
    }

    const { prizes } = this.settings;

    // Validate operating hours
    if (!prizes.operatingHours) {
      throw new Error('prizes.operatingHours is required');
    }

    if (!this.isValidTimeString(prizes.operatingHours.openTime)) {
      throw new Error('prizes.operatingHours.openTime must be in HH:MM format (e.g., "10:00")');
    }

    if (!this.isValidTimeString(prizes.operatingHours.closeTime)) {
      throw new Error('prizes.operatingHours.closeTime must be in HH:MM format (e.g., "20:00")');
    }

    // Validate algorithm configuration
    if (!prizes.algorithm) {
      throw new Error('prizes.algorithm is required');
    }

    const { algorithm } = prizes;

    if (!this.isValidTimeString(algorithm.openTime)) {
      throw new Error('prizes.algorithm.openTime must be in HH:MM format');
    }

    if (!this.isValidTimeString(algorithm.closeTime)) {
      throw new Error('prizes.algorithm.closeTime must be in HH:MM format');
    }

    // Validate time-based algorithm parameters
    this.validateProbabilityParam('windowStart', algorithm.windowStart);
    this.validateProbabilityParam('windowEnd', algorithm.windowEnd);
    this.validateProbabilityParam('minProbability', algorithm.minProbability);
    this.validateProbabilityParam('rampStart', algorithm.rampStart);
    this.validateProbabilityParam('rampEnd', algorithm.rampEnd);
    this.validateProbabilityParam('urgentProbability', algorithm.urgentProbability);

    // Validate logical constraints
    if (algorithm.windowEnd <= algorithm.windowStart) {
      throw new Error('prizes.algorithm.windowEnd must be greater than windowStart');
    }

    if (algorithm.rampEnd <= algorithm.rampStart) {
      throw new Error('prizes.algorithm.rampEnd must be greater than rampStart');
    }
  }

  /**
   * Validate time string format (HH:MM)
   */
  private isValidTimeString(time: string): boolean {
    if (typeof time !== 'string') return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  /**
   * Validate probability parameter (0-1 for probabilities, any positive for multipliers)
   */
  private validateProbabilityParam(name: string, value: any): void {
    if (typeof value !== 'number') {
      throw new Error(`prizes.algorithm.${name} must be a number`);
    }

    // Window multipliers can be > 1, but probabilities must be 0-1
    if (name.includes('Probability') || name.includes('ramp')) {
      if (value < 0 || value > 1) {
        throw new Error(`prizes.algorithm.${name} must be between 0 and 1`);
      }
    } else {
      if (value < 0) {
        throw new Error(`prizes.algorithm.${name} must be positive`);
      }
    }
  }

  /**
   * Get the complete settings object
   */
  public getAllSettings(): GameSettings {
    return { ...this.settings };
  }
}
