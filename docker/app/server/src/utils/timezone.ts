/**
 * Timezone utilities for Swiss timezone (Europe/Zurich)
 * Ensures consistent date/time handling across the application
 *
 * IMPORTANT: All prize logic must use Swiss timezone to ensure:
 * - Opening hours (10:00-20:00) are in Swiss time
 * - Scheduled prizes trigger at correct Swiss local time
 * - Date boundaries match Swiss calendar (not UTC)
 */

/**
 * Get current date in YYYY-MM-DD format using Swiss timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getSwissDate(date: Date = new Date()): string {
  // Convert to Swiss timezone (Europe/Zurich)
  // Using en-CA locale which formats dates as YYYY-MM-DD
  const swissDateStr = date.toLocaleString("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return swissDateStr;
}

/**
 * Get current time in Swiss timezone
 * Returns a Date object representing the current Swiss local time
 *
 * Note: The returned Date object's internal UTC value is adjusted so that
 * calling getHours(), getMinutes(), etc. will return Swiss local time values.
 *
 * @returns Date object adjusted to Swiss timezone
 */
export function getSwissTime(date: Date = new Date()): Date {
  // Extract date/time components in Swiss timezone using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || "0";

  // Build date string in format that Date constructor can parse
  // YYYY-MM-DD HH:mm:ss
  const dateStr = `${getValue("year")}-${getValue("month")}-${getValue("day")} ${getValue("hour")}:${getValue("minute")}:${getValue("second")}`;

  return new Date(dateStr);
}

/**
 * Get Swiss time components (hour, minute) from a Date
 * @param date Date object to extract Swiss time from
 * @returns Object with hour (0-23) and minute (0-59) in Swiss timezone
 */
export function getSwissTimeComponents(date: Date = new Date()): { hour: number; minute: number } {
  const swissDate = getSwissTime(date);
  return {
    hour: swissDate.getHours(),
    minute: swissDate.getMinutes(),
  };
}

/**
 * Check if current time is within operating hours (Swiss timezone)
 * @param date Date to check (defaults to now)
 * @param openTime Opening time in HH:mm format (e.g., "10:00")
 * @param closeTime Closing time in HH:mm format (e.g., "20:00")
 * @returns true if within operating hours
 */
export function isWithinOperatingHours(
  openTime: string,
  closeTime: string,
  date: Date = new Date()
): boolean {
  const { hour, minute } = getSwissTimeComponents(date);
  const currentMinutes = hour * 60 + minute;

  const [openHour, openMin] = openTime.split(":").map(Number);
  const openMinutes = openHour * 60 + openMin;

  const [closeHour, closeMin] = closeTime.split(":").map(Number);
  const closeMinutes = closeHour * 60 + closeMin;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get current timestamp in ISO format
 * @returns ISO timestamp string (UTC)
 */
export function getSwissTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}
