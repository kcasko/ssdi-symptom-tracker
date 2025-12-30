/**
 * Analysis Service
 * Coordinates analysis across symptoms, activities, and limitations
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { SymptomEngine, SymptomSummary, DailyOverview } from '../engine/SymptomEngine';
import { ActivityImpactEngine, ActivityImpactAnalysis, OverallFunctionalCapacity } from '../engine/ActivityImpactEngine';
import { LimitationAnalyzer, LimitationSummary, RFCAssessment } from '../engine/LimitationAnalyzer';
import { PatternDetector, SymptomPattern, ActivityPattern, TimeOfDayPattern, TriggerPattern, RecoveryPattern } from '../engine/PatternDetector';

export interface ComprehensiveAnalysis {
  // Date range
  dateRange: {
    start: string;
    end: string;
  };
  
  // Symptom analysis
  symptoms: {
    summary: SymptomSummary[];
    patterns: SymptomPattern[];
    clusters: Array<{ symptomNames: string[]; coOccurrenceRate: number }>;
    dayRatio: { goodDays: number; badDays: number; badDayPercentage: number };
  };
  
  // Activity analysis
  activities: {
    analyses: ActivityImpactAnalysis[];
    patterns: ActivityPattern[];
    functionalCapacity: OverallFunctionalCapacity;
  };
  
  // Limitation analysis
  limitations: {
    summaries: LimitationSummary[];
    rfc: RFCAssessment;
  };
  
  // Pattern detection
  patterns: {
    timeOfDay: TimeOfDayPattern[];
    triggers: TriggerPattern[];
    recovery: RecoveryPattern[];
  };
  
  // Overall assessment
  overall: {
    totalDays: number;
    totalSymptoms: number;
    totalActivities: number;
    totalLimitations: number;
    workCapacity: 'full' | 'modified' | 'part-time' | 'unable';
  };
}

export class AnalysisService {
  /**
   * Run comprehensive analysis on all data
   */
  static async runComprehensiveAnalysis(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    dateRange: { start: string; end: string }
  ): Promise<ComprehensiveAnalysis> {
    // Filter logs to date range
    const filteredDailyLogs = dailyLogs.filter(log =>
      log.logDate >= dateRange.start && log.logDate <= dateRange.end
    );

    const filteredActivityLogs = activityLogs.filter(log =>
      log.activityDate >= dateRange.start && log.activityDate <= dateRange.end
    );

    // Symptom analysis
    const symptomReport = SymptomEngine.generateSymptomReport(filteredDailyLogs, dateRange);
    const symptomPatterns = PatternDetector.detectSymptomPatterns(filteredDailyLogs);

    // Activity analysis
    const activityIds = Array.from(
      new Set(filteredActivityLogs.map(log => log.activityId))
    );

    const activityAnalyses = activityIds
      .map(id => ActivityImpactEngine.analyzeActivity(id, filteredActivityLogs))
      .filter((a): a is ActivityImpactAnalysis => a !== null);

    const activityPatterns = PatternDetector.detectActivityImpactPatterns(filteredActivityLogs);
    const functionalCapacity = ActivityImpactEngine.analyzeFunctionalCapacity(
      filteredActivityLogs,
      filteredDailyLogs,
      dateRange
    );

    // Limitation analysis
    const activeLimitations = limitations.filter(l => l.isActive);
    const limitationSummaries = activeLimitations.map(l =>
      LimitationAnalyzer.analyzeLimitation(l)
    );

    const rfc = LimitationAnalyzer.generateRFCAssessment(
      activeLimitations,
      filteredActivityLogs,
      filteredDailyLogs
    );

    // Pattern detection
    const timeOfDayPatterns = PatternDetector.analyzeTimeOfDayPatterns(filteredDailyLogs);
    const triggers = PatternDetector.identifyTriggers(filteredDailyLogs, filteredActivityLogs);
    const recovery = PatternDetector.analyzeRecoveryPatterns(filteredDailyLogs);

    // Overall assessment
    const totalDays = filteredDailyLogs.length;
    const uniqueSymptoms = Array.from(
      new Set(filteredDailyLogs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    const analysis: ComprehensiveAnalysis = {
      dateRange,
      symptoms: {
        summary: symptomReport.topSymptoms,
        patterns: symptomPatterns,
        clusters: symptomReport.clusters,
        dayRatio: symptomReport.dayRatio,
      },
      activities: {
        analyses: activityAnalyses,
        patterns: activityPatterns,
        functionalCapacity,
      },
      limitations: {
        summaries: limitationSummaries,
        rfc,
      },
      patterns: {
        timeOfDay: timeOfDayPatterns,
        triggers,
        recovery,
      },
      overall: {
        totalDays,
        totalSymptoms: uniqueSymptoms.length,
        totalActivities: activityIds.length,
        totalLimitations: activeLimitations.length,
        workCapacity: functionalCapacity.sustainedWorkAbility,
      },
    };

    return analysis;
  }

  /**
   * Get daily overview for a specific date
   */
  static getDailyOverview(date: string, dailyLogs: DailyLog[]): DailyOverview | null {
    const log = dailyLogs.find(l => l.logDate === date);
    if (!log) return null;

    return SymptomEngine.generateDailyOverview(log);
  }

  /**
   * Get symptom summary for a specific symptom
   */
  static getSymptomSummary(
    symptomId: string,
    dailyLogs: DailyLog[],
    dateRange?: { start: string; end: string }
  ): SymptomSummary | null {
    let filteredLogs = dailyLogs;

    if (dateRange) {
      filteredLogs = dailyLogs.filter(log =>
        log.logDate >= dateRange.start && log.logDate <= dateRange.end
      );
    }

    return SymptomEngine.summarizeSymptom(symptomId, filteredLogs);
  }

  /**
   * Get activity impact analysis for a specific activity
   */
  static getActivityAnalysis(
    activityId: string,
    activityLogs: ActivityLog[],
    dateRange?: { start: string; end: string }
  ): ActivityImpactAnalysis | null {
    let filteredLogs = activityLogs;

    if (dateRange) {
      filteredLogs = activityLogs.filter(log =>
        log.activityDate >= dateRange.start && log.activityDate <= dateRange.end
      );
    }

    return ActivityImpactEngine.analyzeActivity(activityId, filteredLogs);
  }

  /**
   * Identify worsening trends
   */
  static identifyWorseningTrends(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[]
  ): {
    worseningSymptoms: SymptomSummary[];
    decliningActivities: Array<{
      activityId: string;
      activityName: string;
      trend: string;
    }>;
  } {
    // Find symptoms with worsening trends
    const allSymptomIds = Array.from(
      new Set(dailyLogs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    const worseningSymptoms = allSymptomIds
      .map(id => SymptomEngine.summarizeSymptom(id, dailyLogs))
      .filter((s): s is SymptomSummary => s !== null && s.trend === 'worsening');

    // Find activities with declining tolerance
    const activityIds = Array.from(
      new Set(activityLogs.map(log => log.activityId))
    );

    const decliningActivities = activityIds
      .map(id => {
        const trend = ActivityImpactEngine.analyzeActivityTrend(id, activityLogs);
        const firstLog = activityLogs.find(l => l.activityId === id);
        
        return {
          activityId: id,
          activityName: firstLog?.activityName || id,
          trend: trend.analysis,
        };
      })
      .filter(a => a.trend.includes('declining'));

    return {
      worseningSymptoms,
      decliningActivities,
    };
  }

  /**
   * Generate quick summary stats
   */
  static getQuickStats(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): {
    last7Days: {
      symptomCount: number;
      badDays: number;
      activitiesLogged: number;
    };
    last30Days: {
      symptomCount: number;
      badDays: number;
      activitiesLogged: number;
    };
    allTime: {
      totalLogs: number;
      totalSymptoms: number;
      totalLimitations: number;
    };
  } {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7DailyLogs = dailyLogs.filter(log =>
      new Date(log.logDate) >= sevenDaysAgo
    );
    const last30DailyLogs = dailyLogs.filter(log =>
      new Date(log.logDate) >= thirtyDaysAgo
    );

    const last7ActivityLogs = activityLogs.filter(log =>
      new Date(log.activityDate) >= sevenDaysAgo
    );
    const last30ActivityLogs = activityLogs.filter(log =>
      new Date(log.activityDate) >= thirtyDaysAgo
    );

    const last7BadDays = last7DailyLogs.filter(log => log.overallSeverity >= 7).length;
    const last30BadDays = last30DailyLogs.filter(log => log.overallSeverity >= 7).length;

    const uniqueSymptoms7 = Array.from(
      new Set(last7DailyLogs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );
    const uniqueSymptoms30 = Array.from(
      new Set(last30DailyLogs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    const allUniqueSymptoms = Array.from(
      new Set(dailyLogs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );

    const activeLimitations = limitations.filter(l => l.isActive);

    return {
      last7Days: {
        symptomCount: uniqueSymptoms7.length,
        badDays: last7BadDays,
        activitiesLogged: last7ActivityLogs.length,
      },
      last30Days: {
        symptomCount: uniqueSymptoms30.length,
        badDays: last30BadDays,
        activitiesLogged: last30ActivityLogs.length,
      },
      allTime: {
        totalLogs: dailyLogs.length,
        totalSymptoms: allUniqueSymptoms.length,
        totalLimitations: activeLimitations.length,
      },
    };
  }
}