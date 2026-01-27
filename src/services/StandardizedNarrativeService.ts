/**
 * Standardized Narrative Generator
 * Generates consistent, neutral, repeatable narrative text for reports
 * Uses fixed sentence templates - no expressive language or emotional descriptors
 */

import { FunctionalDomain, FUNCTIONAL_DOMAIN_INFO } from '../domain/rules/functionalDomains';

/**
 * Standard narrative patterns - these must be consistent across all report generations
 */

export interface NarrativeConfig {
  dateRange: { start: string; end: string };
  totalDays: number;
  loggedDays: number;
}

/**
 * Generate opening statement
 */
export function generateOpeningStatement(config: NarrativeConfig): string {
  const { dateRange, totalDays, loggedDays } = config;
  return `Entries record symptom and activity data for the period from ${dateRange.start} to ${dateRange.end}. ` +
    `This period spans ${totalDays} days. ` +
    `Logs were created on ${loggedDays} of ${totalDays} days.`;
}

/**
 * Generate frequency statement
 */
export function generateFrequencyStatement(
  occurrences: number,
  totalDays: number,
  context: string
): string {
  const percentage = Math.round((occurrences / totalDays) * 100);
  return `${context} on ${occurrences} of ${totalDays} logged days (${percentage} percent).`;
}

/**
 * Generate symptom summary statement
 */
export function generateSymptomSummary(
  symptomName: string,
  occurrences: number,
  totalDays: number,
  avgSeverity: number
): string {
  const percentage = Math.round((occurrences / totalDays) * 100);
  return `Logs indicate ${symptomName} was recorded on ${occurrences} of ${totalDays} logged days (${percentage} percent). ` +
    `Average reported severity was ${avgSeverity.toFixed(1)} on a scale of 0 to 10.`;
}

/**
 * Generate activity impact statement
 */
export function generateActivityImpactStatement(
  activityName: string,
  attempts: number,
  stoppedEarly: number,
  avgImpact: number
): string {
  const stoppedPercentage = attempts > 0 ? Math.round((stoppedEarly / attempts) * 100) : 0;
  return `Entries record ${activityName} on ${attempts} occasions. ` +
    `Activity was stopped before completion on ${stoppedEarly} occasions (${stoppedPercentage} percent). ` +
    `Average reported impact was ${avgImpact.toFixed(1)} on a scale of 0 to 10.`;
}

/**
 * Generate correlation statement (neutral, data-driven)
 */
export function generateCorrelationStatement(
  trigger: string,
  symptom: string,
  occurrences: number,
  totalOccurrences: number
): string {
  const percentage = Math.round((occurrences / totalOccurrences) * 100);
  return `${symptom} was logged following ${trigger} on ${occurrences} of ${totalOccurrences} occasions (${percentage} percent).`;
}

/**
 * Generate duration tolerance statement
 */
export function generateDurationToleranceStatement(
  activity: string,
  thresholdMinutes: number,
  escalationCount: number,
  totalAttempts: number
): string {
  const percentage = Math.round((escalationCount / totalAttempts) * 100);
  return `Symptoms escalated following ${activity} sustained beyond ${thresholdMinutes} minutes on ${escalationCount} of ${totalAttempts} logged occasions (${percentage} percent).`;
}

/**
 * Generate recovery time statement
 */
export function generateRecoveryStatement(
  activity: string,
  avgRecoveryMinutes: number,
  occurrences: number
): string {
  const hours = Math.floor(avgRecoveryMinutes / 60);
  const minutes = Math.round(avgRecoveryMinutes % 60);
  const timeString = hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`;
  
  return `Following ${activity}, the user reports an average recovery period of ${timeString} across ${occurrences} logged instances.`;
}

/**
 * Generate functional domain limitation statement
 */
export function generateFunctionalLimitationStatement(
  domain: FunctionalDomain,
  impactedDays: number,
  totalDays: number,
  avgSeverity: number
): string {
  const domainInfo = FUNCTIONAL_DOMAIN_INFO[domain];
  const percentage = Math.round((impactedDays / totalDays) * 100);
  
  return `Logs indicate limitations in ${domainInfo.label.toLowerCase()} on ${impactedDays} of ${totalDays} logged days (${percentage} percent). ` +
    `Average reported impact was ${avgSeverity.toFixed(1)} on a scale of 0 to 10.`;
}

/**
 * Generate assistance requirement statement
 */
export function generateAssistanceStatement(
  activity: string,
  assistanceCount: number,
  totalAttempts: number
): string {
  const percentage = Math.round((assistanceCount / totalAttempts) * 100);
  return `Entries record assistance for ${activity} on ${assistanceCount} of ${totalAttempts} logged attempts (${percentage} percent).`;
}

/**
 * Generate severity trend statement (neutral observation only)
 */
export function generateSeverityTrendStatement(
  metric: string,
  direction: 'increased' | 'decreased' | 'remained stable',
  firstPeriodAvg: number,
  secondPeriodAvg: number
): string {
  if (direction === 'remained stable') {
    return `${metric} remained stable across the reporting period, with average values of ${firstPeriodAvg.toFixed(1)} and ${secondPeriodAvg.toFixed(1)}.`;
  }
  
  return `${metric} ${direction} from an average of ${firstPeriodAvg.toFixed(1)} to ${secondPeriodAvg.toFixed(1)} across the reporting period.`;
}

/**
 * Generate pattern statement
 */
export function generatePatternStatement(
  pattern: string,
  frequency: number,
  context: string
): string {
  return `Pattern observed: ${pattern}. This pattern was recorded ${frequency} times. Context: ${context}.`;
}

/**
 * Generate data quality statement
 */
export function generateDataQualityStatement(
  totalDays: number,
  loggedDays: number,
  finalizedCount: number,
  revisedCount: number
): string {
  const coveragePercentage = Math.round((loggedDays / totalDays) * 100);
  
  return `Data coverage: ${loggedDays} of ${totalDays} days (${coveragePercentage} percent). ` +
    `Finalized entries: ${finalizedCount}. ` +
    `Entries with revisions: ${revisedCount}.`;
}

/**
 * Generate closing statement
 */
export function generateClosingStatement(): string {
  return 'This report documents user-reported information only. ' +
    'The application does not provide medical advice, diagnosis, or treatment recommendations. ' +
    'Data presented reflects logged entries and does not constitute clinical assessment.';
}

/**
 * Format a date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const end = new Date(endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${start} to ${end}`;
}

/**
 * Calculate percentage and format consistently
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return Math.round((value / total) * 100).toString();
}

/**
 * Generate revision summary for reports
 */
export function generateRevisionSummary(
  logDate: string,
  fieldName: string,
  revisionDate: string
): string {
  return `Entry for ${logDate}: Field "${fieldName}" was revised on ${revisionDate}.`;
}
