/**
 * Simulation Reporter
 *
 * Collects simulation data and generates reports in multiple formats:
 * - HTML report with Chart.js visualizations
 * - CSV export for further analysis
 * - Terminal summary statistics
 */

import * as fs from "fs";
import * as path from "path";

export interface SimulationDataPoint {
  timestamp: Date;
  prizeType: "scheduled" | "inventory" | "consolation";
  prizeId: string;
  probability?: number;
  inventoryGiven: number;
  inventoryRemaining: number;
  visitorCount: number;
}

export interface SimulationSummary {
  totalPlays: number;
  scheduledPrizes: number;
  inventoryPrizes: number;
  consolations: number;
  averageProbability: number;
  inventoryWinRate: number;
  hourlyStats: Array<{
    hour: number;
    visitors: number;
    prizes: number;
    inventoryPrizes: number;
  }>;
}

export class SimulationReporter {
  private dataPoints: SimulationDataPoint[] = [];

  /**
   * Add a data point to the simulation
   */
  addDataPoint(point: SimulationDataPoint): void {
    this.dataPoints.push(point);
  }

  /**
   * Clear all collected data
   */
  clear(): void {
    this.dataPoints = [];
  }

  /**
   * Generate summary statistics
   */
  generateSummary(): SimulationSummary {
    const scheduledPrizes = this.dataPoints.filter(
      (p) => p.prizeType === "scheduled"
    ).length;
    const inventoryPrizes = this.dataPoints.filter(
      (p) => p.prizeType === "inventory"
    ).length;
    const consolations = this.dataPoints.filter(
      (p) => p.prizeType === "consolation"
    ).length;

    // Calculate average probability for inventory prizes
    const inventoryPrizesWithProb = this.dataPoints.filter(
      (p) => p.prizeType === "inventory" && p.probability !== undefined
    );
    const averageProbability =
      inventoryPrizesWithProb.length > 0
        ? inventoryPrizesWithProb.reduce((sum, p) => sum + (p.probability || 0), 0) /
          inventoryPrizesWithProb.length
        : 0;

    const inventoryWinRate = this.dataPoints.length > 0
      ? inventoryPrizes / this.dataPoints.length
      : 0;

    // Calculate hourly stats
    const hourlyMap = new Map<number, { visitors: number; prizes: number; inventoryPrizes: number }>();

    for (const point of this.dataPoints) {
      const hour = point.timestamp.getHours();
      if (!hourlyMap.has(hour)) {
        hourlyMap.set(hour, { visitors: 0, prizes: 0, inventoryPrizes: 0 });
      }
      const stats = hourlyMap.get(hour)!;
      stats.visitors++;
      stats.prizes++;
      if (point.prizeType === "inventory") {
        stats.inventoryPrizes++;
      }
    }

    const hourlyStats = Array.from(hourlyMap.entries())
      .map(([hour, stats]) => ({ hour, ...stats }))
      .sort((a, b) => a.hour - b.hour);

    return {
      totalPlays: this.dataPoints.length,
      scheduledPrizes,
      inventoryPrizes,
      consolations,
      averageProbability,
      inventoryWinRate,
      hourlyStats,
    };
  }

  /**
   * Print summary to terminal
   */
  printSummary(): void {
    const summary = this.generateSummary();

    console.log("\n" + "=".repeat(60));
    console.log("SIMULATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Plays:          ${summary.totalPlays}`);
    console.log(`Scheduled Prizes:     ${summary.scheduledPrizes} (${((summary.scheduledPrizes / summary.totalPlays) * 100).toFixed(1)}%)`);
    console.log(`Inventory Prizes:     ${summary.inventoryPrizes} (${((summary.inventoryPrizes / summary.totalPlays) * 100).toFixed(1)}%)`);
    console.log(`Consolations:         ${summary.consolations} (${((summary.consolations / summary.totalPlays) * 100).toFixed(1)}%)`);
    console.log(`Inventory Win Rate:   ${(summary.inventoryWinRate * 100).toFixed(1)}%`);
    console.log("=".repeat(60));
    console.log("\nHourly Breakdown:");
    console.log("-".repeat(60));
    console.log("Hour | Visitors | Total Prizes | Inventory");
    console.log("-".repeat(60));

    for (const stats of summary.hourlyStats) {
      console.log(
        `${String(stats.hour).padStart(4)} | ${String(stats.visitors).padStart(8)} | ${String(stats.prizes).padStart(12)} | ${String(stats.inventoryPrizes).padStart(9)}`
      );
    }
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Generate CSV export
   */
  generateCSV(outputPath: string): void {
    const headers = [
      "Timestamp",
      "PrizeType",
      "PrizeId",
      "Probability",
      "InventoryGiven",
      "InventoryRemaining",
      "VisitorCount",
    ].join(",");

    const rows = this.dataPoints.map((point) => {
      return [
        point.timestamp.toISOString(),
        point.prizeType,
        point.prizeId,
        point.probability !== undefined ? (point.probability * 100).toFixed(2) + "%" : "N/A",
        point.inventoryGiven,
        point.inventoryRemaining,
        point.visitorCount,
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, csv, "utf8");
    console.log(`CSV report saved to: ${outputPath}`);
  }

  /**
   * Generate HTML report with Chart.js visualizations
   */
  generateHTMLReport(outputPath: string, templatePath: string, targetInventory?: number): void {
    // Read template
    const template = fs.readFileSync(templatePath, "utf8");

    // Prepare chart data
    const chartData = this.prepareChartData(targetInventory);

    // Inject data into template
    const html = template.replace(
      "/* CHART_DATA_PLACEHOLDER */",
      `const chartData = ${JSON.stringify(chartData, null, 2)};`
    );

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html, "utf8");
    console.log(`HTML report saved to: ${outputPath}`);
  }

  /**
   * Prepare data for Chart.js visualizations
   */
  private prepareChartData(targetInventory?: number): any {
    const summary = this.generateSummary();

    // Cumulative inventory data aggregated by 15-minute intervals
    const cumulativeInventory: Array<{ time: string; actual: number; ideal: number }> = [];
    let inventoryCount = 0;
    // Use target inventory (200) if provided, otherwise fall back to actual distributed amount
    const totalInventory = targetInventory ?? summary.inventoryPrizes;
    const totalTime = this.dataPoints.length;

    // Group data points by 15-minute intervals
    const intervalMap = new Map<string, { actual: number; ideal: number; lastIndex: number }>();

    this.dataPoints.forEach((point, index) => {
      if (point.prizeType === "inventory") {
        inventoryCount++;
      }
      const idealCount = (totalInventory * (index + 1)) / totalTime;

      // Round down to nearest 15-minute interval
      const date = point.timestamp;
      const hour = date.getHours();
      const minute = Math.floor(date.getMinutes() / 15) * 15;
      const intervalKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // Keep the latest values for each interval
      intervalMap.set(intervalKey, {
        actual: inventoryCount,
        ideal: Math.round(idealCount),
        lastIndex: index,
      });
    });

    // Convert to array sorted by time
    const sampledCumulative = Array.from(intervalMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, data]) => ({
        time,
        actual: data.actual,
        ideal: data.ideal,
      }));

    // Win probability over time
    const probabilityData = this.dataPoints
      .filter((p) => p.prizeType === "inventory" && p.probability !== undefined)
      .map((p) => ({
        time: p.timestamp.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
        probability: (p.probability! * 100).toFixed(1),
      }));

    // Sample probability data
    const sampledProbability = probabilityData.filter((_, i) => i % 5 === 0);

    // Prize type breakdown over time
    const prizeBreakdown: Array<{ time: string; scheduled: number; inventory: number; consolation: number }> = [];
    let scheduledCountBreakdown = 0;
    let inventoryCountBreakdown = 0;
    let consolationCountBreakdown = 0;

    this.dataPoints.forEach((point, index) => {
      if (point.prizeType === "scheduled") scheduledCountBreakdown++;
      if (point.prizeType === "inventory") inventoryCountBreakdown++;
      if (point.prizeType === "consolation") consolationCountBreakdown++;

      if (index % 10 === 0) {
        prizeBreakdown.push({
          time: point.timestamp.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
          scheduled: scheduledCountBreakdown,
          inventory: inventoryCountBreakdown,
          consolation: consolationCountBreakdown,
        });
      }
    });

    // Hourly traffic vs. awards
    const hourlyData = summary.hourlyStats.map((stats) => ({
      hour: `${stats.hour}:00`,
      visitors: stats.visitors,
      prizes: stats.prizes,
      inventoryPrizes: stats.inventoryPrizes,
    }));

    // Scheduled prizes data (for scatter plot at y=0)
    const scheduledPrizes = this.dataPoints
      .filter((p) => p.prizeType === "scheduled")
      .map((p) => ({
        time: p.timestamp.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
        y: 0,
      }));

    return {
      summary,
      cumulativeInventory: sampledCumulative,
      probabilityData: sampledProbability,
      prizeBreakdown,
      hourlyData,
      scheduledPrizes,
    };
  }
}
