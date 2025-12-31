/**
 * Symptom Engine
 * Analyzes symptom data and generates summaries
 */

import { DailyLog } from '../domain/models/DailyLog';
import { getSymptomById } from '../data/symptoms';
// Date utilities not currently used in this file

export interface SymptomSummary {
  symptomId: string;
  symptomName: string;
  
  // Frequency
  dayCount: number;
  percentage: number;
  
  // Severity
  averageSeverity: number;
  maxSeverity: number;
  minSeverity: number;
  
  // Consistency
  consistency: 'very consistent' | 'consistent' | 'variable' | 'inconsistent';
  consistencyScore: number;
  
  // Trend
  trend: 'improving' | 'worsening' | 'stable';
  
  // Impact flags
  frequentlySevere: boolean; // >= 7 more than 50% of the time
  alwaysPresent: boolean; // >= 85% of days
  worsening: boolean; // Trend is worsening
}

export interface DailyOverview {
  date: string;
  
  // Summary metrics
  symptomCount: number;
  worstSeverity: number;
  averageSeverity: number;
  
  // Flags
  isBadDay: boolean; // Worst severity >= 7 or avg >= 5
  isGoodDay: boolean; // Worst severity < 5 and avg < 3
  
  // Top symptoms
  topSymptoms: Array<{
    symptomId: string;
    symptomName: string;
    severity: number;
  }>;
}

export class SymptomEngine {
  /**
   * Generate symptom summary for a specific symptom across multiple days
   */
  static summarizeSymptom(
    symptomId: string,
    logs: DailyLog[]
  ): SymptomSummary | null {
    const symptom = getSymptomById(symptomId);
    if (!symptom) return null;

    // Find all days where this symptom appears
    const daysWithSymptom = logs.filter(log => 
      log.symptoms.some(s => s.symptomId === symptomId)
    );

    if (daysWithSymptom.length === 0) return null;

    const dayCount = daysWithSymptom.length;
    const totalDays = logs.length;
    const percentage = Math.round((dayCount / totalDays) * 100);

    // Collect all severities for this symptom
    const severities = daysWithSymptom
      .flatMap(log => log.symptoms.filter(s => s.symptomId === symptomId))
      .map(s => s.severity);

    const averageSeverity = Math.round(
      severities.reduce((sum, s) => sum + s, 0) / severities.length
    );
    const maxSeverity = Math.max(...severities);
    const minSeverity = Math.min(...severities);

    // Implement consistency evaluation
    const consistencyResult = this.evaluateConsistency(severities);

    // Analyze trend (compare first half to second half)
    let trend: SymptomSummary['trend'] = 'stable';
    if (daysWithSymptom.length >= 4) {
      const midpoint = Math.floor(daysWithSymptom.length / 2);
      const firstHalf = daysWithSymptom.slice(0, midpoint);
      const secondHalf = daysWithSymptom.slice(midpoint);

      const firstAvg = firstHalf
        .flatMap(log => log.symptoms.filter(s => s.symptomId === symptomId))
        .reduce((sum, s) => sum + s.severity, 0) / firstHalf.length;

      const secondAvg = secondHalf
        .flatMap(log => log.symptoms.filter(s => s.symptomId === symptomId))
        .reduce((sum, s) => sum + s.severity, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 1) {
        trend = 'worsening';
      } else if (secondAvg < firstAvg - 1) {
        trend = 'improving';
      }
    }

    // Impact flags
    const severeCounts = severities.filter(s => s >= 7).length;
    const frequentlySevere = (severeCounts / severities.length) >= 0.5;
    const alwaysPresent = percentage >= 85;
    const worsening = trend === 'worsening';

    return {
      symptomId,
      symptomName: symptom.name,
      dayCount,
      percentage,
      averageSeverity,
      maxSeverity,
      minSeverity,
      consistency: 'consistent' as const,
      consistencyScore: consistencyResult.consistent ? 100 : 50,
      trend,
      frequentlySevere,
      alwaysPresent,
      worsening,
    };
  }

  /**
   * Generate daily overview from a single day's log
   */
  static generateDailyOverview(log: DailyLog): DailyOverview {
    const symptomCount = log.symptoms.length;
    
    const severities = log.symptoms.map(s => s.severity);
    const worstSeverity = symptomCount > 0 ? Math.max(...severities) : 0;
    const averageSeverity = symptomCount > 0
      ? Math.round(severities.reduce((sum, s) => sum + s, 0) / severities.length)
      : 0;

    const isBadDay = worstSeverity >= 7 || averageSeverity >= 5;
    const isGoodDay = worstSeverity < 5 && averageSeverity < 3;

    // Get top 3 symptoms by severity
    const sortedSymptoms = [...log.symptoms]
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);

    const topSymptoms = sortedSymptoms.map(s => {
      const symptom = getSymptomById(s.symptomId);
      return {
        symptomId: s.symptomId,
        symptomName: symptom?.name || s.symptomId,
        severity: s.severity,
      };
    });

    return {
      date: log.logDate,
      symptomCount,
      worstSeverity,
      averageSeverity,
      isBadDay,
      isGoodDay,
      topSymptoms,
    };
  }

  /**
   * Calculate good vs bad day ratio
   */
  static calculateDayRatio(logs: DailyLog[]): {
    goodDays: number;
    badDays: number;
    totalDays: number;
    badDayPercentage: number;
  } {
    let goodDays = 0;
    let badDays = 0;

    logs.forEach(log => {
      const overview = this.generateDailyOverview(log);
      if (overview.isBadDay) {
        badDays++;
      } else if (overview.isGoodDay) {
        goodDays++;
      }
      // Note: Some days may be neither good nor bad (moderate)
    });

    const totalDays = logs.length;
    const badDayPercentage = totalDays > 0 
      ? Math.round((badDays / totalDays) * 100)
      : 0;

    return {
      goodDays,
      badDays,
      totalDays,
      badDayPercentage,
    };
  }

  /**
   * Identify symptom clusters (symptoms that frequently occur together)
   */
  static identifySymptomClusters(
    logs: DailyLog[],
    minCoOccurrence: number = 50
  ): Array<{
    symptomIds: string[];
    symptomNames: string[];
    coOccurrenceRate: number;
    dayCount: number;
  }> {
    const clusters: Array<{
      symptomIds: string[];
      symptomNames: string[];
      coOccurrenceRate: number;
      dayCount: number;
    }> = [];

    // Get all unique symptoms
    const allSymptomIds = Array.from(
      new Set(logs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    // Check each pair of symptoms
    for (let i = 0; i < allSymptomIds.length; i++) {
      for (let j = i + 1; j < allSymptomIds.length; j++) {
        const symptomA = allSymptomIds[i];
        const symptomB = allSymptomIds[j];

        const daysWithA = logs.filter(log =>
          log.symptoms.some(s => s.symptomId === symptomA)
        ).length;

        const daysWithBoth = logs.filter(log =>
          log.symptoms.some(s => s.symptomId === symptomA) &&
          log.symptoms.some(s => s.symptomId === symptomB)
        ).length;

        if (daysWithA === 0) continue;

        const coOccurrenceRate = Math.round((daysWithBoth / daysWithA) * 100);

        if (coOccurrenceRate >= minCoOccurrence && daysWithBoth >= 3) {
          const symptomAData = getSymptomById(symptomA);
          const symptomBData = getSymptomById(symptomB);

          clusters.push({
            symptomIds: [symptomA, symptomB],
            symptomNames: [
              symptomAData?.name || symptomA,
              symptomBData?.name || symptomB,
            ],
            coOccurrenceRate,
            dayCount: daysWithBoth,
          });
        }
      }
    }

    // Sort by co-occurrence rate
    return clusters.sort((a, b) => b.coOccurrenceRate - a.coOccurrenceRate);
  }

  /**
   * Identify symptom escalation patterns (symptoms that lead to worse symptoms)
   */
  static identifyEscalationPatterns(
    logs: DailyLog[]
  ): Array<{
    initialSymptom: string;
    escalatedSymptom: string;
    frequency: number;
    typicalDelay: string; // 'same day', 'next day', etc.
  }> {
    // This is a simplified version - would need time-series analysis for full implementation
    const patterns: Array<{
      initialSymptom: string;
      escalatedSymptom: string;
      frequency: number;
      typicalDelay: string;
    }> = [];

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) =>
      new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
    );

    // Look for patterns where symptom A on day N leads to symptom B on day N or N+1
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const today = sortedLogs[i];
      const tomorrow = sortedLogs[i + 1];

      today.symptoms.forEach(symptomToday => {
        // Check if a different, more severe symptom appears tomorrow
        tomorrow.symptoms.forEach(symptomTomorrow => {
          if (symptomToday.symptomId !== symptomTomorrow.symptomId &&
              symptomTomorrow.severity > symptomToday.severity) {
            
            // Check if this pattern exists
            const existingPattern = patterns.find(p =>
              p.initialSymptom === symptomToday.symptomId &&
              p.escalatedSymptom === symptomTomorrow.symptomId
            );

            if (existingPattern) {
              existingPattern.frequency++;
            } else {
              patterns.push({
                initialSymptom: symptomToday.symptomId,
                escalatedSymptom: symptomTomorrow.symptomId,
                frequency: 1,
                typicalDelay: 'next day',
              });
            }
          }
        });

        // Check for same-day escalation (symptom worsens significantly)
        const sameSymptomLater = today.symptoms.find(s =>
          s.symptomId === symptomToday.symptomId &&
          s.severity > symptomToday.severity + 2
        );

        if (sameSymptomLater) {
          const existingPattern = patterns.find(p =>
            p.initialSymptom === symptomToday.symptomId &&
            p.escalatedSymptom === symptomToday.symptomId
          );

          if (existingPattern) {
            existingPattern.frequency++;
          } else {
            patterns.push({
              initialSymptom: symptomToday.symptomId,
              escalatedSymptom: symptomToday.symptomId,
              frequency: 1,
              typicalDelay: 'same day',
            });
          }
        }
      });
    }

    // Return only patterns that occur at least 3 times
    return patterns
      .filter(p => p.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate comprehensive symptom report
   */
  static generateSymptomReport(
    logs: DailyLog[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dateRange: { start: string; end: string }
  ): {
    summary: {
      totalDays: number;
      goodDays: number;
      badDays: number;
      totalSymptoms: number;
    };
    topSymptoms: SymptomSummary[];
    clusters: Array<{ symptomNames: string[]; coOccurrenceRate: number }>;
    dayRatio: { goodDays: number; badDays: number; badDayPercentage: number };
  } {
    // Get all unique symptoms
    const allSymptomIds = Array.from(
      new Set(logs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    // Generate summaries for each symptom
    const symptomSummaries = allSymptomIds
      .map(id => this.summarizeSymptom(id, logs))
      .filter((s): s is SymptomSummary => s !== null);

    // Sort by severity impact
    const topSymptoms = symptomSummaries
      .sort((a, b) => {
        // Prioritize: frequency * average severity
        const scoreA = (a.percentage / 100) * a.averageSeverity;
        const scoreB = (b.percentage / 100) * b.averageSeverity;
        return scoreB - scoreA;
      })
      .slice(0, 10);

    // Identify clusters
    const clusters = this.identifySymptomClusters(logs)
      .slice(0, 5)
      .map(c => ({
        symptomNames: c.symptomNames,
        coOccurrenceRate: c.coOccurrenceRate,
      }));

    // Calculate day ratio
    const dayRatio = this.calculateDayRatio(logs);

    return {
      summary: {
        totalDays: logs.length,
        goodDays: dayRatio.goodDays,
        badDays: dayRatio.badDays,
        totalSymptoms: allSymptomIds.length,
      },
      topSymptoms,
      clusters,
      dayRatio,
    };
  }

  /**
   * Evaluate consistency of symptom severity scores
   */
  private static evaluateConsistency(severities: number[]): {
    consistent: boolean;
    variability: 'low' | 'moderate' | 'high';
  } {
    if (severities.length < 3) {
      return { consistent: true, variability: 'low' };
    }

    // Calculate standard deviation
    const mean = severities.reduce((sum, s) => sum + s, 0) / severities.length;
    const variance = severities.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / severities.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate variability based on standard deviation
    let variability: 'low' | 'moderate' | 'high';
    let consistent: boolean;

    if (standardDeviation <= 1.5) {
      variability = 'low';
      consistent = true;
    } else if (standardDeviation <= 2.5) {
      variability = 'moderate';
      consistent = true;
    } else {
      variability = 'high';
      consistent = false;
    }

    return { consistent, variability };
  }
}