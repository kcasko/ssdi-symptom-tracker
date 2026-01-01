/**
 * ActivityLog Model
 * Captures activity attempts and their impacts - raw evidence layer
 */

export interface ActivityLog {
  id: string;
  profileId: string;
  
  // When this log was created/edited
  createdAt: string;
  updatedAt: string;
  
  // When the activity occurred
  activityDate: string;
  startTime?: string; // HH:mm
  
  // Activity details
  activityId: string;
  activityName: string; // Denormalized for easier reporting
  customActivityName?: string; // If using 'other' activity
  
  // Duration and intensity
  duration: number; // minutes
  plannedDuration?: number; // minutes - what was intended
  intensity: ActivityIntensity;
  
  // Impact assessment
  immediateImpact: ImpactAssessment;
  delayedImpact?: DelayedImpact;
  
  // Recovery
  recoveryActions: RecoveryAction[];
  recoveryDuration?: number; // minutes
  
  // Did activity have to be stopped early?
  stoppedEarly: boolean;
  stopReason?: string;
  
  // Context
  assistanceNeeded?: boolean;
  assistanceType?: string;
  
  // Free-form notes
  notes?: string;
  
  // Photo evidence
  photos?: string[]; // Photo attachment IDs
}

export type ActivityIntensity = 'light' | 'moderate' | 'heavy';

export interface ImpactAssessment {
  // Symptoms experienced during/after activity
  symptoms: ActivitySymptom[];
  
  // Overall impact level
  overallImpact: number; // 0-10
  
  // Specific functional impacts
  functionalImpacts?: string[];
  
  notes?: string;
}

export interface ActivitySymptom {
  symptomId: string;
  severity: number; // 0-10
  onsetTiming: 'during' | 'immediately_after' | 'within_30min' | 'within_hour' | 'later';
}

export interface DelayedImpact {
  // When delayed impact was assessed
  assessedAt: string;
  
  // Hours after activity
  hoursAfter: number;
  
  // Impact details
  symptoms: ActivitySymptom[];
  overallImpact: number; // 0-10
  
  notes?: string;
}

export interface RecoveryAction {
  actionId: string;
  actionName: string;
  duration?: number; // minutes
  helpful: boolean;
  notes?: string;
}

/**
 * Create a new activity log with defaults
 */
export function createActivityLog(
  id: string,
  profileId: string,
  activityId: string,
  activityName: string,
  activityDate: string
): ActivityLog {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    activityDate,
    activityId,
    activityName,
    duration: 0,
    intensity: 'light',
    immediateImpact: {
      symptoms: [],
      overallImpact: 0,
    },
    recoveryActions: [],
    stoppedEarly: false,
  };
}

/**
 * Check if activity was completed as planned
 */
export function wasActivityCompleted(log: ActivityLog): boolean {
  if (!log.plannedDuration) return !log.stoppedEarly;
  return log.duration >= log.plannedDuration && !log.stoppedEarly;
}

/**
 * Get total recovery time for an activity
 */
export function getTotalRecoveryTime(log: ActivityLog): number {
  if (log.recoveryDuration) return log.recoveryDuration;
  return log.recoveryActions.reduce((sum, a) => sum + (a.duration || 0), 0);
}

/**
 * Get the worst impact from an activity log
 */
export function getWorstImpact(log: ActivityLog): number {
  let worst = log.immediateImpact.overallImpact;
  if (log.delayedImpact && log.delayedImpact.overallImpact > worst) {
    worst = log.delayedImpact.overallImpact;
  }
  return worst;
}

/**
 * Check if activity caused significant impact (5+)
 */
export function causedSignificantImpact(log: ActivityLog): boolean {
  return getWorstImpact(log) >= 5;
}
