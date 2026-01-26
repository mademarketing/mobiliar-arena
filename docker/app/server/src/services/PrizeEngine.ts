import type { GameSettings } from "../types/settings";
import type { PrizeOutcome, Prize, TrefferplanConfigs } from "../types/prizes";
import { PrizeDatabase } from "../database/PrizeDatabase";
import { AdaptiveDistribution } from "./AdaptiveDistribution";
import { getSwissDate, isWithinOperatingHours } from "../utils/timezone";
import * as fs from "fs";
import * as path from "path";

/** Prize definition from config file */
interface PrizeDefinition {
  textureKey: string;
  displayName: string;
}

/** Prizes configuration file format */
interface PrizesConfig {
  prizes: PrizeDefinition[];
}

/** Callback for when game should be paused (e.g., QR codes depleted) */
export type PauseCallback = (reason: string) => void;

/**
 * Prize Engine - Database Edition
 *
 * Core prize distribution engine implementing two-tier logic:
 * 1. Inventory prizes (adaptive) - Prizes with dynamic probability
 * 2. Consolation prizes (fallback) - lose scene displayed
 *
 * Features:
 * - Distribution configuration for daily prize quotas
 * - Multiple inventory prize types with proportional selection
 * - QR code assignment on wins
 * - Auto-pause when QR codes depleted
 */
export class PrizeEngine {
  private db: PrizeDatabase;
  private settings: GameSettings;
  private adaptiveDistribution: AdaptiveDistribution;
  private pauseCheck?: () => boolean;
  private pauseCallback?: PauseCallback;
  private distributionConfigs: TrefferplanConfigs;
  private activeDistribution: string = "standard";
  private prizeDefinitions: PrizeDefinition[] = [];

  constructor(
    database: PrizeDatabase,
    settings: GameSettings,
    pauseCheckFn?: () => boolean,
    pauseCallback?: PauseCallback,
    getCloseTimeFn?: () => string
  ) {
    this.db = database;
    this.settings = settings;
    this.pauseCheck = pauseCheckFn;
    this.pauseCallback = pauseCallback;

    // Load prize definitions from config
    this.prizeDefinitions = this.loadPrizeDefinitions();

    // Load distribution configurations
    this.distributionConfigs = this.loadDistributionConfigs();

    // Load active distribution from game state
    const savedDistribution = this.db.getGameState("activeTrefferplan");
    if (savedDistribution && this.distributionConfigs[savedDistribution]) {
      this.activeDistribution = savedDistribution;
    }

    // Pass database and dynamic closeTime getter to AdaptiveDistribution
    this.adaptiveDistribution = new AdaptiveDistribution(
      settings.prizes.algorithm,
      database,
      getCloseTimeFn
    );

    // Ensure prize definitions exist in database
    this.ensurePrizeDefinitions();

    // Initialize QR codes table if needed (for existing databases)
    this.db.initializeQRCodesTable();

    // Ensure daily inventory exists
    this.ensureDailyInventory();

    console.log("PrizeEngine: Initialized successfully (Database Mode)");
    console.log("PrizeEngine: Active distribution:", this.activeDistribution);
  }

  /**
   * Load prize definitions from JSON file
   */
  private loadPrizeDefinitions(): PrizeDefinition[] {
    try {
      const configPath = path.join(__dirname, "../../content/prizes.json");
      const configData = fs.readFileSync(configPath, "utf8");
      const config = JSON.parse(configData) as PrizesConfig;
      console.log("PrizeEngine: Loaded prize definitions:", config.prizes.map(p => p.textureKey));
      return config.prizes;
    } catch (error) {
      console.warn("PrizeEngine: Could not load prizes.json, using defaults");
      return [
        { textureKey: "prize-a", displayName: "Prize A" },
        { textureKey: "prize-b", displayName: "Prize B" },
      ];
    }
  }

  /**
   * Load distribution configurations from JSON file
   */
  private loadDistributionConfigs(): TrefferplanConfigs {
    try {
      const configPath = path.join(__dirname, "../../content/distribution-config.json");
      const configData = fs.readFileSync(configPath, "utf8");
      const configs = JSON.parse(configData) as TrefferplanConfigs;
      console.log("PrizeEngine: Loaded distribution configs:", Object.keys(configs));
      return configs;
    } catch (error) {
      console.warn("PrizeEngine: Could not load distribution-config.json, using defaults");
      // Generate default config based on prize definitions
      const defaultPrizes: Record<string, number> = {};
      this.prizeDefinitions.forEach((prize, index) => {
        defaultPrizes[prize.textureKey] = 100 - (index * 20); // e.g., 100, 80, 60...
      });

      return {
        standard: {
          name: "Standard",
          description: "Standard prize distribution",
          prizes: defaultPrizes,
        },
      };
    }
  }

  /**
   * Ensure prize definitions exist in database
   */
  private ensurePrizeDefinitions(): void {
    for (const prizeDef of this.prizeDefinitions) {
      let prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
      if (!prize) {
        this.db.createPrize(prizeDef.textureKey, prizeDef.displayName);
        console.log(`PrizeEngine: Created prize definition: ${prizeDef.displayName}`);
      }
    }
  }

  /**
   * Ensure daily inventory exists for today based on active distribution config
   */
  private ensureDailyInventory(): void {
    const today = this.getCurrentDate();
    const config = this.distributionConfigs[this.activeDistribution];

    if (!config) {
      console.error("PrizeEngine: Invalid distribution config:", this.activeDistribution);
      return;
    }

    for (const prizeDef of this.prizeDefinitions) {
      const prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
      if (prize) {
        const existing = this.db.getDailyInventory(prize.id, today);
        const quantity = config.prizes[prizeDef.textureKey] || 0;
        if (!existing && quantity > 0) {
          this.db.createDailyInventory(prize.id, today, quantity);
          console.log(`PrizeEngine: Created daily inventory for ${prizeDef.displayName}: ${quantity}`);
        }
      }
    }
  }

  /**
   * Get available distribution configurations
   */
  getTrefferplanConfigs(): TrefferplanConfigs {
    return this.distributionConfigs;
  }

  /**
   * Get active distribution key
   */
  getActiveTrefferplan(): string {
    return this.activeDistribution;
  }

  /**
   * Set active distribution and update today's inventory
   */
  setActiveTrefferplan(key: string): boolean {
    if (!this.distributionConfigs[key]) {
      console.error("PrizeEngine: Invalid distribution key:", key);
      return false;
    }

    this.activeDistribution = key;
    this.db.setGameState("activeTrefferplan", key);
    console.log("PrizeEngine: Active distribution changed to:", key);

    // Update daily inventory for today with new config values
    this.updateDailyInventoryForDistribution();

    return true;
  }

  /**
   * Update daily inventory totals based on current distribution config
   * Called when config changes mid-day
   */
  private updateDailyInventoryForDistribution(): void {
    const today = this.getCurrentDate();
    const config = this.distributionConfigs[this.activeDistribution];

    if (!config) {
      console.error("PrizeEngine: Invalid distribution config:", this.activeDistribution);
      return;
    }

    for (const prizeDef of this.prizeDefinitions) {
      const prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
      if (prize) {
        const existing = this.db.getDailyInventory(prize.id, today);
        const quantity = config.prizes[prizeDef.textureKey] || 0;

        if (existing) {
          // Update total, but ensure it's not less than already awarded
          const newTotal = Math.max(quantity, existing.awarded_quantity);
          this.db.updateDailyInventoryQuantity(existing.id, newTotal);
          console.log(`PrizeEngine: Updated ${prizeDef.displayName} daily inventory to ${newTotal}`);
        } else if (quantity > 0) {
          this.db.createDailyInventory(prize.id, today, quantity);
          console.log(`PrizeEngine: Created ${prizeDef.displayName} daily inventory: ${quantity}`);
        }
      }
    }
  }

  /**
   * Determine prize outcome for a game play
   *
   * Two-tier algorithm:
   * 1. Check inventory prizes with adaptive probability
   * 2. Default to consolation
   *
   * On win: selects prize type proportionally, assigns QR code
   * If no QR codes available: auto-pauses game
   *
   * @returns Prize outcome to award, or null if game is paused
   */
  determinePrizeOutcome(): PrizeOutcome | null {
    // Check if game is paused
    if (this.pauseCheck && this.pauseCheck()) {
      console.log("Game is paused - returning null (no prize)");
      return null;
    }

    const currentTime = new Date();
    console.log("\n=== Prize Engine: Determining Outcome ===");
    console.log("Current time:", currentTime.toISOString());

    // Ensure daily inventory exists (handles day rollover)
    this.ensureDailyInventory();

    // Wrap prize determination AND logging in a transaction for atomicity
    const outcome = this.db.transaction(() => {
      const today = this.getCurrentDate();

      // Get all prize types and their remaining inventory
      const prizesWithInventory: Array<{ prize: Prize; remaining: number }> = [];
      let totalRemaining = 0;

      for (const prizeDef of this.prizeDefinitions) {
        const prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
        if (prize) {
          const remaining = this.db.getRemainingInventory(prize.id, today);
          if (remaining > 0) {
            prizesWithInventory.push({ prize, remaining });
            totalRemaining += remaining;
          }
        }
      }

      console.log("Inventory status:", {
        prizes: prizesWithInventory.map(p => ({
          name: p.prize.display_name,
          remaining: p.remaining
        })),
        total: totalRemaining,
      });

      // TIER 1: Check inventory prizes with adaptive probability
      if (totalRemaining > 0) {
        const result = this.adaptiveDistribution.checkAwardMultiple(
          currentTime,
          prizesWithInventory
        );

        if (result.shouldAward && result.selectedPrize) {
          const selectedPrize = result.selectedPrize;

          // Check for available QR code
          const qrCode = this.db.getAvailableQRCode(selectedPrize.id);

          if (!qrCode) {
            // No QR code available - trigger auto-pause
            console.log("⚠ NO QR CODE AVAILABLE - Auto-pausing game");
            if (this.pauseCallback) {
              this.pauseCallback(`QR codes for ${selectedPrize.display_name} depleted`);
            }
            // Fall through to consolation
            return this.awardConsolation(currentTime);
          }

          // Get inventory info for logging
          const inventory = this.db.getDailyInventory(selectedPrize.id, today);
          const prizeEntry = prizesWithInventory.find(p => p.prize.id === selectedPrize.id);
          const prizeRemaining = prizeEntry?.remaining || 0;

          // Increment awarded quantity
          this.db.incrementAwardedQuantity(selectedPrize.id, today);

          // Mark QR code as used
          this.db.markQRCodeUsed(qrCode.id);

          // Record award time for adaptive algorithm
          this.adaptiveDistribution.recordInventoryAwarded(currentTime);

          const outcome: PrizeOutcome = {
            prizeId: `inventory-${selectedPrize.id}`,
            prizeType: "inventory",
            displayName: selectedPrize.display_name,
            textureKey: selectedPrize.texture_key,
            timestamp: currentTime.toISOString(),
            qrCode: qrCode.code,
          };

          // Log the play
          this.db.logPlay(
            currentTime.toISOString(),
            today,
            "inventory",
            outcome.prizeId,
            outcome.displayName,
            result.probability,
            prizeRemaining - 1,
            inventory?.total_quantity || 0
          );

          console.log("✓ INVENTORY PRIZE AWARDED:", {
            prize: selectedPrize.display_name,
            probability: (result.probability * 100).toFixed(1) + "%",
            remaining: prizeRemaining - 1,
            qrCode: qrCode.code.substring(0, 20) + "...",
          });

          return outcome;
        } else {
          console.log("✗ Inventory probability check failed");
        }
      } else {
        console.log("✗ No inventory remaining for today");
      }

      // TIER 2: Consolation prize
      return this.awardConsolation(currentTime);
    });

    return outcome;
  }

  /**
   * Award a consolation prize
   */
  private awardConsolation(currentTime: Date): PrizeOutcome {
    const outcome: PrizeOutcome = {
      prizeId: "consolation",
      prizeType: "consolation",
      displayName: "No prize",
      textureKey: "none",
      timestamp: currentTime.toISOString(),
    };

    this.db.logPlay(
      currentTime.toISOString(),
      this.getCurrentDate(),
      "consolation",
      outcome.prizeId,
      outcome.displayName,
      0.0
    );

    console.log("✓ CONSOLATION AWARDED");
    return outcome;
  }

  /**
   * Get current date in YYYY-MM-DD format using Swiss timezone
   */
  private getCurrentDate(): string {
    return getSwissDate();
  }

  /**
   * Get play statistics for today
   */
  getTodayStats() {
    const today = this.getCurrentDate();

    // Ensure daily inventory exists
    this.ensureDailyInventory();

    // Get QR code counts
    const qrCodeCounts = this.db.getQRCodeCounts();

    // Build prizes array
    const prizes: Array<{
      id: number;
      name: string;
      textureKey: string;
      awarded: number;
      total: number;
      remaining: number;
      qrRemaining: number;
    }> = [];

    for (const prizeDef of this.prizeDefinitions) {
      const prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
      if (prize) {
        const inventory = this.db.getDailyInventory(prize.id, today);
        if (inventory) {
          prizes.push({
            id: prize.id,
            name: prize.display_name,
            textureKey: prize.texture_key,
            awarded: inventory.awarded_quantity,
            total: inventory.total_quantity,
            remaining: inventory.total_quantity - inventory.awarded_quantity,
            qrRemaining: qrCodeCounts.find((q) => q.prize_id === prize.id)?.remaining || 0,
          });
        }
      }
    }

    // Get play statistics
    const playStats = this.db.getPlayStats(today);

    // Calculate totals
    const totalAwarded = prizes.reduce((sum, p) => sum + p.awarded, 0);
    const totalInventory = prizes.reduce((sum, p) => sum + p.total, 0);
    const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0);

    return {
      date: today,
      playStats: {
        totalPlays: playStats.totalPlays,
        inventoryPrizes: playStats.inventoryPrizes,
        consolationPrizes: playStats.consolationPrizes,
      },
      prizes,
      totalAwarded,
      totalInventory,
      totalRemaining,
      qrCodeCounts,
      activeTrefferplan: this.activeDistribution,
      trefferplanConfig: this.distributionConfigs[this.activeDistribution],
    };
  }

  /**
   * Reset inventory for testing purposes
   */
  resetInventory(date?: string): void {
    const targetDate = date || this.getCurrentDate();

    this.db.transaction(() => {
      for (const prizeDef of this.prizeDefinitions) {
        const prize = this.db.getPrizeByTextureKey(prizeDef.textureKey);
        if (prize) {
          const inventory = this.db.getDailyInventory(prize.id, targetDate);
          if (inventory) {
            const stmt = (this.db as any).db.prepare(`
              UPDATE daily_inventory
              SET awarded_quantity = 0
              WHERE prize_id = ? AND date = ?
            `);
            stmt.run(prize.id, targetDate);
          }
        }
      }
    });

    this.adaptiveDistribution.resetLastInventoryTime();
    console.log("PrizeEngine: Reset inventory and last award time for", targetDate);
  }

  /**
   * Get the database instance
   */
  getDatabase(): PrizeDatabase {
    return this.db;
  }
}
