/**
 * Severity Rules
 * Business rules for evaluating symptom severity and consistency
 */

import { DailyLog } from '../models/DailyLog';
import { ActivityLog } from '../models/ActivityLog';

/**
 * Determine severity level category
 */
export function getSeverityLevel(severity: number): 'none' | 'mild' | 'moderate' | 'severe' | 'extreme' {
  if (severity === 0) return 'none';
  if (severity <= 3) return 'mild';
  if (severity <= 6) return 'moderate';
  if (severity <= 8) return 'severe';
  return 'extreme';
}

/**
 * Check if severity indicates significant impairment (5+)
 */
export function isSignificantSeverity(severity: number): boolean {
  return severity >= 5;
}

/**
 * Check if severity indicates severe impairment (7+)
 */
export function isSevereSeverity(severity: number): boolean {
  return severity >= 7;
}

/**
 * Calculate average severity from logs
 */
export function calculateAverageSeverity(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  
  const total = logs.reduce((sum, log) => sum + log.overallSeverity, 0);
  return Math.round(total / logs.length);
}

/**
 * Calculate severity distribution
 */
export function calculateSeverityDistribution(logs: DailyLog[]): {
  none: number;
  mild: number;
  moderate: number;
  severe: number;
  extreme: number;
} {
  const distribution = {
    none: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
    extreme: 0,
  };

  logs.forEach(log => {
    const level = getSeverityLevel(log.overallSeverity);
    distribution[level]++;
  });

  return distribution;
}

/**
 * Get severity trend (improving, worsening, stable)
 */
export function getSeverityTrend(logs: DailyLog[]): 'improving' | 'worsening' | 'stable' | 'insufficient_data' {
  if (logs.length < 7) return 'insufficient_data';

  // Sort by date
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
  );

  // Compare first half to second half
  const midpoint = Math.floor(sortedLogs.length / 2);
  const firstHalf = sortedLogs.slice(0, midpoint);
  const secondHalf = sortedLogs.slice(midpoint);

  const firstAvg = calculateAverageSeverity(firstHalf);
  const secondAvg = calculateAverageSeverity(secondHalf);

  const difference = secondAvg - firstAvg;

  if (Math.abs(difference) < 1) return 'stable';
  if (difference < 0) return 'improving';
  return 'worsening';
}

/**
 * Calculate percentage of days with significant symptoms
 */
export function getSignificantSymptomDays(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  
  const significantDays = logs.filter(log => isSignificantSeverity(log.overallSeverity)).length;
  return Math.round((significantDays / logs.length) * 100);
}

/**
 * Calculate percentage of days with severe symptoms
 */
export function getSevereSymptomDays(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  
  const severeDays = logs.filter(log => isSevereSeverity(log.overallSeverity)).length;
  return Math.round((severeDays / logs.length) * 100);
}

/**
 * Identify most common severe symptoms
 */
export function getMostCommonSevereSymptoms(logs: DailyLog[]): Array<{ symptomId: string; frequency: number }> {
  const symptomCounts: Record<string, number> = {};

  logs.forEach(log => {
    log.symptoms.forEach(symptom => {
      if (symptom.severity >= 7) {
        symptomCounts[symptom.symptomId] = (symptomCounts[symptom.symptomId] || 0) + 1;
      }
    });
  });

  return Object.entries(symptomCounts)
    .map(([symptomId, frequency]) => ({ symptomId, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
}

/**
 * Calculate peak severity reached in period
 */
export function getPeakSeverity(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  return Math.max(...logs.map(log => log.overallSeverity));
}

/**
 * Calculate minimum severity in period
 */
export function getMinimumSeverity(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  return Math.min(...logs.map(log => log.overallSeverity));
}

/**
 * Calculate severity variability (standard deviation)
 */
export function getSeverityVariability(logs: DailyLog[]): number {
  if (logs.length < 2) return 0;

  const avg = calculateAverageSeverity(logs);
  const squaredDiffs = logs.map(log => Math.pow(log.overallSeverity - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / logs.length;
  
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/**
 * Evaluate activity impact severity
 */
export function evaluateActivityImpact(activityLog: ActivityLog): 'minimal' | 'moderate' | 'significant' | 'severe' {
  const impact = activityLog.immediateImpact.overallImpact;
  const delayedImpact = activityLog.delayedImpact?.overallImpact || 0;
  const maxImpact = Math.max(impact, delayedImpact);

  if (maxImpact <= 3) return 'minimal';
  if (maxImpact <= 5) return 'moderate';
  if (maxImpact <= 7) return 'significant';
  return 'severe';
}
