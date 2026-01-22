/**
 * Pattern Detector
 * Identifies patterns in symptoms, activities, and limitations
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { getSymptomById } from '../data/symptoms';
import { getDaysBetween } from '../utils/dates';

export interface SymptomPattern {
  symptomId: string;
  symptomName: string;
  frequency: number; // percentage of logs
  averageSeverity: number;
  peakSeverity: number;
  trend: 'improving' | 'worsening' | 'stable';
  consistency: 'consistent' | 'variable' | 'sporadic';
}

export interface ActivityPattern {
  activityId: string;
  activityName: string;
  attempts: number;
  completionRate: number;
  averageDuration: number;
  averageImpact: number;
  durationThreshold?: number;
  impactThreshold?: number;
}

export interface TriggerPattern {
  trigger: string;
  occurrences: number;
  averageSeverity: number;
  reliability: number; // percentage of times it preceded symptoms
}

export interface TimePattern {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  frequency: number;
  averageSeverity: number;
}

export interface RecoveryPattern {
  actionId: string;
  actionName: string;
  timesUsed: number;
  effectiveness: number; // percentage of times marked as helpful
  averageRecoveryDuration: number;
}

export class PatternDetector {
  /**
   * Detect symptom patterns from daily logs
   */
  static analyzeSymptomPatterns(logs: DailyLog[]): SymptomPattern[] {
    if (logs.length === 0) return [];

    // Collect all unique symptoms
    const symptomMap = new Map<string, {
      occurrences: number;
      totalSeverity: number;
      peakSeverity: number;
      severities: Array<{ date: string; severity: number }>;
    }>();

    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        const existing = symptomMap.get(symptom.symptomId) || {
          occurrences: 0,
          totalSeverity: 0,
          peakSeverity: 0,
          severities: [],
        };

        existing.occurrences++;
        existing.totalSeverity += symptom.severity;
        existing.peakSeverity = Math.max(existing.peakSeverity, symptom.severity);
        existing.severities.push({ date: log.logDate, severity: symptom.severity });

        symptomMap.set(symptom.symptomId, existing);
      });
    });

    // Convert to patterns
    const patterns: SymptomPattern[] = [];

    symptomMap.forEach((data, symptomId) => {
      const symptomDef = getSymptomById(symptomId);
      const frequency = Math.round((data.occurrences / logs.length) * 100);
      const averageSeverity = Math.round(data.totalSeverity / data.occurrences);

      // Determine trend
      let trend: 'improving' | 'worsening' | 'stable' = 'stable';
      if (data.severities.length >= 3) {
        const sorted = [...data.severities].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
        const lastThird = sorted.slice(-Math.floor(sorted.length / 3));
        
        const firstAvg = firstThird.reduce((sum, s) => sum + s.severity, 0) / firstThird.length;
        const lastAvg = lastThird.reduce((sum, s) => sum + s.severity, 0) / lastThird.length;
        
        if (lastAvg < firstAvg - 1) trend = 'improving';
        else if (lastAvg > firstAvg + 1) trend = 'worsening';
      }

      // Determine consistency
      let consistency: 'consistent' | 'variable' | 'sporadic';
      if (frequency >= 75) consistency = 'consistent';
      else if (frequency >= 25) consistency = 'variable';
      else consistency = 'sporadic';

      patterns.push({
        symptomId,
        symptomName: symptomDef?.name || symptomId,
        frequency,
        averageSeverity,
        peakSeverity: data.peakSeverity,
        trend,
        consistency,
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Detect activity impact patterns
   */
  static analyzeActivityPatterns(logs: ActivityLog[]): ActivityPattern[] {
    if (logs.length === 0) return [];

    const activityMap = new Map<string, {
      attempts: number;
      completions: number;
      totalDuration: number;
      totalImpact: number;
      durations: number[];
      impacts: number[];
    }>();

    logs.forEach(log => {
      const existing = activityMap.get(log.activityId) || {
        attempts: 0,
        completions: 0,
        totalDuration: 0,
        totalImpact: 0,
        durations: [],
        impacts: [],
      };

      existing.attempts++;
      if (!log.stoppedEarly) existing.completions++;
      existing.totalDuration += log.duration;
      existing.durations.push(log.duration);
      
      const maxImpact = Math.max(
        log.immediateImpact.overallImpact,
        log.delayedImpact?.overallImpact || 0
      );
      existing.totalImpact += maxImpact;
      existing.impacts.push(maxImpact);

      activityMap.set(log.activityId, existing);
    });

    const patterns: ActivityPattern[] = [];

    activityMap.forEach((data, activityId) => {
      const activityLog = logs.find(l => l.activityId === activityId);
      if (!activityLog) return;

      const completionRate = Math.round((data.completions / data.attempts) * 100);
      const averageDuration = Math.round(data.totalDuration / data.attempts);
      const averageImpact = Math.round(data.totalImpact / data.attempts);

      // Find duration threshold (where impact becomes significant)
      let durationThreshold: number | undefined;
      const sortedByDuration = [...logs]
        .filter(l => l.activityId === activityId)
        .sort((a, b) => a.duration - b.duration);

      for (const log of sortedByDuration) {
        const impact = Math.max(
          log.immediateImpact.overallImpact,
          log.delayedImpact?.overallImpact || 0
        );
        if (impact >= 5) {
          durationThreshold = log.duration;
          break;
        }
      }

      patterns.push({
        activityId,
        activityName: activityLog.activityName,
        attempts: data.attempts,
        completionRate,
        averageDuration,
        averageImpact,
        durationThreshold,
      });
    });

    return patterns.sort((a, b) => b.attempts - a.attempts);
  }

  /**
   * Detect trigger patterns
   */
  static analyzeTriggerPatterns(logs: DailyLog[]): TriggerPattern[] {
    if (logs.length === 0) return [];

    const triggerMap = new Map<string, {
      occurrences: number;
      totalSeverity: number;
      withSignificantSymptoms: number;
    }>();

    logs.forEach(log => {
      log.triggers?.forEach(trigger => {
        const existing = triggerMap.get(trigger) || {
          occurrences: 0,
          totalSeverity: 0,
          withSignificantSymptoms: 0,
        };

        existing.occurrences++;
        existing.totalSeverity += log.overallSeverity;
        if (log.overallSeverity >= 5) existing.withSignificantSymptoms++;

        triggerMap.set(trigger, existing);
      });
    });

    const patterns: TriggerPattern[] = [];

    triggerMap.forEach((data, trigger) => {
      const averageSeverity = Math.round(data.totalSeverity / data.occurrences);
      const reliability = Math.round((data.withSignificantSymptoms / data.occurrences) * 100);

      patterns.push({
        trigger,
        occurrences: data.occurrences,
        averageSeverity,
        reliability,
      });
    });

    return patterns.sort((a, b) => b.reliability - a.reliability);
  }

  /**
   * Detect time of day patterns
   */
  static analyzeTimePatterns(logs: DailyLog[]): TimePattern[] {
    const timeMap = new Map<string, {
      count: number;
      totalSeverity: number;
    }>();

    logs.forEach(log => {
      if (log.timeOfDay !== 'specific') {
        const existing = timeMap.get(log.timeOfDay) || {
          count: 0,
          totalSeverity: 0,
        };

        existing.count++;
        existing.totalSeverity += log.overallSeverity;

        timeMap.set(log.timeOfDay, existing);
      }
    });

    const patterns: TimePattern[] = [];

    timeMap.forEach((data, timeOfDay) => {
      patterns.push({
        timeOfDay: timeOfDay as any,
        frequency: Math.round((data.count / logs.length) * 100),
        averageSeverity: Math.round(data.totalSeverity / data.count),
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Detect recovery action effectiveness
   */
  static analyzeRecoveryPatterns(logs: ActivityLog[]): RecoveryPattern[] {
    const recoveryMap = new Map<string, {
      timesUsed: number;
      timesHelpful: number;
      totalDuration: number;
      durationCount: number;
    }>();

    logs.forEach(log => {
      log.recoveryActions.forEach(action => {
        const existing = recoveryMap.get(action.actionId) || {
          timesUsed: 0,
          timesHelpful: 0,
          totalDuration: 0,
          durationCount: 0,
        };

        existing.timesUsed++;
        if (action.helpful) existing.timesHelpful++;
        if (action.duration) {
          existing.totalDuration += action.duration;
          existing.durationCount++;
        }

        recoveryMap.set(action.actionId, existing);
      });
    });

    const patterns: RecoveryPattern[] = [];

    recoveryMap.forEach((data, actionId) => {
      const actionLog = logs
        .flatMap(l => l.recoveryActions)
        .find(a => a.actionId === actionId);
      
      if (!actionLog) return;

      const effectiveness = Math.round((data.timesHelpful / data.timesUsed) * 100);
      const averageRecoveryDuration = data.durationCount > 0
        ? Math.round(data.totalDuration / data.durationCount)
        : 0;

      patterns.push({
        actionId,
        actionName: actionLog.actionName,
        timesUsed: data.timesUsed,
        effectiveness,
        averageRecoveryDuration,
      });
    });

    return patterns.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Detect week patterns (lower-impact vs higher-impact days)
   */
  static analyzeWeeklyPatterns(logs: DailyLog[]): {
    goodDays: number;
    badDays: number;
    averageGoodDaySeverity: number;
    averageBadDaySeverity: number;
  } {
    if (logs.length === 0) {
      return {
        goodDays: 0,
        badDays: 0,
        averageGoodDaySeverity: 0,
        averageBadDaySeverity: 0,
      };
    }

    const goodDayLogs = logs.filter(log => log.overallSeverity < 5);
    const badDayLogs = logs.filter(log => log.overallSeverity >= 5);

    const avgGood = goodDayLogs.length > 0
      ? goodDayLogs.reduce((sum, log) => sum + log.overallSeverity, 0) / goodDayLogs.length
      : 0;

    const avgBad = badDayLogs.length > 0
      ? badDayLogs.reduce((sum, log) => sum + log.overallSeverity, 0) / badDayLogs.length
      : 0;

    return {
      goodDays: goodDayLogs.length,
      badDays: badDayLogs.length,
      averageGoodDaySeverity: Math.round(avgGood),
      averageBadDaySeverity: Math.round(avgBad),
    };
  }

  /**
   * Detect cumulative effect patterns
   */
  static analyzeCumulativeEffects(logs: ActivityLog[]): {
    hasCumulativeEffect: boolean;
    description: string;
  } {
    if (logs.length < 3) {
      return {
        hasCumulativeEffect: false,
        description: 'Insufficient data to determine cumulative effects',
      };
    }

    // Sort by date
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime()
    );

    // Look for pattern where consecutive days show increasing impact
    let consecutiveDaysIncreasing = 0;
    let maxConsecutive = 0;

    for (let i = 1; i < sortedLogs.length; i++) {
      const prev = sortedLogs[i - 1];
      const curr = sortedLogs[i];

      const prevImpact = Math.max(
        prev.immediateImpact.overallImpact,
        prev.delayedImpact?.overallImpact || 0
      );

      const currImpact = Math.max(
        curr.immediateImpact.overallImpact,
        curr.delayedImpact?.overallImpact || 0
      );

      // Check if activities are on consecutive or close days
      const daysBetween = getDaysBetween(prev.activityDate, curr.activityDate);

      if (daysBetween <= 2 && currImpact > prevImpact) {
        consecutiveDaysIncreasing++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveDaysIncreasing);
      } else {
        consecutiveDaysIncreasing = 0;
      }
    }

    if (maxConsecutive >= 2) {
      return {
        hasCumulativeEffect: true,
        description: `Activity impact tends to increase with consecutive day exertion, suggesting cumulative fatigue effects`,
      };
    }

    return {
      hasCumulativeEffect: false,
      description: 'No clear cumulative effect pattern detected',
    };
  }
}
