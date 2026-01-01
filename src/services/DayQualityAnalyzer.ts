/**
 * Day Quality Analyzer
 * Classifies days as good, bad, or neutral based on symptom data
 * Critical for SSDI documentation showing functional capacity
 */

import { DailyLog } from '../domain/models/DailyLog';

export type DayQuality = 'good' | 'neutral' | 'bad' | 'very-bad';

export interface DayClassification {
  date: string;
  quality: DayQuality;
  overallSeverity: number;
  symptomCount: number;
  reasons: string[];
  functionalImpact: number; // 0-10 scale of how much symptoms affected daily function
}

export interface DayRatios {
  totalDays: number;
  goodDays: number;
  neutralDays: number;
  badDays: number;
  veryBadDays: number;
  goodDayPercentage: number;
  badDayPercentage: number;
  functionalDaysPercentage: number; // Good + Neutral days
  averageSeverity: number;
  worstStreak: number; // Longest consecutive bad days
  bestStreak: number; // Longest consecutive good days
}

export interface TimeRangeRatios {
  last7Days: DayRatios;
  last30Days: DayRatios;
  last90Days: DayRatios;
  allTime: DayRatios;
}

// Configurable thresholds for day classification
export interface DayClassificationCriteria {
  // Severity thresholds (0-10 scale)
  goodDayMaxSeverity: number;
  badDayMinSeverity: number;
  veryBadDayMinSeverity: number;
  
  // Symptom count thresholds
  goodDayMaxSymptoms: number;
  badDayMinSymptoms: number;
  
  // High-impact symptoms that automatically make a day "bad"
  highImpactSymptoms: string[];
  
  // Minimum functional capacity for "good" day
  minFunctionalCapacity: number;
}

// Default SSDI-focused criteria
const DEFAULT_CRITERIA: DayClassificationCriteria = {
  goodDayMaxSeverity: 3,
  badDayMinSeverity: 6,
  veryBadDayMinSeverity: 8,
  goodDayMaxSymptoms: 2,
  badDayMinSymptoms: 4,
  highImpactSymptoms: [
    'severe-fatigue',
    'cognitive-dysfunction',
    'severe-pain',
    'mobility-limitation'
  ],
  minFunctionalCapacity: 7,
};

export class DayQualityAnalyzer {
  private criteria: DayClassificationCriteria;

  constructor(criteria: DayClassificationCriteria = DEFAULT_CRITERIA) {
    this.criteria = criteria;
  }

  /**
   * Classify a single day based on daily log data
   */
  classifyDay(dailyLog: DailyLog): DayClassification {
    const reasons: string[] = [];
    let functionalImpact = 0;

    // Calculate base metrics
    const symptomCount = dailyLog.symptoms.length;
    const overallSeverity = dailyLog.overallSeverity;
    
    // No symptoms = good day (but check for other factors)
    if (symptomCount === 0) {
      return {
        date: dailyLog.logDate,
        quality: 'good',
        overallSeverity: 0,
        symptomCount: 0,
        reasons: ['No symptoms reported'],
        functionalImpact: 0,
      };
    }

    // Check for high-impact symptoms
    const hasHighImpactSymptom = dailyLog.symptoms.some(s => 
      this.criteria.highImpactSymptoms.includes(s.symptomId)
    );

    if (hasHighImpactSymptom) {
      reasons.push('High-impact symptoms present');
      functionalImpact += 3;
    }

    // Evaluate severity
    if (overallSeverity >= this.criteria.veryBadDayMinSeverity) {
      reasons.push(`Very high severity (${overallSeverity}/10)`);
      functionalImpact += 4;
    } else if (overallSeverity >= this.criteria.badDayMinSeverity) {
      reasons.push(`High severity (${overallSeverity}/10)`);
      functionalImpact += 2;
    } else if (overallSeverity <= this.criteria.goodDayMaxSeverity) {
      reasons.push(`Low severity (${overallSeverity}/10)`);
      functionalImpact -= 1;
    }

    // Evaluate symptom count
    if (symptomCount >= this.criteria.badDayMinSymptoms) {
      reasons.push(`Many symptoms (${symptomCount})`);
      functionalImpact += 2;
    } else if (symptomCount <= this.criteria.goodDayMaxSymptoms) {
      reasons.push(`Few symptoms (${symptomCount})`);
      functionalImpact -= 1;
    }

    // Check for severe individual symptoms (8+ severity)
    const severeSymptoms = dailyLog.symptoms.filter(s => s.severity >= 8);
    if (severeSymptoms.length > 0) {
      reasons.push(`${severeSymptoms.length} severe symptom(s)`);
      functionalImpact += severeSymptoms.length;
    }

    // Check for notes indicating functional limitation
    if (dailyLog.notes) {
      const limitationKeywords = [
        'bed', 'rest', 'unable', 'cannot', 'difficult', 'struggle',
        'cancelled', 'missed', 'exhausted', 'overwhelming'
      ];
      
      const hasLimitationLanguage = limitationKeywords.some(keyword => 
        dailyLog.notes!.toLowerCase().includes(keyword)
      );

      if (hasLimitationLanguage) {
        reasons.push('Functional limitations noted');
        functionalImpact += 2;
      }
    }

    // Determine quality based on functional impact
    functionalImpact = Math.max(0, Math.min(10, functionalImpact));
    
    let quality: DayQuality;
    if (functionalImpact >= 7 || overallSeverity >= this.criteria.veryBadDayMinSeverity) {
      quality = 'very-bad';
    } else if (functionalImpact >= 4 || overallSeverity >= this.criteria.badDayMinSeverity) {
      quality = 'bad';
    } else if (functionalImpact <= 1 && overallSeverity <= this.criteria.goodDayMaxSeverity) {
      quality = 'good';
    } else {
      quality = 'neutral';
    }

    return {
      date: dailyLog.logDate,
      quality,
      overallSeverity,
      symptomCount,
      reasons,
      functionalImpact,
    };
  }

  /**
   * Calculate day ratios for a set of daily logs
   */
  calculateDayRatios(dailyLogs: DailyLog[]): DayRatios {
    if (dailyLogs.length === 0) {
      return {
        totalDays: 0,
        goodDays: 0,
        neutralDays: 0,
        badDays: 0,
        veryBadDays: 0,
        goodDayPercentage: 0,
        badDayPercentage: 0,
        functionalDaysPercentage: 0,
        averageSeverity: 0,
        worstStreak: 0,
        bestStreak: 0,
      };
    }

    const classifications = dailyLogs
      .map(log => this.classifyDay(log))
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.date).getTime());

    const totalDays = classifications.length;
    const goodDays = classifications.filter(c => c.quality === 'good').length;
    const neutralDays = classifications.filter(c => c.quality === 'neutral').length;
    const badDays = classifications.filter(c => c.quality === 'bad').length;
    const veryBadDays = classifications.filter(c => c.quality === 'very-bad').length;

    const goodDayPercentage = (goodDays / totalDays) * 100;
    const badDayPercentage = ((badDays + veryBadDays) / totalDays) * 100;
    const functionalDaysPercentage = ((goodDays + neutralDays) / totalDays) * 100;

    const averageSeverity = dailyLogs.reduce((sum, log) => sum + log.overallSeverity, 0) / totalDays;

    const worstStreak = this.calculateWorstStreak(classifications);
    const bestStreak = this.calculateBestStreak(classifications);

    return {
      totalDays,
      goodDays,
      neutralDays,
      badDays,
      veryBadDays,
      goodDayPercentage,
      badDayPercentage,
      functionalDaysPercentage,
      averageSeverity,
      worstStreak,
      bestStreak,
    };
  }

  /**
   * Calculate ratios for different time ranges
   */
  calculateTimeRangeRatios(dailyLogs: DailyLog[]): TimeRangeRatios {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const filterByDate = (logs: DailyLog[], startDate: Date) =>
      logs.filter(log => new Date(log.logDate) >= startDate);

    return {
      last7Days: this.calculateDayRatios(filterByDate(dailyLogs, last7Days)),
      last30Days: this.calculateDayRatios(filterByDate(dailyLogs, last30Days)),
      last90Days: this.calculateDayRatios(filterByDate(dailyLogs, last90Days)),
      allTime: this.calculateDayRatios(dailyLogs),
    };
  }

  /**
   * Calculate longest streak of bad/very-bad days
   */
  private calculateWorstStreak(classifications: DayClassification[]): number {
    let currentStreak = 0;
    let maxStreak = 0;

    for (const classification of classifications) {
      if (classification.quality === 'bad' || classification.quality === 'very-bad') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  /**
   * Calculate longest streak of good days
   */
  private calculateBestStreak(classifications: DayClassification[]): number {
    let currentStreak = 0;
    let maxStreak = 0;

    for (const classification of classifications) {
      if (classification.quality === 'good') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  /**
   * Generate SSDI-focused insights from day ratios
   */
  generateSSIDInsights(ratios: TimeRangeRatios): string[] {
    const insights: string[] = [];
    const recent = ratios.last30Days;

    // Bad day percentage insights
    if (recent.badDayPercentage >= 50) {
      insights.push(`Over ${recent.badDayPercentage.toFixed(0)}% of days in the last month were significantly impaired by symptoms.`);
    }

    if (recent.functionalDaysPercentage < 60) {
      insights.push(`Only ${recent.functionalDaysPercentage.toFixed(0)}% of days had adequate functional capacity for normal activities.`);
    }

    // Streak analysis
    if (recent.worstStreak >= 7) {
      insights.push(`Experienced ${recent.worstStreak} consecutive days of significant symptom impact.`);
    }

    if (recent.bestStreak <= 3 && recent.totalDays >= 14) {
      insights.push(`Longest period of good days was only ${recent.bestStreak} consecutive days.`);
    }

    // Severity patterns
    if (recent.averageSeverity >= 6) {
      insights.push(`Average daily symptom severity of ${recent.averageSeverity.toFixed(1)}/10 indicates substantial functional limitation.`);
    }

    // Consistency patterns
    const variability = Math.abs(ratios.last7Days.badDayPercentage - ratios.last30Days.badDayPercentage);
    if (variability < 10) {
      insights.push('Symptom patterns are consistent over time, indicating chronic condition stability.');
    }

    return insights;
  }
}