/**
 * Log Service
 * Handles daily logs and activity logs with validation
 */

import { 
  DailyLog, 
  createDailyLog,
  calculateAverageSeverity 
} from '../domain/models/DailyLog';
import { 
  ActivityLog, 
  createActivityLog,
  getWorstImpact,
  getTotalRecoveryTime 
} from '../domain/models/ActivityLog';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';
import { generateId } from '../utils/ids';

export interface DailyLogInput {
  profileId: string;
  date: string;
  symptoms: Array<{
    symptomId: string;
    severity: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface ActivityLogInput {
  profileId: string;
  activityId: string;
  date: string;
  duration: number;
  stoppedEarly?: boolean;
  impacts?: Array<{
    symptomId: string;
    severity: number;
  }>;
  recovery?: Array<{
    actionName: string;
    durationMinutes: number;
  }>;
  notes?: string;
}

export class LogService {
  /**
   * Create a new daily log
   */
  static createDailyLog(input: DailyLogInput): DailyLog {
    // Validate symptoms exist
    const validSymptoms = input.symptoms.filter(s => {
      const symptom = getSymptomById(s.symptomId);
      return symptom !== null;
    });

    if (validSymptoms.length === 0) {
      throw new Error('At least one valid symptom is required');
    }

    // Validate severity values
    validSymptoms.forEach(s => {
      if (s.severity < 0 || s.severity > 10) {
        throw new Error(`Invalid severity: ${s.severity}. Must be 0-10`);
      }
    });

    // Create base log with symptoms
    const logId = generateId();
    const log = createDailyLog(
      logId,
      input.profileId,
      input.date,
      'morning' // Default time of day
    );
    
    // Add symptoms
    log.symptoms = validSymptoms.map(s => ({
      symptomId: s.symptomId,
      severity: s.severity,
      notes: s.notes,
    }));
    
    // Calculate severity
    log.overallSeverity = calculateAverageSeverity(log.symptoms);

    // Add notes
    if (input.notes) {
      log.notes = input.notes;
    }

    // Recalculate overall severity
    log.overallSeverity = calculateAverageSeverity(log.symptoms);

    return log;
  }

  /**
   * Update an existing daily log
   */
  static updateDailyLog(log: DailyLog, updates: Partial<DailyLogInput>): DailyLog {
    let updatedLog = { ...log };

    // Update symptoms if provided
    if (updates.symptoms) {
      // Replace symptoms array
      updatedLog.symptoms = updates.symptoms.map(s => ({
        symptomId: s.symptomId,
        severity: s.severity,
        notes: s.notes,
      }));

      // Recalculate overall severity
      updatedLog.overallSeverity = calculateAverageSeverity(updatedLog.symptoms);
    }

    // Update notes if provided
    if (updates.notes !== undefined) {
      updatedLog.notes = updates.notes;
    }

    return updatedLog;
  }

  /**
   * Create a new activity log
   */
  static createActivityLog(input: ActivityLogInput): ActivityLog {
    // Validate activity exists
    const activity = getActivityById(input.activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${input.activityId}`);
    }

    // Validate duration
    if (input.duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    // Create base log
    const logId = generateId();
    const log = createActivityLog(
      logId,
      input.profileId,
      input.activityId,
      activity.name,
      input.date
    );
    
    // Set duration
    log.duration = input.duration;

    // Add impacts to immediate impact assessment
    if (input.impacts && input.impacts.length > 0) {
      const symptoms = input.impacts.map(impact => {
        const symptom = getSymptomById(impact.symptomId);
        if (!symptom) {
          throw new Error(`Invalid symptom ID: ${impact.symptomId}`);
        }
        return {
          symptomId: impact.symptomId,
          severity: impact.severity,
          onsetTiming: 'immediately_after' as const
        };
      });
      
      const maxSeverity = Math.max(...input.impacts.map(i => i.severity));
      
      log.immediateImpact = {
        symptoms,
        overallImpact: maxSeverity,
        notes: input.notes
      };
    }

    // Add recovery actions
    if (input.recovery && input.recovery.length > 0) {
      log.recoveryActions = input.recovery.map(r => ({
        actionId: generateId(),
        actionName: r.actionName,
        duration: r.durationMinutes,
        helpful: true, // Default to helpful
        notes: undefined
      }));
      
      // Calculate total recovery duration
      log.recoveryDuration = input.recovery.reduce((sum, r) => sum + r.durationMinutes, 0);
    }

    // Set stopped early flag
    if (input.stoppedEarly !== undefined) {
      log.stoppedEarly = input.stoppedEarly;
    }

    // Add notes
    if (input.notes) {
      log.notes = input.notes;
    }

    return log;
  }

  /**
   * Update an existing activity log
   */
  static updateActivityLog(log: ActivityLog, updates: Partial<ActivityLogInput>): ActivityLog {
    let updatedLog = { ...log };

    // Update duration
    if (updates.duration !== undefined) {
      if (updates.duration <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      updatedLog.duration = updates.duration;
    }

    // Update impacts
    if (updates.impacts) {
      const symptoms = updates.impacts.map(impact => {
        const symptom = getSymptomById(impact.symptomId);
        if (!symptom) {
          throw new Error(`Invalid symptom ID: ${impact.symptomId}`);
        }
        return {
          symptomId: impact.symptomId,
          severity: impact.severity,
          onsetTiming: 'immediately_after' as const
        };
      });
      
      const maxSeverity = Math.max(...updates.impacts.map(i => i.severity));
      
      updatedLog.immediateImpact = {
        symptoms,
        overallImpact: maxSeverity,
        notes: updates.notes
      };
    }

    // Update recovery actions
    if (updates.recovery) {
      updatedLog.recoveryActions = updates.recovery.map(r => ({
        actionId: generateId(),
        actionName: r.actionName,
        duration: r.durationMinutes,
        helpful: true,
        notes: undefined
      }));
      
      // Calculate total recovery duration
      updatedLog.recoveryDuration = updates.recovery.reduce((sum, r) => sum + r.durationMinutes, 0);
    }

    // Update stopped early
    if (updates.stoppedEarly !== undefined) {
      updatedLog.stoppedEarly = updates.stoppedEarly;
    }

    // Update notes
    if (updates.notes !== undefined) {
      updatedLog.notes = updates.notes;
    }

    return updatedLog;
  }

  /**
   * Validate daily log completeness
   */
  static validateDailyLog(log: DailyLog): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for symptoms
    if (log.symptoms.length === 0) {
      errors.push('No symptoms recorded');
    }

    // Check for severity values
    log.symptoms.forEach(s => {
      if (s.severity < 0 || s.severity > 10) {
        const symptom = getSymptomById(s.symptomId);
        errors.push(`Invalid severity for ${symptom?.name || s.symptomId}: ${s.severity}`);
      }
    });

    // Check if high severity has notes
    const highSeveritySymptoms = log.symptoms.filter(s => s.severity >= 7);
    const symptomsWithoutNotes = highSeveritySymptoms.filter(s => !s.notes);

    if (symptomsWithoutNotes.length > 0) {
      warnings.push(`${symptomsWithoutNotes.length} high-severity symptom(s) lack context notes`);
    }

    // Check date validity
    if (isNaN(new Date(log.logDate).getTime())) {
      errors.push('Invalid log date');
    }

    const isValid = errors.length === 0;

    return { isValid, warnings, errors };
  }

  /**
   * Validate activity log completeness
   */
  static validateActivityLog(log: ActivityLog): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check duration
    if (log.duration <= 0) {
      errors.push('Invalid duration');
    }

    // TODO: Re-enable once impact tracking is implemented
    /*
    // Check if stopped early has impacts
    if (log.stoppedEarly && log.impacts.length === 0) {
      warnings.push('Activity stopped early but no impacts recorded');
    }
    */

    // Check if high impact has recovery
    const worstImpact = getWorstImpact(log);
    if (worstImpact >= 7 && log.recoveryActions.length === 0) {
      warnings.push('High impact severity but no recovery actions recorded');
    }

    // Check date validity
    if (isNaN(new Date(log.activityDate).getTime())) {
      errors.push('Invalid activity date');
    }

    const isValid = errors.length === 0;

    return { isValid, warnings, errors };
  }

  /**
   * Get summary for a daily log
   */
  static getDailyLogSummary(log: DailyLog): {
    date: string;
    symptomCount: number;
    worstSeverity: number;
    averageSeverity: number;
    topSymptoms: string[];
  } {
    const severities = log.symptoms.map(s => s.severity);
    const worstSeverity = severities.length > 0 ? Math.max(...severities) : 0;
    const averageSeverity = severities.length > 0
      ? Math.round(severities.reduce((sum, s) => sum + s, 0) / severities.length)
      : 0;

    const topSymptoms = [...log.symptoms]
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3)
      .map(s => getSymptomById(s.symptomId)?.name || s.symptomId);

    return {
      date: log.logDate,
      symptomCount: log.symptoms.length,
      worstSeverity,
      averageSeverity,
      topSymptoms,
    };
  }

  /**
   * Get summary for an activity log
   */
  static getActivityLogSummary(log: ActivityLog): {
    date: string;
    activityName: string;
    duration: number;
    worstImpact: number;
    recoveryTime: number;
    stoppedEarly: boolean;
  } {
    return {
      date: log.activityDate,
      activityName: log.activityName,
      duration: log.duration,
      worstImpact: getWorstImpact(log),
      recoveryTime: getTotalRecoveryTime(log),
      stoppedEarly: log.stoppedEarly,
    };
  }

  /**
   * Find daily logs by date range
   */
  static filterByDateRange(
    logs: DailyLog[] | ActivityLog[],
    dateRange: { start: string; end: string }
  ): Array<DailyLog | ActivityLog> {
    return logs.filter(log => {
      const logDate = 'logDate' in log ? log.logDate : log.activityDate;
      return logDate >= dateRange.start && logDate <= dateRange.end;
    });
  }

  /**
   * Get logs by profile
   */
  static filterByProfile<T extends DailyLog | ActivityLog>(
    logs: T[],
    profileId: string
  ): T[] {
    return logs.filter(log => log.profileId === profileId);
  }

  /**
   * Add delayed impact assessment to an activity log
   */
  static addDelayedImpact(
    log: ActivityLog, 
    hoursAfter: number, 
    impacts: Array<{ symptomId: string; severity: number }>,
    notes?: string
  ): ActivityLog {
    const symptoms = impacts.map(impact => {
      const symptom = getSymptomById(impact.symptomId);
      if (!symptom) {
        throw new Error(`Invalid symptom ID: ${impact.symptomId}`);
      }
      return {
        symptomId: impact.symptomId,
        severity: impact.severity,
        onsetTiming: 'later' as const
      };
    });
    
    const maxSeverity = Math.max(...impacts.map(i => i.severity));
    
    return {
      ...log,
      delayedImpact: {
        assessedAt: new Date().toISOString(),
        hoursAfter,
        symptoms,
        overallImpact: maxSeverity,
        notes
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update recovery action helpfulness
   */
  static updateRecoveryAction(
    log: ActivityLog, 
    actionId: string, 
    helpful: boolean, 
    notes?: string
  ): ActivityLog {
    const updatedActions = log.recoveryActions.map(action => 
      action.actionId === actionId 
        ? { ...action, helpful, notes }
        : action
    );
    
    return {
      ...log,
      recoveryActions: updatedActions,
      updatedAt: new Date().toISOString()
    };
  }
}