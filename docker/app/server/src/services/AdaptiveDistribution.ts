import type { AdaptiveAlgorithmConfig, Prize } from "../types/prizes";
import type { PrizeDatabase } from "../database/PrizeDatabase";
import { getSwissTime } from "../utils/timezone";

/**
 * Result of checking if an award should be given
 */
export interface AwardCheckResult {
  shouldAward: boolean;
  probability: number;
  selectedPrize?: Prize;
}

/**
 * Time-Based Adaptive Distribution Algorithm
 *
 * Awards inventory prizes at target time intervals with randomized probability window.
 * No visitor count estimation needed - purely time-based approach.
 *
 * Core Logic:
 * 1. Calculate target interval: remainingTime / inventoryRemaining
 * 2. Track time since last inventory prize awarded
 * 3. Award within probability window (70-150% of target interval)
 * 4. Probability escalates linearly within window, urgent if overdue
 *
 * Example: 20 inventory prizes left, 2 hours remaining
 * - Target interval: 360 seconds (6 minutes)
 * - Window: 252-540 seconds
 * - Before 252s: 2% probability (too soon)
 * - 252-540s: 15%→75% probability (linear ramp)
 * - After 540s: 95% probability (urgent)
 */
export class AdaptiveDistribution {
  private config: AdaptiveAlgorithmConfig;
  private lastInventoryTime: Date | null = null;
  private db: PrizeDatabase;
  private getCloseTime?: () => string;

  constructor(config: AdaptiveAlgorithmConfig, db: PrizeDatabase, getCloseTimeFn?: () => string) {
    this.config = config;
    this.db = db;
    this.getCloseTime = getCloseTimeFn;

    // Load lastInventoryTime from database on startup
    this.loadLastInventoryTime();
  }

  /**
   * Load lastInventoryTime from database
   * Called during construction to restore state after restart
   */
  private loadLastInventoryTime(): void {
    const storedValue = this.db.getGameState('lastInventoryTime');
    if (storedValue) {
      this.lastInventoryTime = new Date(storedValue);
      console.log(`AdaptiveDistribution: Loaded lastInventoryTime from database: ${this.lastInventoryTime.toISOString()}`);
    } else {
      this.lastInventoryTime = null;
      console.log('AdaptiveDistribution: No previous lastInventoryTime found in database');
    }
  }

  /**
   * Record that an inventory prize was awarded at the given time
   * @param time Timestamp when inventory prize was awarded
   */
  recordInventoryAwarded(time: Date): void {
    this.lastInventoryTime = time;

    // Persist to database
    this.db.setGameState('lastInventoryTime', time.toISOString());

    console.log(
      `AdaptiveDistribution: Recorded inventory prize awarded at ${time.toISOString()}`
    );
  }

  /**
   * Reset the last inventory time (for testing or daily reset)
   */
  resetLastInventoryTime(): void {
    this.lastInventoryTime = null;
    console.log("AdaptiveDistribution: Reset last inventory time");
  }

  /**
   * Calculate win probability using time-based intervals
   *
   * Time-Based Algorithm:
   * 1. Calculate target interval between prizes: remainingTime / inventoryRemaining
   * 2. Calculate time since last inventory prize awarded
   * 3. Apply probability window:
   *    - Before 70% of interval: Very low probability (2%)
   *    - 70-150% of interval: Linear ramp (15% → 75%)
   *    - After 150% of interval: Urgent probability (95%)
   *
   * Example: 20 inventory prizes left, 2 hours (7200s) remaining
   * - Target interval: 7200s / 20 = 360s (6 minutes)
   * - Window: 252s - 540s
   * - If 300s since last prize: probability = 15% + (48s/288s) * 60% ≈ 25%
   *
   * IMPORTANT: All time calculations use Swiss timezone (Europe/Zurich)
   * to ensure opening hours (10:00-20:00) match local booth hours.
   *
   * @param currentTime Current datetime (any timezone, will be converted to Swiss)
   * @param inventoryRemaining Number of inventory prizes left to distribute
   * @returns Win probability between 0.0 and 1.0
   */
  calculateProbability(
    currentTime: Date,
    inventoryRemaining: number
  ): number {
    // If no inventory remaining, probability is 0
    if (inventoryRemaining <= 0) {
      console.log(
        "AdaptiveDistribution: No inventory remaining, probability = 0"
      );
      return 0;
    }

    // Convert to Swiss timezone for all time calculations
    const swissTime = getSwissTime(currentTime);

    // Parse operating hours
    // Use dynamic closeTime from promoter settings if available, otherwise fall back to config
    const openTime = this.config.openTime;
    const closeTime = this.getCloseTime ? this.getCloseTime() : this.config.closeTime;
    const [openHour, openMin] = openTime.split(":").map(Number);
    const [closeHour, closeMin] = closeTime.split(":").map(Number);

    // Create datetime objects for open and close times (in Swiss timezone)
    const openDateTime = new Date(swissTime);
    openDateTime.setHours(openHour, openMin, 0, 0);

    const closeDateTime = new Date(swissTime);
    closeDateTime.setHours(closeHour, closeMin, 0, 0);

    // Handle edge case: before opening time
    if (swissTime.getTime() < openDateTime.getTime()) {
      console.log(
        "AdaptiveDistribution: Before opening time, probability = 0"
      );
      return 0;
    }

    // Calculate remaining time in seconds
    const remainingMs = closeDateTime.getTime() - swissTime.getTime();
    const remainingSeconds = Math.max(0, remainingMs / 1000);

    // Handle edge case: closing time passed
    if (remainingSeconds === 0) {
      console.log(
        "AdaptiveDistribution: Past closing time, urgent probability"
      );
      return this.config.urgentProbability;
    }

    // Calculate target interval between inventory prizes (in seconds)
    const targetInterval = remainingSeconds / inventoryRemaining;

    // Calculate time since last inventory prize award (in seconds)
    let timeSinceLastWin: number;
    if (this.lastInventoryTime === null) {
      // First inventory prize of the day - use time elapsed since opening
      // This avoids cold start problem where first hour has 0% win rate
      const elapsedMs = swissTime.getTime() - openDateTime.getTime();
      timeSinceLastWin = Math.max(0, elapsedMs / 1000);
    } else {
      // Convert last inventory time to Swiss timezone as well
      const lastInventorySwiss = getSwissTime(this.lastInventoryTime);
      timeSinceLastWin =
        (swissTime.getTime() - lastInventorySwiss.getTime()) / 1000;
    }

    // Calculate probability window boundaries (in seconds)
    const windowStart = targetInterval * this.config.windowStart;
    const windowEnd = targetInterval * this.config.windowEnd;

    // Determine probability based on position within window
    let probability: number;

    if (timeSinceLastWin < windowStart) {
      // Too soon - use minimum probability
      probability = this.config.minProbability;
    } else if (timeSinceLastWin > windowEnd) {
      // Overdue - use urgent probability
      probability = this.config.urgentProbability;
    } else {
      // Within window - linear ramp from rampStart to rampEnd
      const progress =
        (timeSinceLastWin - windowStart) / (windowEnd - windowStart);
      probability =
        this.config.rampStart +
        progress * (this.config.rampEnd - this.config.rampStart);
    }

    // Log calculation details
    console.log("AdaptiveDistribution:", {
      inventoryRemaining,
      remainingTime: `${(remainingSeconds / 60).toFixed(1)}min`,
      targetInterval: `${targetInterval.toFixed(0)}s`,
      timeSinceLastWin: `${timeSinceLastWin.toFixed(0)}s`,
      windowStart: `${windowStart.toFixed(0)}s`,
      windowEnd: `${windowEnd.toFixed(0)}s`,
      position:
        timeSinceLastWin < windowStart
          ? "BEFORE WINDOW"
          : timeSinceLastWin > windowEnd
            ? "OVERDUE"
            : "IN WINDOW",
      finalProbability: (probability * 100).toFixed(1) + "%",
    });

    return probability;
  }

  /**
   * Determine if prize should be awarded based on probability
   *
   * @param probability Win probability (0.0 to 1.0)
   * @returns True if prize should be awarded
   */
  shouldAwardPrize(probability: number): boolean {
    const random = Math.random();
    const award = random < probability;

    console.log(
      `AdaptiveDistribution: Random=${(random * 100).toFixed(1)}% vs Probability=${(probability * 100).toFixed(1)}% => ${award ? "WIN" : "LOSE"}`
    );

    return award;
  }

  /**
   * Calculate probability and determine if prize should be awarded in one call
   *
   * Convenience method that combines calculateProbability and shouldAwardPrize
   *
   * @param currentTime Current datetime
   * @param inventoryRemaining Number of inventory prizes left to distribute
   * @returns Object with shouldAward decision and calculated probability
   */
  checkAward(
    currentTime: Date,
    inventoryRemaining: number
  ): { shouldAward: boolean; probability: number } {
    const probability = this.calculateProbability(
      currentTime,
      inventoryRemaining
    );
    const shouldAward = this.shouldAwardPrize(probability);

    return { shouldAward, probability };
  }

  /**
   * Check if prize should be awarded with multiple inventory prize types
   *
   * Uses combined inventory (sum of all prize types) for probability calculation,
   * then selects prize type proportionally based on remaining inventory.
   *
   * Example: 100 Prize A remaining, 20 Prize B remaining = 120 total
   * - Probability calculated using 120 total inventory
   * - If win: 83.3% chance Prize A, 16.7% chance Prize B
   *
   * @param currentTime Current datetime
   * @param inventoryPrizes Array of prizes with their remaining counts
   * @returns Award check result with optional selected prize
   */
  checkAwardMultiple(
    currentTime: Date,
    inventoryPrizes: Array<{ prize: Prize; remaining: number }>
  ): AwardCheckResult {
    // Calculate combined inventory
    const totalRemaining = inventoryPrizes.reduce(
      (sum, p) => sum + p.remaining,
      0
    );

    // Calculate probability using combined inventory
    const probability = this.calculateProbability(currentTime, totalRemaining);
    const shouldAward = this.shouldAwardPrize(probability);

    if (!shouldAward || totalRemaining === 0) {
      return { shouldAward: false, probability };
    }

    // Select prize type proportionally
    const selectedPrize = this.selectPrizeProportionally(inventoryPrizes);

    console.log(
      `AdaptiveDistribution: Selected prize proportionally: ${selectedPrize.display_name}`
    );

    return {
      shouldAward: true,
      probability,
      selectedPrize,
    };
  }

  /**
   * Select a prize type proportionally based on remaining inventory
   *
   * @param inventoryPrizes Array of prizes with their remaining counts
   * @returns Selected prize
   */
  private selectPrizeProportionally(
    inventoryPrizes: Array<{ prize: Prize; remaining: number }>
  ): Prize {
    // Filter to prizes with remaining inventory
    const availablePrizes = inventoryPrizes.filter((p) => p.remaining > 0);

    if (availablePrizes.length === 0) {
      throw new Error("No prizes with remaining inventory");
    }

    if (availablePrizes.length === 1) {
      return availablePrizes[0].prize;
    }

    // Calculate total remaining
    const totalRemaining = availablePrizes.reduce(
      (sum, p) => sum + p.remaining,
      0
    );

    // Generate random number and find prize
    const random = Math.random() * totalRemaining;
    let cumulative = 0;

    for (const { prize, remaining } of availablePrizes) {
      cumulative += remaining;
      if (random < cumulative) {
        return prize;
      }
    }

    // Fallback to last prize (shouldn't happen)
    return availablePrizes[availablePrizes.length - 1].prize;
  }
}
