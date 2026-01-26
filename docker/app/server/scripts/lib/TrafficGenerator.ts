/**
 * Traffic Generator
 *
 * Generates visitor arrival timestamps using different traffic patterns:
 * - Poisson distribution: Random arrivals at constant average rate
 * - Peak hours: Variable traffic with lunch and afternoon peaks
 */

export type TrafficProfile = "poisson" | "peak";

export interface PeakHoursConfig {
  baseline: number; // 10:00-12:00 and 18:00-20:00
  lunchPeak: number; // 12:00-13:30
  postLunch: number; // 13:30-16:00
  afternoonPeak: number; // 16:00-18:00
}

export class TrafficGenerator {
  private defaultPeakConfig: PeakHoursConfig = {
    baseline: 70,
    lunchPeak: 130,
    postLunch: 80,
    afternoonPeak: 130,
  };

  /**
   * Generate visitor arrival timestamps for a full day
   *
   * @param date Date in YYYY-MM-DD format
   * @param profile Traffic pattern to use
   * @param baseRate Average visitors per hour (for Poisson profile)
   * @param openTime Opening time in HH:MM format (default: "10:00")
   * @param closeTime Closing time in HH:MM format (default: "20:00")
   * @returns Sorted array of visitor arrival timestamps
   */
  generateVisitorTimestamps(
    date: string,
    profile: TrafficProfile,
    baseRate: number = 100,
    openTime: string = "10:00",
    closeTime: string = "20:00"
  ): Date[] {
    const openDateTime = this.parseDateTime(date, openTime);
    const closeDateTime = this.parseDateTime(date, closeTime);

    if (profile === "poisson") {
      return this.generatePoissonArrivals(
        openDateTime,
        closeDateTime,
        baseRate
      );
    } else {
      return this.generatePeakHoursArrivals(
        openDateTime,
        closeDateTime,
        this.defaultPeakConfig
      );
    }
  }

  /**
   * Generate arrivals using Poisson distribution (constant rate)
   *
   * Uses exponential inter-arrival times: time = -ln(random) / rate
   */
  private generatePoissonArrivals(
    start: Date,
    end: Date,
    rate: number
  ): Date[] {
    const arrivals: Date[] = [];
    const ratePerSecond = rate / 3600; // Convert hourly rate to per-second

    let currentTime = new Date(start);

    while (currentTime < end) {
      // Generate exponential inter-arrival time
      const random = Math.random();
      const interArrivalSeconds = -Math.log(random) / ratePerSecond;

      currentTime = new Date(currentTime.getTime() + interArrivalSeconds * 1000);

      if (currentTime < end) {
        arrivals.push(new Date(currentTime));
      }
    }

    return arrivals;
  }

  /**
   * Generate arrivals using peak hours profile with variable rates
   */
  private generatePeakHoursArrivals(
    start: Date,
    end: Date,
    config: PeakHoursConfig
  ): Date[] {
    const arrivals: Date[] = [];

    // Define time windows with their rates
    const windows = this.defineTimeWindows(start, config);

    // Generate Poisson arrivals within each window
    for (const window of windows) {
      const windowArrivals = this.generatePoissonArrivals(
        window.start,
        window.end,
        window.rate
      );
      arrivals.push(...windowArrivals);
    }

    // Sort by timestamp
    arrivals.sort((a, b) => a.getTime() - b.getTime());

    return arrivals;
  }

  /**
   * Define time windows for peak hours profile
   */
  private defineTimeWindows(
    start: Date,
    config: PeakHoursConfig
  ): Array<{ start: Date; end: Date; rate: number }> {
    const windows: Array<{ start: Date; end: Date; rate: number }> = [];

    const baseDate = start.toISOString().split("T")[0];

    // 10:00-12:00: Baseline (70/hr)
    windows.push({
      start: this.parseDateTime(baseDate, "10:00"),
      end: this.parseDateTime(baseDate, "12:00"),
      rate: config.baseline,
    });

    // 12:00-13:30: Lunch peak (130/hr)
    windows.push({
      start: this.parseDateTime(baseDate, "12:00"),
      end: this.parseDateTime(baseDate, "13:30"),
      rate: config.lunchPeak,
    });

    // 13:30-16:00: Post-lunch (80/hr)
    windows.push({
      start: this.parseDateTime(baseDate, "13:30"),
      end: this.parseDateTime(baseDate, "16:00"),
      rate: config.postLunch,
    });

    // 16:00-18:00: Afternoon peak (130/hr)
    windows.push({
      start: this.parseDateTime(baseDate, "16:00"),
      end: this.parseDateTime(baseDate, "18:00"),
      rate: config.afternoonPeak,
    });

    // 18:00-20:00: Evening baseline (75/hr)
    windows.push({
      start: this.parseDateTime(baseDate, "18:00"),
      end: this.parseDateTime(baseDate, "20:00"),
      rate: 75,
    });

    return windows;
  }

  /**
   * Calculate expected visitor count for a given hour
   */
  getExpectedVisitorsForHour(
    hour: number,
    profile: TrafficProfile,
    baseRate: number = 100
  ): number {
    if (profile === "poisson") {
      return baseRate;
    }

    // Peak hours profile
    const config = this.defaultPeakConfig;

    if (hour >= 10 && hour < 12) return config.baseline;
    if (hour >= 12 && hour < 14) return config.lunchPeak;
    if (hour >= 14 && hour < 16) return config.postLunch;
    if (hour >= 16 && hour < 18) return config.afternoonPeak;
    if (hour >= 18 && hour < 20) return 75;

    return 0; // Outside operating hours
  }

  /**
   * Parse date and time into Date object
   * Creates date in local timezone to match operating hours
   */
  private parseDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    // Parse date parts to avoid timezone issues
    const [year, month, day] = date.split("-").map(Number);
    // Create date in local timezone
    const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return dateTime;
  }
}
