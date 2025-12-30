/**
 * Consistency Rules
 * Business rules for evaluating pattern consistency and reliability
 */

import { DailyLog } from '../models/DailyLog';
import { ActivityLog } from '../models/ActivityLog';
import { Limitation, LimitationFrequency } from '../models/Limitation';
import { isSameDayAs, getDaysBetween } from '../../utils/dates';

/**
 * Calculate logging consistency (percentage of days with logs)
 */
export function calculateLoggingConsistency(
  logs: DailyLog[],
  startDate: string,
  endDate: string
): number {
  if (logs.length === 0) return 0;

  const totalDays = getDaysBetween(startDate, endDate) + 1;
  const loggedDays = logs.length;

  return Math.round((loggedDays / totalDays) * 100);
}

/**
 * Identify logging gaps (periods without entries)
 */
export function identifyLoggingGaps(
  logs: DailyLog[],
  minGapDays: number = 3
): Array<{ start: string; end: string; days: number }> {
  if (logs.length < 2) return [];

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
  );

  const gaps: Array<{ start: string; end: string; days: number }> = [];

  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const current = sortedLogs[i];
    const next = sortedLogs[i + 1];
    const daysBetween = getDaysBetween(current.logDate, next.logDate) - 1;

    if (daysBetween >= minGapDays) {
      gaps.push({
        start: current.logDate,
        end: next.logDate,
        days: daysBetween,
      });
    }
  }

  return gaps;
}

/**
 * Calculate symptom consistency (how often a symptom appears)
 */
export function calculateSymptomConsistency(
  logs: DailyLog[],
  symptomId: string
): number {
  if (logs.length === 0) return 0;

  const logsWithSymptom = logs.filter(log =>
    log.symptoms.some(s => s.symptomId === symptomId)
  );

  return Math.round((logsWithSymptom.length / logs.length) * 100);
}

/**
 * Evaluate pattern reliability
 */
export function evaluatePatternReliability(
  occurrences: number,
  totalOpportunities: number
): 'unreliable' | 'somewhat_reliable' | 'reliable' | 'highly_reliable' {
  if (totalOpportunities < 3) return 'unreliable';

  const percentage = (occurrences / totalOpportunities) * 100;

  if (percentage < 25) return 'unreliable';
  if (percentage < 50) return 'somewhat_reliable';
  if (percentage < 75) return 'reliable';
  return 'highly_reliable';
}

/**
 * Check if limitation frequency matches actual data
 */
export function validateLimitationFrequency(
  limitation: Limitation,
  activityLogs: ActivityLog[]
): {
  consistent: boolean;
  actualFrequency: LimitationFrequency;
  confidence: 'low' | 'moderate' | 'high';
} {
  if (activityLogs.length < 5) {
    return {
      consistent: true,
      actualFrequency: limitation.frequency,
      confidence: 'low',
    };
  }

  // Count how many times the limitation was exceeded
  const relevantLogs = activityLogs.filter(log => {
    // This would need category-specific logic
    return true; // Simplified for now
  });

  const violationCount = relevantLogs.length;
  const violationPercentage = (violationCount / activityLogs.length) * 100;

  let actualFrequency: LimitationFrequency;
  if (violationPercentage >= 90) actualFrequency = 'always';
  else if (violationPercentage >= 75) actualFrequency = 'usually';
  else if (violationPercentage >= 50) actualFrequency = 'often';
  else if (violationPercentage >= 25) actualFrequency = 'sometimes';
  else if (violationPercentage >= 10) actualFrequency = 'occasionally';
  else actualFrequency = 'rarely';

  const confidence = activityLogs.length >= 20 ? 'high' : activityLogs.length >= 10 ? 'moderate' : 'low';

  return {
    consistent: actualFrequency === limitation.frequency,
    actualFrequency,
    confidence,
  };
}

/**
 * Calculate day-to-day consistency in severity
 */
export function calculateDayToDayConsistency(logs: DailyLog[]): number {
  if (logs.length < 2) return 0;

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
  );

  let totalVariation = 0;

  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const diff = Math.abs(sortedLogs[i + 1].overallSeverity - sortedLogs[i].overallSeverity);
    totalVariation += diff;
  }

  const avgVariation = totalVariation / (sortedLogs.length - 1);
  
  // Lower variation = higher consistency
  // Scale: 0 variation = 100% consistency, 10 variation = 0% consistency
  const consistency = Math.max(0, 100 - (avgVariation * 10));
  
  return Math.round(consistency);
}

/**
 * Identify consistent patterns in time of day
 */
export function identifyTimeOfDayPatterns(logs: DailyLog[]): {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
} {
  const counts = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  logs.forEach(log => {
    if (log.timeOfDay !== 'specific') {
      counts[log.timeOfDay]++;
    }
  });

  return counts;
}

/**
 * Calculate trigger consistency
 */
export function calculateTriggerConsistency(
  logs: DailyLog[],
  trigger: string
): number {
  const logsWithTrigger = logs.filter(log =>
    log.triggers?.includes(trigger)
  );

  if (logsWithTrigger.length === 0) return 0;

  // Among logs with this trigger, what percentage had significant symptoms?
  const significantLogs = logsWithTrigger.filter(log => log.overallSeverity >= 5);
  
  return Math.round((significantLogs.length / logsWithTrigger.length) * 100);
}

/**
 * Evaluate data quality
 */
export function evaluateDataQuality(
  dailyLogs: DailyLog[],
  activityLogs: ActivityLog[],
  dateRange: { start: string; end: string }
): {
  score: number;
  issues: string[];
  strengths: string[];
} {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Check logging consistency
  const consistency = calculateLoggingConsistency(dailyLogs, dateRange.start, dateRange.end);
  if (consistency < 50) {
    issues.push('Less than 50% of days logged');
    score -= 20;
  } else if (consistency >= 80) {
    strengths.push('Consistent daily logging');
  }

  // Check for logging gaps
  const gaps = identifyLoggingGaps(dailyLogs);
  if (gaps.length > 0) {
    issues.push(`${gaps.length} significant gap(s) in logging`);
    score -= gaps.length * 5;
  }

  // Check data volume
  if (dailyLogs.length < 7) {
    issues.push('Limited data volume (less than 1 week)');
    score -= 15;
  } else if (dailyLogs.length >= 30) {
    strengths.push('Strong data volume (30+ days)');
  }

  // Check activity logging
  if (activityLogs.length === 0) {
    issues.push('No activity logs recorded');
    score -= 10;
  } else if (activityLogs.length >= 10) {
    strengths.push('Good activity documentation');
  }

  // Check for detailed notes
  const logsWithNotes = dailyLogs.filter(log => log.notes && log.notes.length > 10);
  const notesPercentage = dailyLogs.length > 0 ? (logsWithNotes.length / dailyLogs.length) * 100 : 0;
  
  if (notesPercentage >= 50) {
    strengths.push('Detailed notes on most entries');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths,
  };
}
