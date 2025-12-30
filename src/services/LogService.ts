/**
 * Log Service
 * Handles daily logs and activity logs with validation
 */

import { 
  DailyLog, 
  createDailyLog, 
  addSymptom, 
  updateSymptom, 
  removeSymptom,
  calculateOverallSeverity 
} from '../domain/models/DailyLog';
import { 
  ActivityLog, 
  createActivityLog, 
  addImpact, 
  addRecovery,
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

    // Create base log
    let log = createDailyLog(input.profileId, input.date);

    // Add symptoms
    validSymptoms.forEach(s => {
      const symptom = getSymptomById(s.symptomId)!;
      log = addSymptom(log, {
        symptomId: s.symptomId,
        symptomName: symptom.name,
        severity: s.severity,
        notes: s.notes,
      });
    });

    // Add notes
    if (input.notes) {
      log.notes = input.notes;
    }

    // Recalculate overall severity
    log.overallSeverity = calculateOverallSeverity(log);

    return log;
  }

  /**
   * Update an existing daily log
   */
  static updateDailyLog(log: DailyLog, updates: Partial<DailyLogInput>): DailyLog {
    let updatedLog = { ...log };

    // Update symptoms if provided
    if (updates.symptoms) {
      // Clear existing symptoms
      updatedLog.symptoms = [];

      // Add updated symptoms
      updates.symptoms.forEach(s => {
        const symptom = getSymptomById(s.symptomId);
        if (symptom) {
          updatedLog = addSymptom(updatedLog, {
            symptomId: s.symptomId,
            symptomName: symptom.name,
            severity: s.severity,
            notes: s.notes,
          });
        }
      });

      // Recalculate overall severity
      updatedLog.overallSeverity = calculateOverallSeverity(updatedLog);
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
    let log = createActivityLog(
      input.profileId,
      input.activityId,
      activity.name,
      input.date,
      input.duration
    );

    // Add impacts
    if (input.impacts) {
      input.impacts.forEach(impact => {
        const symptom = getSymptomById(impact.symptomId);
        if (symptom) {
          log = addImpact(log, {
            symptomId: impact.symptomId,
            symptomName: symptom.name,
            severity: impact.severity,
          });
        }
      });
    }

    // Add recovery actions
    if (input.recovery) {
      input.recovery.forEach(r => {
        log = addRecovery(log, r.actionName, r.durationMinutes);
      });
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
      updatedLog.impacts = [];
      updates.impacts.forEach(impact => {
        const symptom = getSymptomById(impact.symptomId);
        if (symptom) {
          updatedLog = addImpact(updatedLog, {
            symptomId: impact.symptomId,
            symptomName: symptom.name,
            severity: impact.severity,
          });
        }
      });
    }

    // Update recovery
    if (updates.recovery) {
      updatedLog.recovery = [];
      updates.recovery.forEach(r => {
        updatedLog = addRecovery(updatedLog, r.actionName, r.durationMinutes);
      });
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
        errors.push(`Invalid severity for ${s.symptomName}: ${s.severity}`);
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

    // Check if stopped early has impacts
    if (log.stoppedEarly && log.impacts.length === 0) {
      warnings.push('Activity stopped early but no impacts recorded');
    }

    // Check if high impact has recovery
    const worstImpact = getWorstImpact(log);
    if (worstImpact >= 7 && log.recovery.length === 0) {
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
      .map(s => s.symptomName);

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
  ): DailyLog[] | ActivityLog[] {
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
}