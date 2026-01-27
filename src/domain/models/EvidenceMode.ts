/**
 * Evidence Mode Models
 * Supports creation of immutable, timestamped records with revision tracking
 */

/**
 * Evidence Mode configuration
 * When enabled, all logs created have immutable timestamps and support finalization
 */
export interface EvidenceModeConfig {
  enabled: boolean;
  enabledAt: string | null; // Timestamp when Evidence Mode was activated
  enabledBy: string | null; // Profile ID that enabled it
}

/**
 * Log finalization marker
 * When a log is finalized, it becomes read-only
 */
export interface LogFinalization {
  finalizedAt: string;
  finalizedBy: string; // Profile ID
  logId: string;
  logType: 'daily' | 'activity';
}

/**
 * Revision record
 * Tracks changes to finalized logs
 */
export type RevisionTargetType =
  | 'daily'
  | 'activity'
  | 'limitation'
  | 'medication'
  | 'appointment';

export interface RevisionRecord {
  id: string;
  logId: string;
  logType: RevisionTargetType;
  profileId: string;
  
  // Revision metadata
  revisionTimestamp: string;
  reasonCategory: RevisionReasonCategory;
  reasonNote?: string;
  summary?: string; // Short description of what changed
  
  // What changed
  fieldPath: string; // e.g., "symptoms[0].severity", "notes"
  originalValue: any;
  updatedValue: any;
  
  // Original log data (immutable snapshot)
  originalSnapshot?: string; // JSON stringified original log
}

export type RevisionReasonCategory =
  | 'typo_correction'
  | 'added_detail_omitted_earlier'
  | 'correction_after_reviewing_records'
  | 'clarification_requested'
  | 'other';

/**
 * Submission pack
 * Immutable bundle of finalized logs and reports
 */
export interface SubmissionPack {
  id: string;
  profileId: string;
  
  // Pack metadata
  createdAt: string;
  title: string;
  description?: string;
  
  // Date range
  startDate: string;
  endDate: string;
  
  // Included records (by ID)
  includedDailyLogs: string[];
  includedActivityLogs: string[];
  includedReports: string[];
  
  // Immutability marker
  immutable: true;
  
  // Generation metadata
  generationMetadata: PackGenerationMetadata;
}

export interface PackGenerationMetadata {
  appVersion: string;
  generatedAt: string;
  evidenceModeEnabled: boolean;
  totalFinalizedLogs: number;
  totalRevisions: number;
}

/**
 * Functional domain mapping
 * Internal classification for SSA-aligned reporting
 */
export type FunctionalDomain =
  | 'sitting'
  | 'standing'
  | 'walking'
  | 'lifting'
  | 'carrying'
  | 'reaching'
  | 'handling'
  | 'concentration'
  | 'persistence'
  | 'pace'
  | 'social_interaction'
  | 'attendance'
  | 'recovery_time';

export interface FunctionalImpactMapping {
  symptomId?: string;
  activityId?: string;
  affectedDomains: FunctionalDomain[];
  severityMultiplier?: number; // Optional weight for impact calculation
}

/**
 * Helper functions
 */

export function createRevisionRecord(
  id: string,
  logId: string,
  logType: RevisionTargetType,
  profileId: string,
  fieldPath: string,
  originalValue: any,
  updatedValue: any,
  reasonCategory: RevisionReasonCategory,
  reasonNote?: string,
  originalSnapshot?: any,
  summary?: string
): RevisionRecord {
  return {
    id,
    logId,
    logType,
    profileId,
    revisionTimestamp: new Date().toISOString(),
    reasonCategory,
    reasonNote,
    summary,
    fieldPath,
    originalValue,
    updatedValue,
    originalSnapshot: originalSnapshot ? JSON.stringify(originalSnapshot) : undefined,
  };
}

export function createSubmissionPack(
  id: string,
  profileId: string,
  title: string,
  startDate: string,
  endDate: string,
  dailyLogIds: string[],
  activityLogIds: string[],
  reportIds: string[],
  appVersion: string,
  evidenceModeEnabled: boolean,
  totalRevisions: number
): SubmissionPack {
  return {
    id,
    profileId,
    createdAt: new Date().toISOString(),
    title,
    startDate,
    endDate,
    includedDailyLogs: dailyLogIds,
    includedActivityLogs: activityLogIds,
    includedReports: reportIds,
    immutable: true,
    generationMetadata: {
      appVersion,
      generatedAt: new Date().toISOString(),
      evidenceModeEnabled,
      totalFinalizedLogs: dailyLogIds.length + activityLogIds.length,
      totalRevisions,
    },
  };
}
