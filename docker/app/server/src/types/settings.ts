/**
 * Settings type definitions for kiosk games
 */

import type {
  ScheduledPrizeConfig,
  InventoryPrizeConfig,
  AdaptiveAlgorithmConfig,
} from "./prizes";

/**
 * Prize configuration that can be either scheduled or inventory-based
 */
export type PrizeConfig = ScheduledPrizeConfig | InventoryPrizeConfig;

/**
 * Operating hours configuration
 */
export interface OperatingHours {
  /** Opening time in HH:MM format */
  openTime: string;
  /** Closing time in HH:MM format */
  closeTime: string;
}

/**
 * Complete prize management configuration
 */
export interface PrizesConfig {
  /** Map of prize ID to prize configuration */
  prizeTypes: Record<string, PrizeConfig & { type: "scheduled" | "inventory" }>;
  /** Array of consolation wish messages (minimum 30) */
  consolationWishes: string[];
  /** Daily operating hours */
  operatingHours: OperatingHours;
  /** Adaptive distribution algorithm configuration */
  algorithm: AdaptiveAlgorithmConfig;
  /** Texture key for the inventory prize (used by adaptive distribution) */
  inventoryPrizeTextureKey?: string;
}

/**
 * Complete game settings
 */
export interface GameSettings {
  game: {
    title?: string;
    version?: string;
  };
  /** Prize distribution configuration */
  prizes: PrizesConfig;
}
