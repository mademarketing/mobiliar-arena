/**
 * Real-time monitoring script for stress test
 *
 * Run this in a separate terminal while the stress test is running
 * to monitor server health, database stats, and real-time metrics.
 *
 * Usage: npm run stress-test:monitor
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

interface MonitorMetrics {
  timestamp: string;
  totalPlays: number;
  prizes: {
    scheduled: number;
    inventory: number;
    consolation: number;
  };
  inventoryRemaining: number;
  scheduledPending: number;
  databaseSizeMB: number;
}

class StressTestMonitor {
  private dbPath: string;
  private db?: Database.Database;
  private lastTotalPlays = 0;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Connects to the database
   */
  private connect(): void {
    if (!fs.existsSync(this.dbPath)) {
      console.error(`❌ Database not found at: ${this.dbPath}`);
      console.error('Make sure the server is running and has created the database.');
      process.exit(1);
    }

    this.db = new Database(this.dbPath, { readonly: true });
  }

  /**
   * Collects current metrics from database
   */
  private collectMetrics(): MonitorMetrics {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    // Get total plays
    const totalPlays = this.db
      .prepare('SELECT COUNT(*) as count FROM play_log')
      .get() as { count: number };

    // Get prize counts by type
    const scheduledPrizes = this.db
      .prepare("SELECT COUNT(*) as count FROM play_log WHERE prize_type = 'scheduled'")
      .get() as { count: number };

    const inventoryPrizes = this.db
      .prepare("SELECT COUNT(*) as count FROM play_log WHERE prize_type = 'inventory'")
      .get() as { count: number };

    const consolationPrizes = this.db
      .prepare("SELECT COUNT(*) as count FROM play_log WHERE prize_type = 'consolation'")
      .get() as { count: number };

    // Get inventory remaining (total_quantity - awarded_quantity)
    const inventoryRemaining = this.db
      .prepare("SELECT SUM(total_quantity - awarded_quantity) as total FROM daily_inventory WHERE date = date('now')")
      .get() as { total: number | null };

    // Get scheduled prizes pending (not yet awarded)
    const scheduledPending = this.db
      .prepare('SELECT COUNT(*) as count FROM scheduled_prizes WHERE awarded = 0')
      .get() as { count: number };

    // Get database file size
    const stats = fs.statSync(this.dbPath);
    const databaseSizeMB = stats.size / 1048576;

    return {
      timestamp: new Date().toISOString(),
      totalPlays: totalPlays.count,
      prizes: {
        scheduled: scheduledPrizes.count,
        inventory: inventoryPrizes.count,
        consolation: consolationPrizes.count,
      },
      inventoryRemaining: inventoryRemaining.total || 0,
      scheduledPending: scheduledPending.count,
      databaseSizeMB: parseFloat(databaseSizeMB.toFixed(2)),
    };
  }

  /**
   * Displays metrics in a formatted table
   */
  private displayMetrics(metrics: MonitorMetrics): void {
    const playsPerMinute = metrics.totalPlays - this.lastTotalPlays;
    this.lastTotalPlays = metrics.totalPlays;

    const winRate = metrics.totalPlays > 0
      ? (((metrics.prizes.scheduled + metrics.prizes.inventory) / metrics.totalPlays) * 100).toFixed(2)
      : '0.00';

    console.clear();
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STRESS TEST MONITOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last Updated: ${metrics.timestamp}

🎮 GAMEPLAY STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Plays: ${metrics.totalPlays.toLocaleString()}
Plays/Minute: ${playsPerMinute} (last minute)
Win Rate: ${winRate}%

🎁 PRIZE DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gift Cards (Scheduled): ${metrics.prizes.scheduled.toLocaleString()}
Chocolates (Inventory): ${metrics.prizes.inventory.toLocaleString()}
Wishes (Consolation): ${metrics.prizes.consolation.toLocaleString()}

📦 INVENTORY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chocolates Remaining Today: ${metrics.inventoryRemaining}
Scheduled Prizes Pending: ${metrics.scheduledPending}

💾 DATABASE HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Database Size: ${metrics.databaseSizeMB} MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Press Ctrl+C to stop monitoring
    `);
  }

  /**
   * Starts monitoring loop
   */
  start(intervalSeconds = 60): void {
    console.log('🔍 Starting stress test monitor...\n');
    console.log(`Database: ${this.dbPath}`);
    console.log(`Update Interval: ${intervalSeconds} seconds\n`);

    this.connect();

    // Initial metrics display
    const initialMetrics = this.collectMetrics();
    this.displayMetrics(initialMetrics);

    // Start monitoring loop
    const interval = setInterval(() => {
      try {
        const metrics = this.collectMetrics();
        this.displayMetrics(metrics);
      } catch (error) {
        console.error('❌ Error collecting metrics:', error);
      }
    }, intervalSeconds * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(interval);
      if (this.db) {
        this.db.close();
      }
      console.log('\n\n👋 Monitor stopped');
      process.exit(0);
    });
  }
}

// Configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../content/prizes.db');
const updateInterval = parseInt(process.env.UPDATE_INTERVAL || '60', 10);

// Start monitoring
const monitor = new StressTestMonitor(dbPath);
monitor.start(updateInterval);
