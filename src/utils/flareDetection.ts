/**
 * Flare Pattern Detection Utility
 * 
 * Simple, deterministic algorithm for detecting pain flares based on consecutive days
 * with elevated pain scores. Designed for medical and SSDI documentation review.
 * 
 * Definition: A flare is painScore >= 6 for 3 consecutive calendar days.
 */

export interface DailyPainEntry {
  date: string; // YYYY-MM-DD format
  painScore: number; // 0-10 scale
}

export interface Flare {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  durationDays: number; // Number of consecutive days in the flare
  peakPain: number; // Highest pain score during the flare
}

/**
 * Detects flares from daily pain entries
 * 
 * Algorithm:
 * 1. Group entries by date, using the highest painScore for each day
 * 2. Sort entries by date ascending
 * 3. Track consecutive days with painScore >= 6
 * 4. When streak reaches 3 days, start a flare
 * 5. Continue flare while streak continues
 * 6. Close flare when streak breaks (painScore < 6)
 * 
 * @param entries Array of daily pain entries (may have multiple entries per day)
 * @returns Array of detected flares, sorted by start date
 */
export function detectFlares(entries: DailyPainEntry[]): Flare[] {
  if (entries.length === 0) {
    return [];
  }

  // Step 1: Group by date and use highest painScore for each day
  // This handles cases where multiple entries exist for the same day
  const dailyMaxScores = new Map<string, number>();
  
  for (const entry of entries) {
    const existing = dailyMaxScores.get(entry.date);
    if (existing === undefined || entry.painScore > existing) {
      dailyMaxScores.set(entry.date, entry.painScore);
    }
  }

  // Step 2: Convert to array and sort by date ascending
  const sortedEntries: DailyPainEntry[] = Array.from(dailyMaxScores.entries())
    .map(([date, painScore]) => ({ date, painScore }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const flares: Flare[] = [];
  const PAIN_THRESHOLD = 6;
  const MIN_FLARE_DAYS = 3;

  let currentStreakStart: string | null = null;
  let currentStreakDays = 0;
  let currentPeakPain = 0;

  // Step 3: Process entries sequentially to detect consecutive day patterns
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const isAboveThreshold = entry.painScore >= PAIN_THRESHOLD;

    if (isAboveThreshold) {
      // Check if this is a continuation of the previous day
      const isConsecutive = currentStreakStart !== null && 
        isConsecutiveDay(sortedEntries[i - 1]?.date, entry.date);

      if (isConsecutive) {
        // Continue existing streak
        currentStreakDays++;
        currentPeakPain = Math.max(currentPeakPain, entry.painScore);
      } else {
        // Start new streak
        currentStreakStart = entry.date;
        currentStreakDays = 1;
        currentPeakPain = entry.painScore;
      }

      // Step 4: If streak reaches minimum days, ensure flare is open
      // (Flare is already open if we're continuing a streak)
      if (currentStreakDays >= MIN_FLARE_DAYS && currentStreakStart !== null) {
        // Flare is active - will be closed when streak breaks
      }
    } else {
      // Step 5: Streak broken - close flare if one was active
      if (currentStreakStart !== null && currentStreakDays >= MIN_FLARE_DAYS) {
        // Calculate end date (last day of the streak, which is the previous entry)
        const endDate = sortedEntries[i - 1].date;
        
        flares.push({
          startDate: currentStreakStart,
          endDate: endDate,
          durationDays: currentStreakDays,
          peakPain: currentPeakPain,
        });
      }

      // Reset streak tracking
      currentStreakStart = null;
      currentStreakDays = 0;
      currentPeakPain = 0;
    }
  }

  // Step 6: Handle case where flare extends to the last entry
  // If we end with an active streak, close the flare
  if (currentStreakStart !== null && currentStreakDays >= MIN_FLARE_DAYS) {
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    flares.push({
      startDate: currentStreakStart,
      endDate: lastEntry.date,
      durationDays: currentStreakDays,
      peakPain: currentPeakPain,
    });
  }

  return flares;
}

/**
 * Checks if two dates are consecutive calendar days
 * 
 * @param date1 First date in YYYY-MM-DD format (may be undefined)
 * @param date2 Second date in YYYY-MM-DD format
 * @returns true if date2 is exactly one day after date1
 */
function isConsecutiveDay(date1: string | undefined, date2: string): boolean {
  if (!date1) {
    return false;
  }

  // Parse dates and calculate difference
  // Using simple string manipulation to avoid external dependencies
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) {
    return false;
  }

  // Calculate days difference
  const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  
  return diffDays === 1;
}

/**
 * Parses a date string in YYYY-MM-DD format to a Date object
 * 
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
function parseDate(dateStr: string): Date | null {
  // Validate format: YYYY-MM-DD
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(datePattern);
  
  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(match[3], 10);

  const date = new Date(year, month, day);
  
  // Verify the date is valid (handles cases like 2024-02-30)
  if (date.getFullYear() !== year || 
      date.getMonth() !== month || 
      date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Flare summary statistics
 */
export interface FlareSummary {
  totalFlares: number;
  averageDuration: number;
  totalDaysInFlare: number;
  flaresPerMonth: number;
  peakPainAverage: number;
  longestFlare: Flare | null;
  recentFlares: Flare[]; // Last 5 flares
}

/**
 * Calculate comprehensive flare summary statistics
 * 
 * @param flares Array of detected flares
 * @param dateRange Optional date range for calculating flares per month
 * @returns Summary statistics about flares
 */
export function calculateFlareSummary(
  flares: Flare[],
  dateRange?: { start: string; end: string }
): FlareSummary {
  if (flares.length === 0) {
    return {
      totalFlares: 0,
      averageDuration: 0,
      totalDaysInFlare: 0,
      flaresPerMonth: 0,
      peakPainAverage: 0,
      longestFlare: null,
      recentFlares: [],
    };
  }

  // Calculate total days in flare
  const totalDaysInFlare = flares.reduce((sum, flare) => sum + flare.durationDays, 0);

  // Calculate average duration
  const averageDuration = totalDaysInFlare / flares.length;

  // Calculate average peak pain
  const peakPainAverage = flares.reduce((sum, flare) => sum + flare.peakPain, 0) / flares.length;

  // Find longest flare
  const longestFlare = flares.reduce((longest, current) => 
    current.durationDays > longest.durationDays ? current : longest
  );

  // Get recent flares (last 5, sorted by end date descending)
  const recentFlares = [...flares]
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, 5);

  // Calculate flares per month
  let flaresPerMonth = 0;
  if (dateRange) {
    const startDate = parseDate(dateRange.start);
    const endDate = parseDate(dateRange.end);
    
    if (startDate && endDate) {
      const months = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      flaresPerMonth = months > 0 ? flares.length / months : 0;
    }
  } else {
    // Use first and last flare dates to calculate range
    const sortedFlares = [...flares].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const firstDate = parseDate(sortedFlares[0].startDate);
    const lastDate = parseDate(sortedFlares[sortedFlares.length - 1].endDate);
    
    if (firstDate && lastDate) {
      const months = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      flaresPerMonth = months > 0 ? flares.length / months : 0;
    }
  }

  return {
    totalFlares: flares.length,
    averageDuration,
    totalDaysInFlare,
    flaresPerMonth,
    peakPainAverage,
    longestFlare,
    recentFlares,
  };
}

