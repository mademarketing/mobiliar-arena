/**
 * Simulation Test Suite
 *
 * Tests for traffic generation and simulation accuracy
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TrafficGenerator } from "./scripts/lib/TrafficGenerator";
import { SimulationReporter } from "./scripts/lib/SimulationReporter";

describe("TrafficGenerator", () => {
  let generator: TrafficGenerator;

  beforeEach(() => {
    generator = new TrafficGenerator();
  });

  it("should generate visitors using Poisson distribution", () => {
    const date = "2025-11-24";
    const visitors = generator.generateVisitorTimestamps(
      date,
      "poisson",
      100,
      "10:00",
      "20:00"
    );

    // Should generate visitors
    expect(visitors.length).toBeGreaterThan(0);

    // All visitors should be within operating hours
    for (const visitor of visitors) {
      const hour = visitor.getHours();
      expect(hour).toBeGreaterThanOrEqual(10);
      expect(hour).toBeLessThan(20);
    }

    // Should be sorted
    for (let i = 1; i < visitors.length; i++) {
      expect(visitors[i].getTime()).toBeGreaterThanOrEqual(
        visitors[i - 1].getTime()
      );
    }
  });

  it("should generate approximately correct average rate for Poisson", () => {
    const date = "2025-11-24";
    const baseRate = 100;
    const operatingHours = 10; // 10:00 to 20:00
    const expectedTotal = baseRate * operatingHours;

    const visitors = generator.generateVisitorTimestamps(
      date,
      "poisson",
      baseRate,
      "10:00",
      "20:00"
    );

    // Allow ±15% tolerance for randomness
    const lowerBound = expectedTotal * 0.85;
    const upperBound = expectedTotal * 1.15;

    expect(visitors.length).toBeGreaterThanOrEqual(lowerBound);
    expect(visitors.length).toBeLessThanOrEqual(upperBound);
  });

  it("should generate peak hours profile with higher traffic during peaks", () => {
    const date = "2025-11-24";
    const visitors = generator.generateVisitorTimestamps(
      date,
      "peak",
      100, // Base rate (not used for peak profile)
      "10:00",
      "20:00"
    );

    // Count visitors per hour
    const hourCounts = new Map<number, number>();
    for (const visitor of visitors) {
      const hour = visitor.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Lunch peak (12:00-13:30) should have more visitors than baseline (10:00-12:00)
    const lunchCount =
      (hourCounts.get(12) || 0) + (hourCounts.get(13) || 0);
    const baselineCount =
      (hourCounts.get(10) || 0) + (hourCounts.get(11) || 0);

    // Lunch peak should have noticeably more traffic
    expect(lunchCount).toBeGreaterThan(baselineCount * 0.9);

    // Afternoon peak (16:00-18:00) should have more visitors
    const afternoonCount =
      (hourCounts.get(16) || 0) + (hourCounts.get(17) || 0);
    expect(afternoonCount).toBeGreaterThan(baselineCount * 0.9);
  });

  it("should respect operating hours", () => {
    const date = "2025-11-24";
    const visitors = generator.generateVisitorTimestamps(
      date,
      "poisson",
      100,
      "10:00",
      "20:00"
    );

    // No visitors before 10:00 or after 20:00
    for (const visitor of visitors) {
      const hour = visitor.getHours();
      expect(hour).toBeGreaterThanOrEqual(10);
      expect(hour).toBeLessThan(20);
    }
  });

  it("should calculate expected visitors for hour correctly", () => {
    // Poisson profile
    expect(generator.getExpectedVisitorsForHour(12, "poisson", 100)).toBe(100);
    expect(generator.getExpectedVisitorsForHour(15, "poisson", 150)).toBe(150);

    // Peak profile
    expect(generator.getExpectedVisitorsForHour(11, "peak", 100)).toBe(70); // Baseline
    expect(generator.getExpectedVisitorsForHour(12, "peak", 100)).toBe(130); // Lunch peak
    expect(generator.getExpectedVisitorsForHour(15, "peak", 100)).toBe(80); // Post-lunch
    expect(generator.getExpectedVisitorsForHour(17, "peak", 100)).toBe(130); // Afternoon peak
    expect(generator.getExpectedVisitorsForHour(9, "peak", 100)).toBe(0); // Outside hours
  });
});

describe("SimulationReporter", () => {
  let reporter: SimulationReporter;

  beforeEach(() => {
    reporter = new SimulationReporter();
  });

  it("should collect data points", () => {
    reporter.addDataPoint({
      timestamp: new Date("2025-11-24T10:00:00"),
      prizeType: "inventory",
      prizeId: "prize-a",
      probability: 0.2,
      inventoryGiven: 1,
      inventoryRemaining: 199,
      visitorCount: 1,
    });

    reporter.addDataPoint({
      timestamp: new Date("2025-11-24T10:05:00"),
      prizeType: "consolation",
      prizeId: "consolation",
      inventoryGiven: 1,
      inventoryRemaining: 199,
      visitorCount: 2,
    });

    const summary = reporter.generateSummary();
    expect(summary.totalPlays).toBe(2);
    expect(summary.inventoryPrizes).toBe(1);
    expect(summary.consolations).toBe(1);
  });

  it("should calculate summary statistics correctly", () => {
    // Add mixed prize types
    for (let i = 0; i < 100; i++) {
      const prizeType =
        i < 20 ? "inventory" : i < 22 ? "scheduled" : "consolation";
      reporter.addDataPoint({
        timestamp: new Date(`2025-11-24T${10 + Math.floor(i / 10)}:00:00`),
        prizeType: prizeType as any,
        prizeId: prizeType === "inventory" ? "prize-a" : prizeType,
        probability: prizeType === "inventory" ? 0.25 : undefined,
        inventoryGiven: prizeType === "inventory" ? Math.floor(i / 5) : 0,
        inventoryRemaining: 200 - Math.floor(i / 5),
        visitorCount: i + 1,
      });
    }

    const summary = reporter.generateSummary();
    expect(summary.totalPlays).toBe(100);
    expect(summary.inventoryPrizes).toBe(20);
    expect(summary.scheduledPrizes).toBe(2);
    expect(summary.consolations).toBe(78);
    expect(summary.inventoryWinRate).toBeCloseTo(0.2, 2);
  });

  it("should generate hourly statistics", () => {
    // Add data across multiple hours
    for (let hour = 10; hour < 15; hour++) {
      for (let i = 0; i < 10; i++) {
        reporter.addDataPoint({
          timestamp: new Date(`2025-11-24T${hour}:${i * 5}:00`),
          prizeType: "consolation",
          prizeId: "consolation",
          inventoryGiven: 0,
          inventoryRemaining: 200,
          visitorCount: (hour - 10) * 10 + i + 1,
        });
      }
    }

    const summary = reporter.generateSummary();
    expect(summary.hourlyStats.length).toBe(5); // 5 hours (10-14)

    // Each hour should have 10 visitors
    for (const hourStats of summary.hourlyStats) {
      expect(hourStats.visitors).toBe(10);
    }
  });

  it("should clear data correctly", () => {
    reporter.addDataPoint({
      timestamp: new Date("2025-11-24T10:00:00"),
      prizeType: "inventory",
      prizeId: "prize-a",
      inventoryGiven: 1,
      inventoryRemaining: 199,
      visitorCount: 1,
    });

    expect(reporter.generateSummary().totalPlays).toBe(1);

    reporter.clear();
    expect(reporter.generateSummary().totalPlays).toBe(0);
  });
});

describe("Simulation Integration", () => {
  it("should handle full simulation workflow", () => {
    const generator = new TrafficGenerator();
    const reporter = new SimulationReporter();

    // Generate visitors
    const visitors = generator.generateVisitorTimestamps(
      "2025-11-24",
      "poisson",
      100,
      "10:00",
      "12:00" // Short window for faster test
    );

    expect(visitors.length).toBeGreaterThan(0);

    // Simulate plays
    for (let i = 0; i < visitors.length; i++) {
      const prizeType = i % 5 === 0 ? "inventory" : "consolation";
      reporter.addDataPoint({
        timestamp: visitors[i],
        prizeType: prizeType as any,
        prizeId: prizeType === "inventory" ? "prize-a" : "consolation",
        probability: prizeType === "inventory" ? 0.2 : undefined,
        inventoryGiven: Math.floor(i / 5),
        inventoryRemaining: 200 - Math.floor(i / 5),
        visitorCount: i + 1,
      });
    }

    const summary = reporter.generateSummary();
    expect(summary.totalPlays).toBe(visitors.length);
    expect(summary.inventoryPrizes).toBeGreaterThan(0);
    expect(summary.consolations).toBeGreaterThan(0);
  });
});
