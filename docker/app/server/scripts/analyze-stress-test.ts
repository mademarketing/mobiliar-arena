/**
 * Analyze stress test results from CSV metrics file
 *
 * Usage: npm run analyze-stress-test -- <path-to-metrics.csv>
 */

import * as fs from 'fs';
import * as path from 'path';

interface MetricRow {
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

interface AnalysisResult {
  duration: {
    totalHours: number;
    totalMinutes: number;
    totalSeconds: number;
  };
  plays: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    playsPerMinute: number;
    playsPerHour: number;
  };
  memory: {
    initial: number;
    final: number;
    min: number;
    max: number;
    average: number;
    growth: number;
    growthPercent: number;
    trend: 'stable' | 'growing' | 'critical';
  };
  performance: {
    avgEventLoopDelay: number;
    maxEventLoopDelay: number;
    minEventLoopDelay: number;
    p95EventLoopDelay: number;
    p99EventLoopDelay: number;
  };
  stability: {
    memoryStable: boolean;
    performanceStable: boolean;
    noErrors: boolean;
    overallStable: boolean;
  };
}

class StressTestAnalyzer {
  private metricsFile: string;
  private metrics: MetricRow[] = [];

  constructor(metricsFile: string) {
    this.metricsFile = metricsFile;
  }

  /**
   * Loads and parses CSV metrics file
   */
  private loadMetrics(): void {
    if (!fs.existsSync(this.metricsFile)) {
      throw new Error(`Metrics file not found: ${this.metricsFile}`);
    }

    const content = fs.readFileSync(this.metricsFile, 'utf-8');
    const lines = content.trim().split('\n');

    // Skip header row
    const dataLines = lines.slice(1);

    this.metrics = dataLines.map((line) => {
      const parts = line.split(',');
      return {
        timestamp: parseInt(parts[0], 10),
        playCount: parseInt(parts[1], 10),
        memoryUsageMB: parseFloat(parts[2]),
        heapTotalMB: parseFloat(parts[3]),
        externalMB: parseFloat(parts[4]),
        eventLoopDelayMs: parseFloat(parts[5]),
        uptime: parseFloat(parts[6]),
        errors: parseInt(parts[7], 10),
        successfulPlays: parseInt(parts[8], 10),
      };
    });

    console.log(`✅ Loaded ${this.metrics.length} metric snapshots`);
  }

  /**
   * Calculates percentile value
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Analyzes metrics and generates report
   */
  analyze(): AnalysisResult {
    this.loadMetrics();

    if (this.metrics.length === 0) {
      throw new Error('No metrics to analyze');
    }

    const first = this.metrics[0];
    const last = this.metrics[this.metrics.length - 1];

    // Duration analysis
    const durationSeconds = last.uptime;
    const durationMinutes = durationSeconds / 60;
    const durationHours = durationMinutes / 60;

    // Plays analysis
    const totalPlays = last.playCount;
    const successfulPlays = last.successfulPlays;
    const failedPlays = last.errors;
    const successRate = (successfulPlays / totalPlays) * 100;
    const playsPerMinute = totalPlays / durationMinutes;
    const playsPerHour = totalPlays / durationHours;

    // Memory analysis
    const memoryValues = this.metrics.map((m) => m.memoryUsageMB);
    const initialMemory = first.memoryUsageMB;
    const finalMemory = last.memoryUsageMB;
    const minMemory = Math.min(...memoryValues);
    const maxMemory = Math.max(...memoryValues);
    const avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthPercent = (memoryGrowth / initialMemory) * 100;

    // Determine memory trend
    let memoryTrend: 'stable' | 'growing' | 'critical' = 'stable';
    if (memoryGrowth > 100) {
      memoryTrend = 'critical';
    } else if (memoryGrowth > 50) {
      memoryTrend = 'growing';
    }

    // Performance analysis
    const eventLoopDelays = this.metrics.map((m) => m.eventLoopDelayMs);
    const avgEventLoopDelay = eventLoopDelays.reduce((a, b) => a + b, 0) / eventLoopDelays.length;
    const maxEventLoopDelay = Math.max(...eventLoopDelays);
    const minEventLoopDelay = Math.min(...eventLoopDelays);
    const p95EventLoopDelay = this.percentile(eventLoopDelays, 95);
    const p99EventLoopDelay = this.percentile(eventLoopDelays, 99);

    // Stability analysis
    const memoryStable = memoryGrowth < 100;
    const performanceStable = avgEventLoopDelay < 100;
    const noErrors = failedPlays < totalPlays * 0.01; // <1% error rate
    const overallStable = memoryStable && performanceStable && noErrors;

    return {
      duration: {
        totalHours: durationHours,
        totalMinutes: durationMinutes,
        totalSeconds: durationSeconds,
      },
      plays: {
        total: totalPlays,
        successful: successfulPlays,
        failed: failedPlays,
        successRate,
        playsPerMinute,
        playsPerHour,
      },
      memory: {
        initial: initialMemory,
        final: finalMemory,
        min: minMemory,
        max: maxMemory,
        average: avgMemory,
        growth: memoryGrowth,
        growthPercent: memoryGrowthPercent,
        trend: memoryTrend,
      },
      performance: {
        avgEventLoopDelay,
        maxEventLoopDelay,
        minEventLoopDelay,
        p95EventLoopDelay,
        p99EventLoopDelay,
      },
      stability: {
        memoryStable,
        performanceStable,
        noErrors,
        overallStable,
      },
    };
  }

  /**
   * Displays analysis results
   */
  displayResults(result: AnalysisResult): void {
    const memoryIcon = result.stability.memoryStable ? '✅' : '❌';
    const perfIcon = result.stability.performanceStable ? '✅' : '❌';
    const errorIcon = result.stability.noErrors ? '✅' : '❌';
    const overallIcon = result.stability.overallStable ? '✅' : '❌';

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STRESS TEST ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: ${path.basename(this.metricsFile)}
Snapshots: ${this.metrics.length}

⏱️  DURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${result.duration.totalHours.toFixed(2)} hours (${result.duration.totalMinutes.toFixed(0)} minutes)

🎮 PLAYS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${result.plays.total.toLocaleString()}
Successful: ${result.plays.successful.toLocaleString()} (${result.plays.successRate.toFixed(2)}%)
Failed: ${result.plays.failed.toLocaleString()}
Throughput: ${result.plays.playsPerMinute.toFixed(2)} plays/min (${result.plays.playsPerHour.toFixed(0)} plays/hour)

💾 MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initial: ${result.memory.initial.toFixed(2)} MB
Final: ${result.memory.final.toFixed(2)} MB
Min: ${result.memory.min.toFixed(2)} MB
Max: ${result.memory.max.toFixed(2)} MB
Average: ${result.memory.average.toFixed(2)} MB

Growth: ${result.memory.growth.toFixed(2)} MB (${result.memory.growthPercent.toFixed(1)}%)
Trend: ${result.memory.trend.toUpperCase()}

⚡ PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event Loop Delay:
  Average: ${result.performance.avgEventLoopDelay.toFixed(2)} ms
  Min: ${result.performance.minEventLoopDelay.toFixed(2)} ms
  Max: ${result.performance.maxEventLoopDelay.toFixed(2)} ms
  P95: ${result.performance.p95EventLoopDelay.toFixed(2)} ms
  P99: ${result.performance.p99EventLoopDelay.toFixed(2)} ms

🔍 STABILITY CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${memoryIcon} Memory Stable: ${result.stability.memoryStable ? 'PASS' : 'FAIL'} (growth <100 MB)
${perfIcon} Performance Stable: ${result.stability.performanceStable ? 'PASS' : 'FAIL'} (avg delay <100 ms)
${errorIcon} Error Rate Acceptable: ${result.stability.noErrors ? 'PASS' : 'FAIL'} (errors <1%)

🎯 OVERALL VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${overallIcon} ${result.stability.overallStable ? 'PASS - System is production ready' : 'FAIL - Issues detected, see above'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Recommendations
    if (!result.stability.overallStable) {
      console.log('\n⚠️  RECOMMENDATIONS:\n');

      if (!result.stability.memoryStable) {
        console.log(`- Memory grew by ${result.memory.growth.toFixed(2)} MB - investigate memory leaks`);
        console.log('  • Check for uncleared timers/intervals');
        console.log('  • Review particle emitter cleanup');
        console.log('  • Verify Socket.io event listener cleanup');
      }

      if (!result.stability.performanceStable) {
        console.log(`- Event loop delay averaged ${result.performance.avgEventLoopDelay.toFixed(2)} ms - investigate blocking operations`);
        console.log('  • Review synchronous database operations');
        console.log('  • Check animation timing code');
        console.log('  • Consider optimizing prize distribution algorithm');
      }

      if (!result.stability.noErrors) {
        console.log(`- Error rate: ${((result.plays.failed / result.plays.total) * 100).toFixed(2)}% - investigate error causes`);
        console.log('  • Review server logs');
        console.log('  • Check database connection stability');
        console.log('  • Verify Socket.io error handling');
      }

      console.log('');
    }
  }

  /**
   * Exports analysis to JSON file
   */
  exportJSON(result: AnalysisResult, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 Analysis exported to: ${outputPath}\n`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: npm run analyze-stress-test -- <path-to-metrics.csv>');
  console.error('\nExample:');
  console.error('  npm run analyze-stress-test -- stress-test-results/stress-test-metrics-2025-11-14.csv');
  process.exit(1);
}

const metricsFile = args[0];
const analyzer = new StressTestAnalyzer(metricsFile);

try {
  const result = analyzer.analyze();
  analyzer.displayResults(result);

  // Export to JSON
  const jsonPath = metricsFile.replace('.csv', '-analysis.json');
  analyzer.exportJSON(result, jsonPath);

  process.exit(result.stability.overallStable ? 0 : 1);
} catch (error) {
  console.error('\n❌ Analysis failed:', error);
  process.exit(1);
}
