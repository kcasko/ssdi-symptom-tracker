import { format, formatDistanceToNow, parseISO, isValid, startOfDay, endOfDay, differenceInMinutes, differenceInDays, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isWithinInterval } from 'date-fns';

/**
 * SSDI Symptom Tracker - Date Utilities
 * Consistent date handling throughout the app
 */

// Standard date format for storage (ISO 8601)
export const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

// Display formats
export const DISPLAY_DATE = 'MMM d, yyyy';
export const DISPLAY_DATE_SHORT = 'MMM d';
export const DISPLAY_TIME = 'h:mm a';
export const DISPLAY_DATETIME = 'MMM d, yyyy h:mm a';
export const DISPLAY_WEEKDAY = 'EEEE';
export const DISPLAY_MONTH_YEAR = 'MMMM yyyy';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr: string = DISPLAY_DATE): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 1 && mins === 0) return '1 hour';
  if (mins === 0) return `${hours} hours`;
  if (hours === 1) return `1 hour ${mins} minutes`;
  return `${hours} hours ${mins} minutes`;
}

/**
 * Format duration for SSDI narrative (e.g., "approximately 40 minutes")
 */
export function formatDurationForNarrative(minutes: number): string {
  if (minutes < 5) return 'a few minutes';
  if (minutes < 15) return 'approximately 10 minutes';
  if (minutes < 25) return 'approximately 20 minutes';
  if (minutes < 35) return 'approximately 30 minutes';
  if (minutes < 50) return 'approximately 40 minutes';
  if (minutes < 75) return 'approximately 1 hour';
  if (minutes < 105) return 'approximately 1.5 hours';
  if (minutes < 150) return 'approximately 2 hours';
  if (minutes < 210) return 'approximately 3 hours';
  if (minutes < 300) return 'approximately 4 hours';
  
  const hours = Math.round(minutes / 60);
  return `approximately ${hours} hours`;
}

/**
 * Get start and end of today
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * Get date range for the last N days
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(subDays(now, days - 1)),
    end: endOfDay(now),
  };
}

/**
 * Get date range for current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 0 }),
    end: endOfWeek(now, { weekStartsOn: 0 }),
  };
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * Check if a date falls within a range
 */
export function isDateInRange(date: Date | string, start: Date, end: Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isWithinInterval(d, { start, end });
}

/**
 * Check if two dates are the same day
 */
export function isSameDayAs(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  if (!isValid(d1) || !isValid(d2)) return false;
  return isSameDay(d1, d2);
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
  const d1 = typeof start === 'string' ? parseISO(start) : start;
  const d2 = typeof end === 'string' ? parseISO(end) : end;
  if (!isValid(d1) || !isValid(d2)) return 0;
  return differenceInDays(d2, d1);
}

/**
 * Get the number of minutes between two dates
 */
export function getMinutesBetween(start: Date | string, end: Date | string): number {
  const d1 = typeof start === 'string' ? parseISO(start) : start;
  const d2 = typeof end === 'string' ? parseISO(end) : end;
  if (!isValid(d1) || !isValid(d2)) return 0;
  return differenceInMinutes(d2, d1);
}

/**
 * Calculate whole-day delay between an event date and when it was recorded
 */
export function calculateDaysDelayed(eventDate: Date | string, createdAt?: Date | string): number {
  if (!createdAt) return 0;
  
  const event = typeof eventDate === 'string' ? parseISO(eventDate) : eventDate;
  const created = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt;
  
  if (!isValid(event) || !isValid(created)) return 0;
  
  const days = differenceInDays(created, event);
  return days < 0 ? 0 : days;
}

/**
 * Get a human-readable label for how long after the event the log was created
 */
export function getDelayLabel(daysDelayed: number): string {
  if (daysDelayed <= 0) return 'Logged same-day';
  if (daysDelayed === 1) return 'Logged 1 day after event';
  return `Logged ${daysDelayed} days after event`;
}

/**
 * Count inclusive days between two dates
 */
export function countInclusiveDays(start: Date | string, end: Date | string): number {
  const d1 = typeof start === 'string' ? parseISO(start) : start;
  const d2 = typeof end === 'string' ? parseISO(end) : end;
  if (!isValid(d1) || !isValid(d2)) return 0;
  const diff = differenceInDays(d2, d1);
  return diff < 0 ? 0 : diff + 1;
}

export interface GapSegment {
  startDate: string;
  endDate: string;
  lengthDays: number;
}

/**
 * Find gaps between sorted dates (YYYY-MM-DD). Optional range anchors.
 */
export function findDateGaps(
  dateStrings: string[],
  minGapLength: number = 1,
  rangeStart?: string,
  rangeEnd?: string
): GapSegment[] {
  if (!dateStrings || dateStrings.length === 0) return [];

  const uniqueDates = Array.from(new Set(dateStrings)).sort();
  const gaps: GapSegment[] = [];

  let previous = rangeStart ? rangeStart : uniqueDates[0];

  uniqueDates.forEach((current) => {
    const gapLength = Math.max(0, getDaysBetween(previous, current) - 1);
    if (gapLength >= minGapLength) {
      const start = addDays(typeof previous === 'string' ? parseISO(previous) : previous, 1)
        .toISOString()
        .split('T')[0];
      const end = addDays(typeof current === 'string' ? parseISO(current) : current, -1)
        .toISOString()
        .split('T')[0];
      gaps.push({
        startDate: start,
        endDate: end,
        lengthDays: gapLength,
      });
    }
    previous = current;
  });

  if (rangeEnd) {
    const trailingGap = Math.max(0, getDaysBetween(previous, rangeEnd) - 1);
    if (trailingGap >= minGapLength) {
      const start = addDays(typeof previous === 'string' ? parseISO(previous) : previous, 1)
        .toISOString()
        .split('T')[0];
      const end = rangeEnd;
      gaps.push({
        startDate: start,
        endDate: end,
        lengthDays: trailingGap,
      });
    }
  }

  return gaps;
}

/**
 * Parse an ISO date string
 */
export function parseDate(dateStr: string): Date | null {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Get current timestamp as ISO string
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get start of day as ISO string
 */
export function todayStart(): string {
  return startOfDay(new Date()).toISOString();
}

/**
 * Get end of day as ISO string
 */
export function todayEnd(): string {
  return endOfDay(new Date()).toISOString();
}

export { addDays, subDays, startOfDay, endOfDay, parseISO, isValid };
