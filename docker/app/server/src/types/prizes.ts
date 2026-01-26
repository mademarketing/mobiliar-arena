/**
 * Prize type definitions for the Win/Lose Logic Engine
 */

import type { PrizeTextureKey } from '../../../shared/PrizeTextureKeys';

/**
 * Prize type discriminator
 */
export type PrizeType = "scheduled" | "inventory" | "consolation";

/**
 * Prize outcome returned to the client
 */
export interface PrizeOutcome {
  /** Unique identifier for the prize (e.g., "giftcard-10", "winforlife-ticket") */
  prizeId: string;
  /** Type of prize awarded */
  prizeType: PrizeType;
  /** Display name shown in UI */
  displayName: string;
  /** Texture key for Phaser.js rendering */
  textureKey: string;
  /** Optional wish text for consolation prizes */
  wishText?: string;
  /** Timestamp when prize was awarded */
  timestamp: string;
  /** QR code for prize redemption (inventory prizes only) */
  qrCode?: string;
}

/**
 * Inventory state tracking daily lottery ticket distribution and scheduled prize awards
 */
export interface InventoryState {
  /** Current date in YYYY-MM-DD format */
  date: string;
  /** Number of lottery tickets given out today */
  ticketsAwarded: number;
  /** Array of scheduled prize IDs that have been awarded */
  scheduledPrizesAwarded: Array<{
    prizeId: string;
    datetime: string;
    awardedAt: string;
  }>;
}

/**
 * Configuration for scheduled prizes (gift cards awarded at specific times)
 */
export interface ScheduledPrizeConfig {
  /** ISO 8601 datetime string with timezone (e.g., "2025-11-24T14:30:00+01:00") */
  datetime: string;
  /** Whether this prize has been awarded */
  awarded: boolean;
  /** Texture key for rendering */
  textureKey: string;
  /** Display name for UI */
  displayName: string;
}

/**
 * Configuration for inventory-based prizes (lottery tickets distributed adaptively)
 */
export interface InventoryPrizeConfig {
  /** Array of [date, dailyLimit] tuples for per-day allocation */
  inventory: Array<[string, number]>;
  /** Texture key for rendering */
  textureKey: string;
  /** Display name for UI */
  displayName: string;
}

/**
 * Configuration for consolation prizes (wishes)
 */
export interface ConsolationConfig {
  /** Array of uplifting German wish messages */
  wishes: string[];
}

/**
 * Configuration for time-based adaptive lottery ticket distribution algorithm
 *
 * Awards lottery tickets at target time intervals with randomized probability window.
 * No visitor count estimation needed - purely time-based.
 *
 * Example: With 200 tickets and 10 hours:
 * - Target interval: 180 seconds (3 minutes)
 * - Window start: 126 seconds (70% of target)
 * - Window end: 270 seconds (150% of target)
 * - Probability ramps from 15% to 75% within window
 */
export interface AdaptiveAlgorithmConfig {
  /** Opening time in HH:MM format (e.g., "10:00") */
  openTime: string;
  /** Closing time in HH:MM format (e.g., "20:00") */
  closeTime: string;
  /** Multiplier for earliest possible award (0.7 = 70% of target interval) */
  windowStart: number;
  /** Multiplier for latest acceptable award (1.5 = 150% of target interval) */
  windowEnd: number;
  /** Probability when too early (before window start) */
  minProbability: number;
  /** Probability at window start (beginning of ramp) */
  rampStart: number;
  /** Probability at window end (end of ramp) */
  rampEnd: number;
  /** Probability when overdue (after window end) */
  urgentProbability: number;
}

/**
 * Database Entity Types
 */

/** Prize entity from database */
export interface Prize {
  id: number;
  texture_key: PrizeTextureKey; // Type-safe! Must be valid texture key
  display_name: string;
  created_at: string;
}

/** Scheduled prize entity from database */
export interface ScheduledPrize {
  id: number;
  prize_id: number;
  datetime: string;
  date: string;
  awarded: boolean;
  awarded_at: string | null;
}

/** Daily inventory entity from database */
export interface DailyInventory {
  id: number;
  prize_id: number;
  date: string;
  total_quantity: number;
  awarded_quantity: number;
}

/** Inventory summary for admin dashboard */
export interface InventorySummary {
  id: number;
  date: string;
  prize_name: string;
  total_quantity: number;
  awarded_quantity: number;
  remaining: number;
}

/** Scheduled prize summary for admin dashboard */
export interface ScheduledSummary {
  id: number;
  prize_name: string;
  datetime: string;
  date: string;
  awarded: boolean;
  awarded_at: string | null;
}

/** QR code entity from database */
export interface QRCode {
  id: number;
  prize_id: number;
  code: string;
  is_used: number;
  used_at: string | null;
  play_log_id: number | null;
}

/** QR code count summary for dashboard */
export interface QRCodeCount {
  prize_id: number;
  prize_name: string;
  total: number;
  used: number;
  remaining: number;
}

/** Distribution configuration from JSON */
export interface TrefferplanConfig {
  name: string;
  description: string;
  /** Prize quantities keyed by texture key */
  prizes: Record<string, number>;
}

/** All available Trefferplan configurations */
export interface TrefferplanConfigs {
  [key: string]: TrefferplanConfig;
}
