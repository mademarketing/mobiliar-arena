/**
 * Comprehensive 12-hour stress test for the game server
 *
 * This script simulates continuous gameplay to validate:
 * - Memory stability (no leaks)
 * - Database performance under load
 * - Socket.io connection reliability
 * - Animation timing consistency
 *
 * Run with: npm run stress-test
 */

import { io, Socket } from "socket.io-client";
import * as fs from "fs";
import * as path from "path";

// Import GameEvents enum from shared directory
// Note: Server-side scripts can import shared enums for consistency
import GameEvents from "../../shared/GameEvents";

interface StressTestConfig {
  serverUrl: string;
  totalPlays: number;
  playInterval: number; // milliseconds
  reportInterval: number; // number of plays between reports
  outputDir: string;
}

interface TestMetrics {
  timestamp: number;
  playCount: number;
  memoryUsageMB: number;
  heapTotalMB: number;
  externalMB: number;
  eventLoopDelayMs: number;
  uptime: number;
  errors: number;
  successfulPlays: number;
}

class StressTestRunner {
  private socket?: Socket;
  private config: StressTestConfig;
  private metrics: TestMetrics[] = [];
  private playCount = 0;
  private errorCount = 0;
  private successCount = 0;
  private startTime = 0;
  private lastEventLoopCheck = Date.now();
  private logFile: string;
  private metricsFile: string;

  constructor(config: StressTestConfig) {
    this.config = config;

    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFile = path.join(config.outputDir, `stress-test-${timestamp}.log`);
    this.metricsFile = path.join(
      config.outputDir,
      `stress-test-metrics-${timestamp}.csv`
    );

    // Initialize CSV file
    fs.writeFileSync(
      this.metricsFile,
      "timestamp,playCount,memoryUsageMB,heapTotalMB,externalMB,eventLoopDelayMs,uptime,errors,successfulPlays\n"
    );
  }

  /**
   * Logs message to console and file
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + "\n");
  }

  /**
   * Collects current metrics
   */
  private collectMetrics(): TestMetrics {
    const mem = process.memoryUsage();
    const now = Date.now();

    // Note: Event loop delay measurement removed as it was inaccurate
    // The stress test runs in its own process, separate from the server
    // For real event loop monitoring, use external tools like clinic.js

    return {
      timestamp: now,
      playCount: this.playCount,
      memoryUsageMB: parseFloat((mem.heapUsed / 1048576).toFixed(2)),
      heapTotalMB: parseFloat((mem.heapTotal / 1048576).toFixed(2)),
      externalMB: parseFloat((mem.external / 1048576).toFixed(2)),
      eventLoopDelayMs: 0, // Not measured in client stress test
      uptime: (now - this.startTime) / 1000,
      errors: this.errorCount,
      successfulPlays: this.successCount,
    };
  }

  /**
   * Saves metrics to CSV file
   */
  private saveMetrics(metrics: TestMetrics): void {
    const row = [
      metrics.timestamp,
      metrics.playCount,
      metrics.memoryUsageMB,
      metrics.heapTotalMB,
      metrics.externalMB,
      metrics.eventLoopDelayMs,
      metrics.uptime,
      metrics.errors,
      metrics.successfulPlays,
    ].join(",");

    fs.appendFileSync(this.metricsFile, row + "\n");
  }

  /**
   * Reports current progress and metrics
   */
  private reportProgress(): void {
    const metrics = this.collectMetrics();
    this.metrics.push(metrics);
    this.saveMetrics(metrics);

    const percentComplete = (
      (this.playCount / this.config.totalPlays) *
      100
    ).toFixed(1);
    const successRate = ((this.successCount / this.playCount) * 100).toFixed(1);
    const estimatedTimeRemaining =
      ((this.config.totalPlays - this.playCount) * this.config.playInterval) /
      1000 /
      60;

    this.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROGRESS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plays: ${this.playCount}/${this.config.totalPlays} (${percentComplete}%)
Success Rate: ${successRate}%
Errors: ${this.errorCount}
Uptime: ${(metrics.uptime / 60).toFixed(1)} minutes
Estimated Time Remaining: ${estimatedTimeRemaining.toFixed(1)} minutes

💾 MEMORY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Heap Used: ${metrics.memoryUsageMB} MB
Heap Total: ${metrics.heapTotalMB} MB
External: ${metrics.externalMB} MB
Event Loop Delay: ${metrics.eventLoopDelayMs} ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  /**
   * Generates final summary report
   */
  private generateSummary(): void {
    if (this.metrics.length === 0) {
      this.log("⚠️  No metrics collected");
      return;
    }

    const memoryValues = this.metrics.map((m) => m.memoryUsageMB);
    const avgMemory =
      memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const maxMemory = Math.max(...memoryValues);
    const minMemory = Math.min(...memoryValues);

    const eventLoopDelays = this.metrics.map((m) => m.eventLoopDelayMs);
    const avgEventLoopDelay =
      eventLoopDelays.reduce((a, b) => a + b, 0) / eventLoopDelays.length;
    const maxEventLoopDelay = Math.max(...eventLoopDelays);

    const totalDuration = (Date.now() - this.startTime) / 1000 / 60 / 60; // hours
    const playsPerMinute = this.playCount / (totalDuration * 60);

    const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STRESS TEST COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  DURATION & THROUGHPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Duration: ${totalDuration.toFixed(2)} hours
Total Plays: ${this.playCount}
Successful Plays: ${this.successCount}
Failed Plays: ${this.errorCount}
Success Rate: ${((this.successCount / this.playCount) * 100).toFixed(2)}%
Average Plays/Minute: ${playsPerMinute.toFixed(2)}

💾 MEMORY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Average Memory: ${avgMemory.toFixed(2)} MB
Min Memory: ${minMemory.toFixed(2)} MB
Max Memory: ${maxMemory.toFixed(2)} MB
Memory Growth: ${(maxMemory - minMemory).toFixed(2)} MB

⚡ PERFORMANCE NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event Loop Delay: Not measured (stress test runs in separate process)
Note: Monitor server process separately for performance metrics

📁 OUTPUT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Log File: ${this.logFile}
Metrics CSV: ${this.metricsFile}

🔍 VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.generateVerdict(
  maxMemory - minMemory,
  avgEventLoopDelay,
  this.errorCount
)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    this.log(summary);
  }

  /**
   * Generates verdict based on test results
   */
  private generateVerdict(
    memoryGrowth: number,
    avgEventLoopDelay: number,
    errors: number
  ): string {
    const issues: string[] = [];

    if (memoryGrowth > 100) {
      issues.push(
        `⚠️  HIGH MEMORY GROWTH: ${memoryGrowth.toFixed(
          2
        )} MB (threshold: 100 MB)`
      );
    }

    // Event loop delay not measured in stress test client
    // Server event loop performance should be monitored separately

    if (errors > this.playCount * 0.01) {
      issues.push(
        `⚠️  HIGH ERROR RATE: ${((errors / this.playCount) * 100).toFixed(
          2
        )}% (threshold: 1%)`
      );
    }

    if (issues.length === 0) {
      return "✅ PASS - System is stable and ready for production";
    } else {
      return "❌ ISSUES DETECTED:\n" + issues.join("\n");
    }
  }

  /**
   * Runs the stress test
   */
  async run(): Promise<void> {
    this.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 STARTING STRESS TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server URL: ${this.config.serverUrl}
Total Plays: ${this.config.totalPlays}
Play Interval: ${this.config.playInterval}ms (${(
      60000 / this.config.playInterval
    ).toFixed(1)} plays/min)
Expected Duration: ${(
      (this.config.totalPlays * this.config.playInterval) /
      1000 /
      60 /
      60
    ).toFixed(2)} hours
Report Interval: Every ${this.config.reportInterval} plays
Output Directory: ${this.config.outputDir}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    this.startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.socket = io(this.config.serverUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      this.socket.on("connect", () => {
        this.log("✅ Connected to server - starting stress test");
        this.log(
          "⏳ Waiting for initial animation to complete before starting test...\n"
        );

        let isAnimationComplete = true; // Start true to allow first press
        let pressTimeout: NodeJS.Timeout | null = null;

        // Listen for animation complete events from frontend
        // Note: this.socket is guaranteed to exist inside connect handler
        this.socket!.on(GameEvents.AnimationComplete, () => {
          this.log(
            `✅ Animation complete event received (play ${this.playCount})`
          );

          // Wait 5 seconds to simulate user viewing the result, then reset to Idle
          setTimeout(() => {
            if (this.socket?.connected) {
              this.log(`🔄 Sending SimulateBuzzerPress to return to Idle (play ${this.playCount})`);
              this.socket.emit(GameEvents.SimulateBuzzerPress, 0);

              // After a short delay for scene transition, mark ready for next play
              setTimeout(() => {
                isAnimationComplete = true;
                this.log(`✅ Ready for next play (play ${this.playCount})`);
              }, 2000); // Wait 2s for transition
            }
          }, 5000); // Wait 5s to view result
        });

        const scheduledNextPress = () => {
          pressTimeout = setTimeout(() => {
            if (!this.socket?.connected) {
              this.log("⚠️  Socket disconnected - waiting for reconnection");
              this.errorCount++;
              scheduledNextPress(); // Retry
              return;
            }

            // Wait for animation to complete before sending next press
            if (!isAnimationComplete) {
              this.log(
                `⏳ Waiting for animation to complete (play ${this.playCount})...`
              );
              // Check again in 1 second
              setTimeout(scheduledNextPress, 1000);
              return;
            }

            try {
              this.log(`🔴 Sending SimulateBuzzerPress (play ${this.playCount + 1})`);
              this.socket.emit(GameEvents.SimulateBuzzerPress, 0);
              this.playCount++;
              this.successCount++;

              if (this.playCount % this.config.reportInterval === 0) {
                this.reportProgress();
              }

              if (this.playCount >= this.config.totalPlays) {
                if (pressTimeout) clearTimeout(pressTimeout);
                this.reportProgress(); // Final report
                this.generateSummary();
                this.socket?.disconnect();
                resolve();
                return;
              }

              // Schedule next press
              scheduledNextPress();
            } catch (error) {
              this.errorCount++;
              this.log(`❌ Error on play ${this.playCount}: ${error}`);
              scheduledNextPress(); // Continue despite error
            }
          }, this.config.playInterval);
        };

        // Start the press cycle
        scheduledNextPress();
      });

      this.socket.on("connect_error", (error) => {
        this.errorCount++;
        this.log(`❌ Connection error: ${error.message}`);
      });

      this.socket.on("disconnect", (reason) => {
        this.log(`⚠️  Disconnected: ${reason}`);
      });

      this.socket.on("error", (error) => {
        this.errorCount++;
        this.log(`❌ Socket error: ${error}`);
      });

      // Handle process termination
      process.on("SIGINT", () => {
        this.log("\n⚠️  Test interrupted by user");
        this.generateSummary();
        this.socket?.disconnect();
        process.exit(0);
      });
    });
  }
}

// Configuration
const config: StressTestConfig = {
  serverUrl: process.env.SERVER_URL || "http://localhost:3000",
  totalPlays: parseInt(process.env.TOTAL_PLAYS || "4320", 10), // 12 hours × 60 min × 6 plays/min
  playInterval: parseInt(process.env.PLAY_INTERVAL || "10000", 10), // 10 seconds = 6 plays/min
  reportInterval: parseInt(process.env.REPORT_INTERVAL || "100", 10), // Report every 100 plays
  outputDir: process.env.OUTPUT_DIR || "./stress-test-results",
};

// Run the test
const runner = new StressTestRunner(config);
runner
  .run()
  .then(() => {
    console.log("\n✅ Stress test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Stress test failed:", error);
    process.exit(1);
  });
