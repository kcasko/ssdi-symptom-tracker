/**
 * Activity Impact Engine
 * Analyzes how activities affect symptoms and functional capacity
 */

import { ActivityLog, getWorstImpact, getTotalRecoveryTime } from '../domain/models/ActivityLog';
import { DailyLog } from '../domain/models/DailyLog';
import { isSameDayAs, getMinutesBetween } from '../utils/dates';

export interface ActivityImpactAnalysis {
  activityId: string;
  activityName: string;
  
  // Tolerance metrics
  averageDuration: number;
  maxDuration: number;
  safeThreshold?: number; // Duration before significant impact
  
  // Impact metrics
  averageImpact: number;
  maxImpact: number;
  consistentImpact: boolean;
  
  // Recovery metrics
  averageRecoveryTime: number;
  maxRecoveryTime: number;
  
  // Completion metrics
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  
  // Recommendations
  recommendation: 'safe' | 'limited' | 'problematic' | 'avoid';
  notes: string[];
}

export interface OverallFunctionalCapacity {
  // Work capacity category
  workCategory: 'sedentary' | 'light' | 'medium' | 'heavy' | 'very_heavy';
  
  // Duration tolerances
  sittingTolerance: number; // minutes
  standingTolerance: number; // minutes
  walkingTolerance: number; // minutes or blocks
  
  // Weight limitations
  liftingCapacity: number; // pounds
  carryingCapacity: number; // pounds
  
  // Frequency limitations
  breakFrequency: number; // minutes between required breaks
  workdayRestrictions: string[];
  
  // Overall assessment
  sustainedWorkAbility: 'full' | 'modified' | 'part-time' | 'unable';
  reliabilityScore: number; // 0-100
  accommodationsNeeded: string[];
}

export class ActivityImpactEngine {
  /**
   * Analyze impact of a specific activity
   */
  static analyzeActivity(
    activityId: string,
    logs: ActivityLog[]
  ): ActivityImpactAnalysis | null {
    const activityLogs = logs.filter(l => l.activityId === activityId);
    
    if (activityLogs.length === 0) return null;

    const firstLog = activityLogs[0];
    
    // Duration metrics
    const durations = activityLogs.map(l => l.duration);
    const averageDuration = Math.round(
      durations.reduce((sum, d) => sum + d, 0) / durations.length
    );
    const maxDuration = Math.max(...durations);

    // Impact metrics
    const impacts = activityLogs.map(l => getWorstImpact(l));
    const averageImpact = Math.round(
      impacts.reduce((sum, i) => sum + i, 0) / impacts.length
    );
    const maxImpact = Math.max(...impacts);

    // Check impact consistency
    const significantImpactCount = impacts.filter(i => i >= 5).length;
    const consistentImpact = (significantImpactCount / impacts.length) >= 0.7;

    // Find safe threshold
    let safeThreshold: number | undefined;
    const sortedByDuration = [...activityLogs].sort((a, b) => a.duration - b.duration);
    
    for (const log of sortedByDuration) {
      if (getWorstImpact(log) >= 5) {
        safeThreshold = log.duration;
        break;
      }
    }

    // Recovery metrics
    const recoveryTimes = activityLogs.map(l => getTotalRecoveryTime(l)).filter(t => t > 0);
    const averageRecoveryTime = recoveryTimes.length > 0
      ? Math.round(recoveryTimes.reduce((sum, t) => sum + t, 0) / recoveryTimes.length)
      : 0;
    const maxRecoveryTime = recoveryTimes.length > 0 ? Math.max(...recoveryTimes) : 0;

    // Completion metrics
    const totalAttempts = activityLogs.length;
    const completedAttempts = activityLogs.filter(l => !l.stoppedEarly).length;
    const completionRate = Math.round((completedAttempts / totalAttempts) * 100);

    // Generate recommendation
    let recommendation: ActivityImpactAnalysis['recommendation'];
    const notes: string[] = [];

    if (averageImpact < 3 && completionRate >= 80) {
      recommendation = 'safe';
      notes.push('Activity generally well-tolerated');
    } else if (averageImpact < 5 && completionRate >= 50) {
      recommendation = 'limited';
      notes.push('Activity tolerated with modifications');
      if (safeThreshold) {
        notes.push(`Limit duration to ${Math.round(safeThreshold * 0.8)} minutes`);
      }
    } else if (averageImpact < 7) {
      recommendation = 'problematic';
      notes.push('Activity causes significant symptoms');
      notes.push('Frequent breaks and rest periods required');
    } else {
      recommendation = 'avoid';
      notes.push('Activity consistently causes severe symptoms');
      notes.push('Not sustainable for regular performance');
    }

    if (completionRate < 50) {
      notes.push(`${100 - completionRate}% of attempts discontinued early`);
    }

    if (averageRecoveryTime > averageDuration) {
      notes.push('Recovery time exceeds activity duration');
    }

    return {
      activityId,
      activityName: firstLog.activityName,
      averageDuration,
      maxDuration,
      safeThreshold,
      averageImpact,
      maxImpact,
      consistentImpact,
      averageRecoveryTime,
      maxRecoveryTime,
      totalAttempts,
      completedAttempts,
      completionRate,
      recommendation,
      notes,
    };
  }

  /**
   * Analyze overall functional capacity
   */
  static analyzeFunctionalCapacity(
    activityLogs: ActivityLog[],
    dailyLogs: DailyLog[],
    dateRange: { start: string; end: string }
  ): OverallFunctionalCapacity {
    // Default conservative values
    let sittingTolerance = 30;
    let standingTolerance = 20;
    let walkingTolerance = 10; // blocks
    let liftingCapacity = 10; // pounds
    let carryingCapacity = 10;
    let breakFrequency = 30;

    // Analyze sitting activities
    const sittingActivities = activityLogs.filter(l => 
      ['desk_work', 'reading', 'watching_tv', 'driving'].includes(l.activityId)
    );

    if (sittingActivities.length > 0) {
      const safeSittingDurations = sittingActivities
        .filter(l => getWorstImpact(l) < 5)
        .map(l => l.duration);
      
      if (safeSittingDurations.length > 0) {
        sittingTolerance = Math.min(
          ...safeSittingDurations,
          120 // Cap at 2 hours
        );
      }
    }

    // Analyze standing activities
    const standingActivities = activityLogs.filter(l =>
      ['standing_work', 'cooking', 'dishes'].includes(l.activityId)
    );

    if (standingActivities.length > 0) {
      const safeStandingDurations = standingActivities
        .filter(l => getWorstImpact(l) < 5)
        .map(l => l.duration);
      
      if (safeStandingDurations.length > 0) {
        standingTolerance = Math.min(
          ...safeStandingDurations,
          60 // Cap at 1 hour
        );
      }
    }

    // Analyze walking
    const walkingActivities = activityLogs.filter(l => l.activityId === 'walking');
    if (walkingActivities.length > 0) {
      const safeWalkingDurations = walkingActivities
        .filter(l => getWorstImpact(l) < 5)
        .map(l => l.duration);
      
      if (safeWalkingDurations.length > 0) {
        const avgSafeDuration = Math.round(
          safeWalkingDurations.reduce((sum, d) => sum + d, 0) / safeWalkingDurations.length
        );
        // Rough conversion: 20 minutes = 1 block
        walkingTolerance = Math.max(1, Math.round(avgSafeDuration / 20));
      }
    }

    // Determine work category
    let workCategory: OverallFunctionalCapacity['workCategory'];
    
    if (liftingCapacity <= 10 && sittingTolerance >= 60) {
      workCategory = 'sedentary';
    } else if (liftingCapacity <= 20) {
      workCategory = 'light';
    } else if (liftingCapacity <= 50) {
      workCategory = 'medium';
    } else if (liftingCapacity <= 100) {
      workCategory = 'heavy';
    } else {
      workCategory = 'very_heavy';
    }

    // Calculate reliability score
    const totalDays = dailyLogs.length;
    const goodDays = dailyLogs.filter(l => l.overallSeverity < 5).length;
    const reliabilityScore = totalDays > 0 
      ? Math.round((goodDays / totalDays) * 100)
      : 0;

    // Determine sustained work ability
    let sustainedWorkAbility: OverallFunctionalCapacity['sustainedWorkAbility'];
    
    if (reliabilityScore >= 80 && sittingTolerance >= 120) {
      sustainedWorkAbility = 'full';
    } else if (reliabilityScore >= 60 && sittingTolerance >= 60) {
      sustainedWorkAbility = 'modified';
    } else if (reliabilityScore >= 40) {
      sustainedWorkAbility = 'part-time';
    } else {
      sustainedWorkAbility = 'unable';
    }

    // Generate accommodations
    const accommodations: string[] = [];
    
    if (sittingTolerance < 60) {
      accommodations.push('Sit/stand desk or frequent position changes');
    }
    
    if (standingTolerance < 30) {
      accommodations.push('Stool or chair for standing tasks');
    }
    
    if (reliabilityScore < 80) {
      accommodations.push('Flexible attendance policy');
    }
    
    if (breakFrequency < 60) {
      accommodations.push(`Breaks every ${breakFrequency} minutes`);
    }

    // Generate workday restrictions
    const restrictions: string[] = [];
    
    if (sustainedWorkAbility === 'part-time') {
      restrictions.push('Part-time hours only (4-6 hours/day max)');
    }
    
    if (reliabilityScore < 60) {
      restrictions.push('Unpredictable absences expected');
    }
    
    if (sittingTolerance < 60 && standingTolerance < 30) {
      restrictions.push('Cannot maintain one position for extended periods');
    }

    return {
      workCategory,
      sittingTolerance,
      standingTolerance,
      walkingTolerance,
      liftingCapacity,
      carryingCapacity,
      breakFrequency,
      workdayRestrictions: restrictions,
      sustainedWorkAbility,
      reliabilityScore,
      accommodationsNeeded: accommodations,
    };
  }

  /**
   * Compare activity performance over time
   */
  static analyzeActivityTrend(
    activityId: string,
    logs: ActivityLog[]
  ): {
    trend: 'improving' | 'worsening' | 'stable';
    analysis: string;
  } {
    const activityLogs = logs
      .filter(l => l.activityId === activityId)
      .sort((a, b) => new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime());

    if (activityLogs.length < 3) {
      return {
        trend: 'stable',
        analysis: 'Insufficient data to determine trend',
      };
    }

    // Compare first third to last third
    const thirdSize = Math.floor(activityLogs.length / 3);
    const firstThird = activityLogs.slice(0, thirdSize);
    const lastThird = activityLogs.slice(-thirdSize);

    const firstAvgImpact = firstThird.reduce((sum, l) => sum + getWorstImpact(l), 0) / firstThird.length;
    const lastAvgImpact = lastThird.reduce((sum, l) => sum + getWorstImpact(l), 0) / lastThird.length;

    const firstAvgDuration = firstThird.reduce((sum, l) => sum + l.duration, 0) / firstThird.length;
    const lastAvgDuration = lastThird.reduce((sum, l) => sum + l.duration, 0) / lastThird.length;

    if (lastAvgImpact < firstAvgImpact - 1 || lastAvgDuration > firstAvgDuration + 10) {
      return {
        trend: 'improving',
        analysis: 'Activity tolerance shows improvement over time',
      };
    } else if (lastAvgImpact > firstAvgImpact + 1 || lastAvgDuration < firstAvgDuration - 10) {
      return {
        trend: 'worsening',
        analysis: 'Activity tolerance declining over time',
      };
    }

    return {
      trend: 'stable',
      analysis: 'Activity tolerance remains relatively stable',
    };
  }
}