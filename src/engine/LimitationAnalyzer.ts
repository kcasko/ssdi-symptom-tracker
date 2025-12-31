/**
 * Limitation Analyzer
 * Analyzes functional limitations and RFC (Residual Functional Capacity)
 */

import { Limitation, getLimitationCategoryLabel } from '../domain/models/Limitation';
import { ActivityLog, getWorstImpact } from '../domain/models/ActivityLog';
import { DailyLog } from '../domain/models/DailyLog';

export interface LimitationSummary {
  category: string;
  categoryLabel: string;
  
  // Threshold info
  threshold: {
    type: 'time' | 'weight' | 'distance' | 'none';
    value: number;
    unit: string;
  };
  
  // Frequency
  frequency: string;
  frequencyScore: number; // 0-100
  
  // Consequences
  primaryConsequences: string[];
  
  // Severity assessment
  severity: 'mild' | 'moderate' | 'marked' | 'extreme';
  
  // Supporting evidence
  supportingLogs: string[]; // Log IDs that support this limitation
  evidenceCount: number;
}

export interface RFCAssessment {
  // Physical capacity
  physical: {
    exertionalLevel: 'sedentary' | 'light' | 'medium' | 'heavy' | 'very_heavy';
    sittingCapacity: string;
    standingCapacity: string;
    walkingCapacity: string;
    liftingCapacity: string;
    carryingCapacity: string;
    limitations: string[];
  };
  
  // Postural capacity
  postural: {
    climbing: string;
    balancing: string;
    stooping: string;
    kneeling: string;
    crouching: string;
    crawling: string;
  };
  
  // Manipulative capacity
  manipulative: {
    reaching: string;
    handling: string;
    fingering: string;
    feeling: string;
  };
  
  // Mental capacity
  mental: {
    understanding: string;
    memory: string;
    concentration: string;
    adaptation: string;
    limitations: string[];
  };
  
  // Work-related assessment
  work: {
    reliability: number; // 0-100
    attendance: string;
    pace: string;
    offTaskTime: string;
    absencesPerMonth: number;
  };
  
  // Overall conclusion
  conclusion: {
    canPerformFullTime: boolean;
    canPerformPartTime: boolean;
    sustainedWorkAbility: string;
    primaryBarriers: string[];
  };
}

export class LimitationAnalyzer {
  /**
   * Analyze a single functional limitation
   */
  static analyzeLimitation(
    limitation: Limitation,
    dailyLogs: DailyLog[] = [],
    activityLogs: ActivityLog[] = []
  ): LimitationSummary {
    // Determine threshold
    let threshold: LimitationSummary['threshold'];
    
    if (limitation.timeThreshold) {
      threshold = {
        type: 'time',
        value: limitation.timeThreshold.durationMinutes,
        unit: 'minutes',
      };
    } else if (limitation.weightThreshold) {
      threshold = {
        type: 'weight',
        value: limitation.weightThreshold.maxPounds,
        unit: 'pounds',
      };
    } else if (limitation.distanceThreshold) {
      threshold = {
        type: 'distance',
        value: limitation.distanceThreshold.maxBlocks || limitation.distanceThreshold.maxFeet || 0,
        unit: limitation.distanceThreshold.maxBlocks ? 'blocks' : 'feet',
      };
    } else {
      threshold = {
        type: 'none',
        value: 0,
        unit: '',
      };
    }

    // Calculate frequency score
    const frequencyScore = this.frequencyToScore(limitation.frequency);

    // Determine severity
    let severity: LimitationSummary['severity'];
    
    if (limitation.category === 'sitting' || limitation.category === 'standing') {
      if (limitation.timeThreshold) {
        const minutes = limitation.timeThreshold.durationMinutes;
        if (minutes <= 15) severity = 'extreme';
        else if (minutes <= 30) severity = 'marked';
        else if (minutes <= 60) severity = 'moderate';
        else severity = 'mild';
      } else {
        severity = 'moderate';
      }
    } else if (limitation.category === 'lifting' || limitation.category === 'carrying') {
      if (limitation.weightThreshold) {
        const pounds = limitation.weightThreshold.maxPounds;
        if (pounds <= 5) severity = 'extreme';
        else if (pounds <= 10) severity = 'marked';
        else if (pounds <= 20) severity = 'moderate';
        else severity = 'mild';
      } else {
        severity = 'moderate';
      }
    } else {
      // Default to frequency-based severity
      if (frequencyScore >= 85) severity = 'extreme';
      else if (frequencyScore >= 65) severity = 'marked';
      else if (frequencyScore >= 40) severity = 'moderate';
      else severity = 'mild';
    }

    // Find supporting logs for this limitation
    const supportingLogs = this.findSupportingLogs(limitation, dailyLogs, activityLogs);
    const evidenceCount = supportingLogs.length;

    return {
      category: limitation.category,
      categoryLabel: getLimitationCategoryLabel(limitation.category),
      threshold,
      frequency: limitation.frequency,
      frequencyScore,
      primaryConsequences: limitation.consequences.slice(0, 3),
      severity,
      supportingLogs,
      evidenceCount,
    };
  }

  /**
   * Generate comprehensive RFC assessment
   */
  static generateRFCAssessment(
    limitations: Limitation[],
    activityLogs: ActivityLog[],
    dailyLogs: DailyLog[]
  ): RFCAssessment {
    const activeLimitations = limitations.filter(l => l.isActive);

    // Physical capacity
    const sitting = activeLimitations.find(l => l.category === 'sitting');
    const standing = activeLimitations.find(l => l.category === 'standing');
    const walking = activeLimitations.find(l => l.category === 'walking');
    const lifting = activeLimitations.find(l => l.category === 'lifting');
    const carrying = activeLimitations.find(l => l.category === 'carrying');

    let exertionalLevel: RFCAssessment['physical']['exertionalLevel'] = 'sedentary';
    
    if (lifting?.weightThreshold) {
      const maxWeight = lifting.weightThreshold.maxPounds;
      if (maxWeight >= 100) exertionalLevel = 'very_heavy';
      else if (maxWeight >= 50) exertionalLevel = 'heavy';
      else if (maxWeight >= 25) exertionalLevel = 'medium';
      else if (maxWeight >= 10) exertionalLevel = 'light';
      else exertionalLevel = 'sedentary';
    }

    const physical: RFCAssessment['physical'] = {
      exertionalLevel,
      sittingCapacity: sitting?.timeThreshold 
        ? `Limited to ${sitting.timeThreshold.durationMinutes} minutes before requiring position change`
        : 'Able to sit for extended periods',
      standingCapacity: standing?.timeThreshold
        ? `Limited to ${standing.timeThreshold.durationMinutes} minutes before requiring rest`
        : 'Able to stand for extended periods',
      walkingCapacity: walking?.distanceThreshold
        ? `Limited to approximately ${walking.distanceThreshold.maxBlocks} blocks`
        : 'Able to walk without significant limitation',
      liftingCapacity: lifting?.weightThreshold
        ? `Maximum ${lifting.weightThreshold.maxPounds} pounds ${lifting.weightThreshold.frequency}`
        : 'No significant lifting restrictions documented',
      carryingCapacity: carrying?.weightThreshold
        ? `Maximum ${carrying.weightThreshold.maxPounds} pounds ${carrying.weightThreshold.frequency}`
        : 'No significant carrying restrictions documented',
      limitations: activeLimitations
        .filter(l => ['sitting', 'standing', 'walking', 'lifting', 'carrying'].includes(l.category))
        .map(l => `${getLimitationCategoryLabel(l.category)}: ${l.frequency}`)
    };

    // Postural capacity
    const climbing = activeLimitations.find(l => l.category === 'climbing');
    const bending = activeLimitations.find(l => l.category === 'bending');
    const reaching = activeLimitations.find(l => l.category === 'reaching');

    const postural: RFCAssessment['postural'] = {
      climbing: climbing ? `${climbing.frequency}` : 'Unlimited',
      balancing: 'Not specifically documented',
      stooping: bending ? `${bending.frequency}` : 'Unlimited',
      kneeling: 'Not specifically documented',
      crouching: bending ? `${bending.frequency}` : 'Unlimited',
      crawling: 'Not specifically documented',
    };

    // Manipulative capacity
    const fineMotor = activeLimitations.find(l => l.category === 'fine_motor');
    const grossMotor = activeLimitations.find(l => l.category === 'gross_motor');

    const manipulative: RFCAssessment['manipulative'] = {
      reaching: reaching ? `${reaching.frequency}` : 'Unlimited',
      handling: grossMotor ? `${grossMotor.frequency}` : 'Unlimited',
      fingering: fineMotor ? `${fineMotor.frequency}` : 'Unlimited',
      feeling: 'Not specifically documented',
    };

    // Mental capacity
    const concentration = activeLimitations.find(l => l.category === 'concentration');
    const memory = activeLimitations.find(l => l.category === 'memory');
    const social = activeLimitations.find(l => l.category === 'social');

    const mental: RFCAssessment['mental'] = {
      understanding: memory 
        ? `Difficulty understanding complex instructions (${memory.frequency})`
        : 'Able to understand and remember instructions',
      memory: memory
        ? `Memory difficulties ${memory.frequency}, affecting work tasks`
        : 'No significant memory limitations documented',
      concentration: concentration
        ? `Sustained concentration limited to ${concentration.timeThreshold?.durationMinutes || 'brief'} periods`
        : 'Able to maintain concentration',
      adaptation: social
        ? `Difficulty adapting to changes ${social.frequency}`
        : 'Able to adapt to workplace changes',
      limitations: activeLimitations
        .filter(l => ['concentration', 'memory', 'social'].includes(l.category))
        .map(l => `${getLimitationCategoryLabel(l.category)}: ${l.frequency}`)
    };

    // Work reliability assessment
    const totalDays = dailyLogs.length;
    const badDays = dailyLogs.filter(log => log.overallSeverity >= 7).length;
    const reliability = totalDays > 0 ? Math.round(((totalDays - badDays) / totalDays) * 100) : 100;
    
    const absencesPerMonth = totalDays > 0 
      ? Math.round((badDays / totalDays) * 20) // Assuming ~20 work days per month
      : 0;

    const work: RFCAssessment['work'] = {
      reliability,
      attendance: absencesPerMonth > 4
        ? `Unpredictable absences expected (approximately ${absencesPerMonth} days/month)`
        : absencesPerMonth > 2
        ? 'Frequent absences expected'
        : 'Good attendance expected',
      pace: concentration?.timeThreshold && concentration.timeThreshold.durationMinutes < 120
        ? 'Reduced pace due to frequent breaks'
        : 'Normal pace',
      offTaskTime: concentration?.timeThreshold
        ? 'Significant off-task time due to concentration difficulties'
        : 'Minimal off-task time',
      absencesPerMonth,
    };

    // Overall conclusion
    const canPerformFullTime = reliability >= 80 && absencesPerMonth <= 1;
    const canPerformPartTime = reliability >= 60 || absencesPerMonth <= 3;

    const primaryBarriers: string[] = [];
    
    if (absencesPerMonth > 2) {
      primaryBarriers.push('Unpredictable attendance');
    }
    
    if (sitting?.timeThreshold && sitting.timeThreshold.durationMinutes < 60) {
      primaryBarriers.push('Limited sitting tolerance');
    }
    
    if (standing?.timeThreshold && standing.timeThreshold.durationMinutes < 30) {
      primaryBarriers.push('Limited standing tolerance');
    }
    
    if (concentration?.timeThreshold && concentration.timeThreshold.durationMinutes < 120) {
      primaryBarriers.push('Concentration difficulties');
    }

    let sustainedWorkAbility: string;
    if (canPerformFullTime) {
      sustainedWorkAbility = 'Can perform full-time work with accommodations';
    } else if (canPerformPartTime) {
      sustainedWorkAbility = 'May perform part-time work with significant accommodations';
    } else {
      sustainedWorkAbility = 'Unable to sustain competitive employment';
    }

    const conclusion: RFCAssessment['conclusion'] = {
      canPerformFullTime,
      canPerformPartTime,
      sustainedWorkAbility,
      primaryBarriers,
    };

    return {
      physical,
      postural,
      manipulative,
      mental,
      work,
      conclusion,
    };
  }

  /**
   * Validate limitation against activity logs
   */
  static validateLimitationWithLogs(
    limitation: Limitation,
    activityLogs: ActivityLog[]
  ): {
    isSupported: boolean;
    supportingCount: number;
    contradictingCount: number;
    notes: string[];
  } {
    const notes: string[] = [];
    let supportingCount = 0;
    let contradictingCount = 0;

    // Map limitation category to activity types
    const relevantActivities = this.getRelevantActivities(limitation.category);
    const relevantLogs = activityLogs.filter(log =>
      relevantActivities.includes(log.activityId)
    );

    if (relevantLogs.length === 0) {
      return {
        isSupported: false,
        supportingCount: 0,
        contradictingCount: 0,
        notes: ['No relevant activity logs found'],
      };
    }

    // Check against threshold
    if (limitation.timeThreshold) {
      const threshold = limitation.timeThreshold.durationMinutes;
      
      relevantLogs.forEach(log => {
        const impact = getWorstImpact(log);
        
        if (log.duration <= threshold && impact >= 5) {
          supportingCount++;
        } else if (log.duration > threshold && impact < 5) {
          contradictingCount++;
        }
      });

      if (supportingCount > contradictingCount) {
        notes.push(`${supportingCount} activity logs support ${threshold}-minute limitation`);
      }
    }

    const isSupported = supportingCount > contradictingCount;

    return {
      isSupported,
      supportingCount,
      contradictingCount,
      notes,
    };
  }

  /**
   * Helper: Convert frequency to numeric score
   */
  private static frequencyToScore(frequency: string): number {
    switch (frequency) {
      case 'always': return 100;
      case 'usually': return 85;
      case 'often': return 65;
      case 'sometimes': return 40;
      case 'occasionally': return 20;
      case 'rarely': return 5;
      default: return 50;
    }
  }

  /**
   * Helper: Get relevant activities for a limitation category
   */
  private static getRelevantActivities(category: string): string[] {
    const mapping: Record<string, string[]> = {
      'sitting': ['desk_work', 'reading', 'watching_tv', 'driving'],
      'standing': ['standing_work', 'cooking', 'dishes'],
      'walking': ['walking', 'shopping', 'errands'],
      'lifting': ['lifting', 'carrying', 'laundry', 'groceries'],
      'carrying': ['carrying', 'groceries', 'laundry'],
      'reaching': ['reaching', 'shelving'],
      'bending': ['bending', 'cleaning', 'dishes'],
      'climbing': ['stairs', 'climbing'],
      'concentration': ['desk_work', 'reading', 'computer_work'],
      'memory': ['errands', 'cooking', 'appointments'],
      'fine_motor': ['typing', 'writing', 'buttoning'],
      'gross_motor': ['walking', 'standing_work', 'exercise'],
      'social': ['social_event', 'phone_call', 'video_call'],
      'self_care': ['showering', 'dressing', 'grooming', 'eating'],
    };

    return mapping[category] || [];
  }

  /**
   * Find logs that support a specific limitation
   */
  private static findSupportingLogs(
    limitation: Limitation,
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[]
  ): string[] {
    const supportingLogs: string[] = [];
    
    // Get relevant activities for this limitation category
    const relevantActivities = this.getRelevantActivities(limitation.category);
    
    // Find activity logs that show impact matching this limitation
    activityLogs.forEach(log => {
      // Check if activity is relevant to limitation category
      const isRelevantActivity = relevantActivities.some(actId => 
        log.activityId === actId || log.activityName.toLowerCase().includes(actId)
      );
      
      if (isRelevantActivity) {
        // Check if activity showed significant impact
        const hasSignificantImpact = log.immediateImpact.overallImpact >= 5 || 
          (log.delayedImpact && log.delayedImpact.overallImpact >= 5);
        
        // Check if activity was stopped early or required recovery
        const wasLimited = log.stoppedEarly || 
          log.recoveryActions.length > 0 || 
          (log.recoveryDuration && log.recoveryDuration > 0);
        
        if (hasSignificantImpact || wasLimited) {
          supportingLogs.push(log.id);
        }
      }
    });
    
    // Find daily logs with high severity symptoms related to limitation
    dailyLogs.forEach(log => {
      const hasRelevantHighSymptoms = log.symptoms.some(symptom => {
        // Map limitation categories to relevant symptom types
        const relevantSymptomIds = this.getRelevantSymptomIds(limitation.category);
        return relevantSymptomIds.includes(symptom.symptomId) && symptom.severity >= 6;
      });
      
      if (hasRelevantHighSymptoms) {
        supportingLogs.push(log.id);
      }
    });
    
    return supportingLogs;
  }
  
  /**
   * Get symptom IDs relevant to a limitation category
   */
  private static getRelevantSymptomIds(category: string): string[] {
    const mapping: Record<string, string[]> = {
      'sitting': ['back_pain', 'hip_pain', 'stiffness'],
      'standing': ['back_pain', 'leg_pain', 'balance'],
      'walking': ['leg_pain', 'shortness_of_breath', 'balance', 'coordination'],
      'lifting': ['back_pain', 'arm_pain', 'weakness'],
      'carrying': ['arm_pain', 'weakness', 'balance'],
      'reaching': ['arm_pain', 'shoulder_pain', 'stiffness'],
      'bending': ['back_pain', 'stiffness', 'balance'],
      'climbing': ['shortness_of_breath', 'leg_pain', 'balance'],
      'concentration': ['brain_fog', 'headache', 'confusion'],
      'memory': ['brain_fog', 'confusion', 'forgetfulness'],
      'fine_motor': ['tremor', 'weakness', 'coordination'],
      'gross_motor': ['weakness', 'balance', 'coordination'],
      'social': ['anxiety', 'depression', 'brain_fog'],
      'self_care': ['weakness', 'fatigue', 'coordination'],
    };
    
    return mapping[category] || [];
  }
}