/**
 * Medication Correlation Analysis
 * Analyzes correlations between medication usage and symptom changes
 */

import { Medication, EffectivenessRating } from '../domain/models/Medication';
import { DailyLog } from '../domain/models/DailyLog';

export interface MedicationCorrelation {
  medicationId: string;
  medicationName: string;
  dosage: string;
  purpose: string[];
  effectiveness: EffectivenessRating | undefined;
  
  // Time-based analysis
  totalDaysActive: number;
  startDate: string | undefined;
  endDate: string | undefined;
  
  // Symptom correlation
  averageSeverityDuring: number;
  averageSeverityBefore?: number;
  averageSeverityAfter?: number;
  
  // Change metrics
  severityChange?: number; // Positive = improvement, Negative = worsening
  changePercentage?: number;
  impact: 'improved' | 'worsened' | 'no_change' | 'insufficient_data';
  
  // Statistical significance
  dataQuality: 'high' | 'medium' | 'low';
  daysOfDataBefore: number;
  daysOfDataDuring: number;
  daysOfDataAfter: number;
}

export interface MedicationAnalysis {
  correlations: MedicationCorrelation[];
  totalMedications: number;
  activeMedications: number;
  effectiveMedications: number;
  ineffectiveMedications: number;
  hasInsufficientData: boolean;
}

/**
 * Analyze medication correlations with symptom changes
 */
export function analyzeMedicationCorrelations(
  medications: Medication[],
  dailyLogs: DailyLog[],
  dateRange: { start: string; end: string }
): MedicationAnalysis {
  const correlations: MedicationCorrelation[] = [];
  
  // Sort logs by date for easier analysis
  const sortedLogs = [...dailyLogs].sort((a, b) => a.logDate.localeCompare(b.logDate));
  
  for (const medication of medications) {
    const correlation = analyzeSingleMedication(medication, sortedLogs, dateRange);
    correlations.push(correlation);
  }
  
  // Sort by impact strength
  correlations.sort((a, b) => {
    // Prioritize medications with clear impact
    if (a.impact !== b.impact) {
      const order = { improved: 0, worsened: 1, no_change: 2, insufficient_data: 3 };
      return order[a.impact] - order[b.impact];
    }
    // Then by change magnitude
    return Math.abs(b.severityChange || 0) - Math.abs(a.severityChange || 0);
  });
  
  return {
    correlations,
    totalMedications: medications.length,
    activeMedications: medications.filter(m => m.isActive).length,
    effectiveMedications: correlations.filter(c => c.impact === 'improved').length,
    ineffectiveMedications: correlations.filter(c => c.impact === 'worsened' || c.impact === 'no_change').length,
    hasInsufficientData: correlations.some(c => c.dataQuality === 'low'),
  };
}

/**
 * Analyze correlation for a single medication
 */
function analyzeSingleMedication(
  medication: Medication,
  sortedLogs: DailyLog[],
  dateRange: { start: string; end: string }
): MedicationCorrelation {
  const startDate = medication.startDate || dateRange.start;
  const endDate = medication.endDate;
  
  // Get logs in different periods
  const logsBefore = sortedLogs.filter(log => log.logDate < startDate);
  const logsDuring = sortedLogs.filter(log => {
    const afterStart = log.logDate >= startDate;
    const beforeEnd = !endDate || log.logDate <= endDate;
    return afterStart && beforeEnd;
  });
  const logsAfter = endDate 
    ? sortedLogs.filter(log => log.logDate > endDate && log.logDate <= dateRange.end)
    : [];
  
  // Calculate average severities
  const avgSeverityBefore = logsBefore.length > 0
    ? logsBefore.reduce((sum, log) => sum + log.overallSeverity, 0) / logsBefore.length
    : undefined;
  
  const avgSeverityDuring = logsDuring.length > 0
    ? logsDuring.reduce((sum, log) => sum + log.overallSeverity, 0) / logsDuring.length
    : 0;
  
  const avgSeverityAfter = logsAfter.length > 0
    ? logsAfter.reduce((sum, log) => sum + log.overallSeverity, 0) / logsAfter.length
    : undefined;
  
  // Calculate change (before → during)
  let severityChange: number | undefined;
  let changePercentage: number | undefined;
  let impact: 'improved' | 'worsened' | 'no_change' | 'insufficient_data' = 'insufficient_data';
  
  if (avgSeverityBefore !== undefined && logsDuring.length >= 3) {
    // Positive change = symptoms got better (severity decreased)
    severityChange = avgSeverityBefore - avgSeverityDuring;
    changePercentage = avgSeverityBefore > 0 
      ? (severityChange / avgSeverityBefore) * 100 
      : 0;
    
    // Determine impact
    if (severityChange > 1) {
      impact = 'improved';
    } else if (severityChange < -1) {
      impact = 'worsened';
    } else {
      impact = 'no_change';
    }
  } else if (logsDuring.length >= 7) {
    // If no before data but sufficient during data, check effectiveness rating
    if (medication.effectiveness === 'very_effective' || medication.effectiveness === 'moderately_effective') {
      impact = 'improved';
      severityChange = 0; // Unknown magnitude but user reported effective
    } else if (medication.effectiveness === 'not_effective') {
      impact = 'no_change';
      severityChange = 0;
    }
  }
  
  // Assess data quality
  let dataQuality: 'high' | 'medium' | 'low' = 'low';
  if (logsBefore.length >= 7 && logsDuring.length >= 14) {
    dataQuality = 'high';
  } else if (logsBefore.length >= 3 && logsDuring.length >= 7) {
    dataQuality = 'medium';
  }
  
  // Calculate total days active
  const totalDaysActive = logsDuring.length;
  
  return {
    medicationId: medication.id,
    medicationName: medication.name,
    dosage: medication.dosage,
    purpose: medication.purpose,
    effectiveness: medication.effectiveness,
    totalDaysActive,
    startDate: medication.startDate,
    endDate: medication.endDate,
    averageSeverityDuring: Math.round(avgSeverityDuring * 10) / 10,
    averageSeverityBefore: avgSeverityBefore !== undefined 
      ? Math.round(avgSeverityBefore * 10) / 10 
      : undefined,
    averageSeverityAfter: avgSeverityAfter !== undefined 
      ? Math.round(avgSeverityAfter * 10) / 10 
      : undefined,
    severityChange: severityChange !== undefined 
      ? Math.round(severityChange * 10) / 10 
      : undefined,
    changePercentage: changePercentage !== undefined 
      ? Math.round(changePercentage) 
      : undefined,
    impact,
    dataQuality,
    daysOfDataBefore: logsBefore.length,
    daysOfDataDuring: logsDuring.length,
    daysOfDataAfter: logsAfter.length,
  };
}

/**
 * Get impact icon for medication correlation
 */
export function getMedicationImpactIcon(impact: 'improved' | 'worsened' | 'no_change' | 'insufficient_data'): string {
  switch (impact) {
    case 'improved':
      return '✓';
    case 'worsened':
      return '⚠️';
    case 'no_change':
      return '−';
    case 'insufficient_data':
      return '?';
  }
}

/**
 * Get effectiveness display text
 */
export function getEffectivenessText(effectiveness: EffectivenessRating | undefined): string {
  if (!effectiveness) return 'Not rated';
  
  const labels: Record<EffectivenessRating, string> = {
    not_effective: 'Not effective',
    minimally_effective: 'Minimally effective',
    somewhat_effective: 'Somewhat effective',
    moderately_effective: 'Moderately effective',
    very_effective: 'Very effective',
  };
  
  return labels[effectiveness];
}
