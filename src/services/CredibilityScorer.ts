/**
 * Credibility Scorer
 * Calculates credibility indicators for SSDI claims
 * 
 * Measures logging consistency, data completeness, pattern stability,
 * and corroborating evidence to support claim credibility.
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Medication } from '../domain/models/Medication';
import { Limitation } from '../domain/models/Limitation';

export interface CredibilityScore {
  overallScore: number; // 0-100
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  indicators: CredibilityIndicators;
  recommendations: string[];
}

export interface CredibilityIndicators {
  loggingConsistency: ConsistencyScore;
  durationCoverage: CoverageScore;
  dataCompleteness: CompletenessScore;
  patternStability: StabilityScore;
  corroboratingEvidence: EvidenceScore;
}

export interface ConsistencyScore {
  score: number; // 0-100
  daysLogged: number;
  totalDays: number;
  loggingRate: number; // percentage
  longestGap: number; // days
  averageGapSize: number; // days
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface CoverageScore {
  score: number; // 0-100
  totalMonthsCovered: number;
  minimumMonthsNeeded: number; // Typically 12+ for SSDI
  coveragePercentage: number;
  hasPreDisabilityData: boolean;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface CompletenessScore {
  score: number; // 0-100
  logsWithNotes: number;
  logsWithSeverity: number;
  logsWithTriggers: number;
  logsWithMultipleSymptoms: number;
  totalLogs: number;
  averageDataPoints: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface StabilityScore {
  score: number; // 0-100
  consistentSymptoms: number; // Symptoms appearing >50% of time
  varianceCoefficient: number; // Lower is more stable/credible
  trendStability: 'stable' | 'improving' | 'worsening' | 'variable';
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface EvidenceScore {
  score: number; // 0-100
  hasMedications: boolean;
  hasActiveLimitations: boolean;
  hasActivityLogs: boolean;
  medicationCount: number;
  limitationCount: number;
  activityLogCount: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export class CredibilityScorer {
  /**
   * Calculate comprehensive credibility score
   */
  static calculateCredibility(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    medications: Medication[],
    limitations: Limitation[]
  ): CredibilityScore {
    const consistency = this.calculateConsistency(dailyLogs);
    const coverage = this.calculateCoverage(dailyLogs);
    const completeness = this.calculateCompleteness(dailyLogs);
    const stability = this.calculateStability(dailyLogs);
    const evidence = this.calculateEvidence(activityLogs, medications, limitations);

    const indicators: CredibilityIndicators = {
      loggingConsistency: consistency,
      durationCoverage: coverage,
      dataCompleteness: completeness,
      patternStability: stability,
      corroboratingEvidence: evidence,
    };

    // Weighted average (consistency and coverage are most important for SSDI)
    const overallScore = Math.round(
      consistency.score * 0.30 +
      coverage.score * 0.25 +
      completeness.score * 0.20 +
      stability.score * 0.15 +
      evidence.score * 0.10
    );

    const grade = this.getGrade(overallScore);
    const recommendations = this.generateRecommendations(indicators);

    return {
      overallScore,
      grade,
      indicators,
      recommendations,
    };
  }

  /**
   * Calculate logging consistency score
   */
  private static calculateConsistency(dailyLogs: DailyLog[]): ConsistencyScore {
    if (dailyLogs.length === 0) {
      return {
        score: 0,
        daysLogged: 0,
        totalDays: 0,
        loggingRate: 0,
        longestGap: 0,
        averageGapSize: 0,
        rating: 'Poor',
      };
    }

    // Sort logs by date
    const sortedLogs = [...dailyLogs].sort((a, b) => a.logDate.localeCompare(b.logDate));
    
    const firstDate = new Date(sortedLogs[0].logDate);
    const lastDate = new Date(sortedLogs[sortedLogs.length - 1].logDate);
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysLogged = sortedLogs.length;
    const loggingRate = (daysLogged / totalDays) * 100;

    // Calculate gaps between logs
    const gaps: number[] = [];
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevDate = new Date(sortedLogs[i - 1].logDate);
      const currDate = new Date(sortedLogs[i].logDate);
      const gap = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (gap > 1) {
        gaps.push(gap - 1); // Subtract 1 to get actual gap size
      }
    }

    const longestGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    const averageGapSize = gaps.length > 0 
      ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length 
      : 0;

    // Score based on logging rate and gap analysis
    let score = 0;
    if (loggingRate >= 80) score = 100;
    else if (loggingRate >= 60) score = 85;
    else if (loggingRate >= 40) score = 70;
    else if (loggingRate >= 20) score = 50;
    else score = 30;

    // Penalize for long gaps
    if (longestGap > 30) score -= 20;
    else if (longestGap > 14) score -= 10;
    else if (longestGap > 7) score -= 5;

    score = Math.max(0, Math.min(100, score));

    const rating = this.getRating(score);

    return {
      score,
      daysLogged,
      totalDays,
      loggingRate: Math.round(loggingRate),
      longestGap,
      averageGapSize: Math.round(averageGapSize * 10) / 10,
      rating,
    };
  }

  /**
   * Calculate duration coverage score
   */
  private static calculateCoverage(dailyLogs: DailyLog[]): CoverageScore {
    if (dailyLogs.length === 0) {
      return {
        score: 0,
        totalMonthsCovered: 0,
        minimumMonthsNeeded: 12,
        coveragePercentage: 0,
        hasPreDisabilityData: false,
        rating: 'Poor',
      };
    }

    const sortedLogs = [...dailyLogs].sort((a, b) => a.logDate.localeCompare(b.logDate));
    const firstDate = new Date(sortedLogs[0].logDate);
    const lastDate = new Date(sortedLogs[sortedLogs.length - 1].logDate);

    const daysSpan = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const coverageDays = Math.max(daysSpan, dailyLogs.length);
    const monthsCovered = coverageDays / 30.44;
    const totalMonthsCovered = Math.max(1, Math.round(monthsCovered * 10) / 10);
    
    const minimumMonthsNeeded = 12;
    const coveragePercentage = Math.min(100, (totalMonthsCovered / minimumMonthsNeeded) * 100);

    // Check if there's data from before potential disability onset
    // (Assuming recent data is post-onset)
    const hasPreDisabilityData = totalMonthsCovered >= 6;

    let score = 0;
    if (totalMonthsCovered >= 24) score = 100;
    else if (totalMonthsCovered >= 18) score = 90;
    else if (totalMonthsCovered >= 12) score = 80;
    else if (totalMonthsCovered >= 6) score = 60;
    else if (totalMonthsCovered >= 3) score = 40;
    else score = 20;

    const rating = this.getRating(score);

    return {
      score,
      totalMonthsCovered,
      minimumMonthsNeeded,
      coveragePercentage: Math.round(coveragePercentage),
      hasPreDisabilityData,
      rating,
    };
  }

  /**
   * Calculate data completeness score
   */
  private static calculateCompleteness(dailyLogs: DailyLog[]): CompletenessScore {
    if (dailyLogs.length === 0) {
      return {
        score: 0,
        logsWithNotes: 0,
        logsWithSeverity: 0,
        logsWithTriggers: 0,
        logsWithMultipleSymptoms: 0,
        totalLogs: 0,
        averageDataPoints: 0,
        rating: 'Poor',
      };
    }

    const totalLogs = dailyLogs.length;
    const logsWithNotes = dailyLogs.filter(log => log.notes && log.notes.trim().length > 0).length;
    const logsWithSeverity = dailyLogs.filter(log => log.overallSeverity > 0).length;
    const logsWithTriggers = dailyLogs.filter(log => log.triggers && log.triggers.length > 0).length;
    const logsWithMultipleSymptoms = dailyLogs.filter(log => log.symptoms.length >= 2).length;

    const dataPointsPerLog = (
      (logsWithNotes / totalLogs) +
      (logsWithSeverity / totalLogs) +
      (logsWithTriggers / totalLogs) +
      (logsWithMultipleSymptoms / totalLogs)
    );

    const averageDataPoints = Math.round(dataPointsPerLog * 10) / 10;

    // Score based on completeness
    const notesRate = (logsWithNotes / totalLogs) * 100;
    const severityRate = (logsWithSeverity / totalLogs) * 100;
    const multiSymptomRate = (logsWithMultipleSymptoms / totalLogs) * 100;

    const score = Math.round(
      (notesRate * 0.4) +
      (severityRate * 0.3) +
      (multiSymptomRate * 0.3)
    );

    const rating = this.getRating(score);

    return {
      score,
      logsWithNotes,
      logsWithSeverity,
      logsWithTriggers,
      logsWithMultipleSymptoms,
      totalLogs,
      averageDataPoints,
      rating,
    };
  }

  /**
   * Calculate pattern stability score
   */
  private static calculateStability(dailyLogs: DailyLog[]): StabilityScore {
    if (dailyLogs.length < 7) {
      return {
        score: 50,
        consistentSymptoms: 0,
        varianceCoefficient: 0,
        trendStability: 'variable',
        rating: 'Fair',
      };
    }

    // Calculate symptom consistency
    const symptomFrequency = new Map<string, number>();
    dailyLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomFrequency.set(
          symptom.symptomId,
          (symptomFrequency.get(symptom.symptomId) || 0) + 1
        );
      });
    });

    const consistentSymptoms = Array.from(symptomFrequency.values())
      .filter(count => count / dailyLogs.length >= 0.5).length;

    // Calculate severity variance
    const severities = dailyLogs.map(log => log.overallSeverity);
    const avgSeverity = severities.reduce((sum, s) => sum + s, 0) / severities.length;
    const variance = severities.reduce((sum, s) => sum + Math.pow(s - avgSeverity, 2), 0) / severities.length;
    const stdDev = Math.sqrt(variance);
    const varianceCoefficient = avgSeverity > 0 ? stdDev / avgSeverity : 0;

    // Determine trend stability
    const quarterSize = Math.floor(dailyLogs.length / 4);
    const firstQuarter = dailyLogs.slice(0, quarterSize);
    const lastQuarter = dailyLogs.slice(-quarterSize);
    
    const firstAvg = firstQuarter.reduce((sum, log) => sum + log.overallSeverity, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, log) => sum + log.overallSeverity, 0) / lastQuarter.length;
    
    let trendStability: 'stable' | 'improving' | 'worsening' | 'variable';
    if (Math.abs(lastAvg - firstAvg) < 1) trendStability = 'stable';
    else if (lastAvg < firstAvg - 1) trendStability = 'improving';
    else if (lastAvg > firstAvg + 1) trendStability = 'worsening';
    else trendStability = 'variable';

    // Score: stable/worsening patterns are more credible for disability claims
    let score = 0;
    if (trendStability === 'stable' || trendStability === 'worsening') score += 50;
    else if (trendStability === 'improving') score += 30;
    else score += 20;

    // Add points for consistent symptoms
    score += Math.min(30, consistentSymptoms * 10);

    // Add points for low variance (more consistent = more credible)
    if (varianceCoefficient < 0.3) score += 20;
    else if (varianceCoefficient < 0.5) score += 10;

    score = Math.min(100, score);

    const rating = this.getRating(score);

    return {
      score,
      consistentSymptoms,
      varianceCoefficient: Math.round(varianceCoefficient * 100) / 100,
      trendStability,
      rating,
    };
  }

  /**
   * Calculate corroborating evidence score
   */
  private static calculateEvidence(
    activityLogs: ActivityLog[],
    medications: Medication[],
    limitations: Limitation[]
  ): EvidenceScore {
    const hasMedications = medications.length > 0;
    const hasActiveLimitations = limitations.filter(l => l.isActive).length > 0;
    const hasActivityLogs = activityLogs.length > 0;
    
    const medicationCount = medications.length;
    const limitationCount = limitations.filter(l => l.isActive).length;
    const activityLogCount = activityLogs.length;

    let score = 0;
    
    // Medications (important corroboration)
    if (medicationCount >= 3) score += 40;
    else if (medicationCount >= 2) score += 30;
    else if (medicationCount >= 1) score += 20;

    // Active limitations (shows functional impact)
    if (limitationCount >= 5) score += 30;
    else if (limitationCount >= 3) score += 20;
    else if (limitationCount >= 1) score += 10;

    // Activity logs (shows attempted activities and impact)
    if (activityLogCount >= 20) score += 30;
    else if (activityLogCount >= 10) score += 20;
    else if (activityLogCount >= 5) score += 10;

    score = Math.min(100, score);

    const rating = this.getRating(score);

    return {
      score,
      hasMedications,
      hasActiveLimitations,
      hasActivityLogs,
      medicationCount,
      limitationCount,
      activityLogCount,
      rating,
    };
  }

  /**
   * Generate recommendations for improving credibility
   */
  private static generateRecommendations(indicators: CredibilityIndicators): string[] {
    const recommendations: string[] = [];

    // Consistency recommendations
    if (indicators.loggingConsistency.score < 70) {
      if (indicators.loggingConsistency.loggingRate < 50) {
        recommendations.push('Log symptoms more consistently. Aim for at least 3-4 entries per week.');
      }
      if (indicators.loggingConsistency.longestGap > 14) {
        recommendations.push('Avoid long gaps in logging. Large gaps reduce claim credibility.');
      }
    }

    // Coverage recommendations
    if (indicators.durationCoverage.score < 80) {
      if (indicators.durationCoverage.totalMonthsCovered < 12) {
        recommendations.push(`Continue logging to reach 12+ months of data. Currently at ${indicators.durationCoverage.totalMonthsCovered} months.`);
      }
    }

    // Completeness recommendations
    if (indicators.dataCompleteness.score < 70) {
      if (indicators.dataCompleteness.logsWithNotes / indicators.dataCompleteness.totalLogs < 0.5) {
        recommendations.push('Add detailed notes to more log entries. Specific examples strengthen your case.');
      }
      if (indicators.dataCompleteness.logsWithMultipleSymptoms / indicators.dataCompleteness.totalLogs < 0.5) {
        recommendations.push('Track multiple symptoms when present. Co-occurring symptoms demonstrate impact.');
      }
    }

    // Evidence recommendations
    if (indicators.corroboratingEvidence.score < 60) {
      if (!indicators.corroboratingEvidence.hasMedications) {
        recommendations.push('Add your medications to show treatment compliance.');
      }
      if (!indicators.corroboratingEvidence.hasActiveLimitations) {
        recommendations.push('Document functional limitations to demonstrate daily impact.');
      }
      if (!indicators.corroboratingEvidence.hasActivityLogs) {
        recommendations.push('Log activities and their impact to show functional capacity.');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent documentation! Continue logging consistently to maintain strong evidence.');
    }

    return recommendations;
  }

  /**
   * Get overall grade from score
   */
  private static getGrade(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  /**
   * Get rating from score
   */
  private static getRating(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    return this.getGrade(score);
  }
}
