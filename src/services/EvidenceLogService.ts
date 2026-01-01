/**
 * Evidence-Aware Log Operations
 * Helper functions to integrate Evidence Mode with log operations
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { useEvidenceModeStore } from '../state/evidenceModeStore';

/**
 * Check if a log can be modified
 * Returns { canModify: boolean, reason?: string }
 */
export function canModifyLog(logId: string): { canModify: boolean; reason?: string } {
  const evidenceStore = useEvidenceModeStore.getState();
  
  if (evidenceStore.isLogFinalized(logId)) {
    return {
      canModify: false,
      reason: 'This log has been finalized and cannot be directly modified. You can create a revision instead.',
    };
  }
  
  return { canModify: true };
}

/**
 * Add evidence timestamp to a new log if Evidence Mode is enabled
 */
export function applyEvidenceTimestamp<T extends DailyLog | ActivityLog>(log: T): T {
  const evidenceStore = useEvidenceModeStore.getState();
  
  if (evidenceStore.isEvidenceModeEnabled()) {
    return {
      ...log,
      evidenceTimestamp: new Date().toISOString(),
    };
  }
  
  return log;
}

/**
 * Handle log update with revision tracking
 * If log is finalized, creates a revision instead of modifying
 */
export async function updateLogWithRevision(
  logId: string,
  logType: 'daily' | 'activity',
  profileId: string,
  originalLog: DailyLog | ActivityLog,
  updates: Partial<DailyLog | ActivityLog>,
  reason: string
): Promise<{ success: boolean; needsRevision: boolean; error?: string }> {
  const evidenceStore = useEvidenceModeStore.getState();
  
  // Check if log is finalized
  if (evidenceStore.isLogFinalized(logId)) {
    // Create revisions for each changed field
    const changedFields = getChangedFields(originalLog, updates);
    
    try {
      for (const { fieldPath, originalValue, newValue } of changedFields) {
        await evidenceStore.createRevision(
          logId,
          logType,
          profileId,
          fieldPath,
          originalValue,
          newValue,
          reason,
          originalLog
        );
      }
      
      return { success: true, needsRevision: true };
    } catch (error) {
      return {
        success: false,
        needsRevision: true,
        error: error instanceof Error ? error.message : 'Failed to create revision',
      };
    }
  }
  
  return { success: true, needsRevision: false };
}

/**
 * Get changed fields between original and updated logs
 */
function getChangedFields(
  original: any,
  updates: any
): Array<{ fieldPath: string; originalValue: any; newValue: any }> {
  const changes: Array<{ fieldPath: string; originalValue: any; newValue: any }> = [];
  
  Object.keys(updates).forEach((key) => {
    if (key === 'updatedAt' || key === 'id' || key === 'profileId') return;
    
    const originalValue = original[key];
    const newValue = updates[key];
    
    // Simple comparison (could be enhanced for deep object comparison)
    if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
      changes.push({
        fieldPath: key,
        originalValue,
        newValue,
      });
    }
  });
  
  return changes;
}

/**
 * Validate log finalization
 */
export function canFinalizeLog(log: DailyLog | ActivityLog): { canFinalize: boolean; reason?: string } {
  const evidenceStore = useEvidenceModeStore.getState();
  
  if (evidenceStore.isLogFinalized(log.id)) {
    return { canFinalize: false, reason: 'Log is already finalized' };
  }
  
  // Check if log has minimum required data
  if ('symptoms' in log && log.symptoms.length === 0) {
    return { canFinalize: false, reason: 'Cannot finalize a log with no symptoms recorded' };
  }
  
  if ('activityId' in log && !log.activityId) {
    return { canFinalize: false, reason: 'Cannot finalize a log with no activity recorded' };
  }
  
  return { canFinalize: true };
}

/**
 * Get finalization status display text
 */
export function getFinalizationStatus(logId: string): string {
  const evidenceStore = useEvidenceModeStore.getState();
  const finalizations = evidenceStore.getFinalizedLogs();
  const finalization = finalizations.find((f) => f.logId === logId);
  
  if (!finalization) {
    return 'Not finalized';
  }
  
  const date = new Date(finalization.finalizedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  return `Finalized on ${date}`;
}

/**
 * Get revision count for a log
 */
export function getRevisionCount(logId: string): number {
  const evidenceStore = useEvidenceModeStore.getState();
  return evidenceStore.getLogRevisions(logId).length;
}

/**
 * Get Evidence Mode indicator text
 */
export function getEvidenceModeIndicator(): string | null {
  const evidenceStore = useEvidenceModeStore.getState();
  
  if (!evidenceStore.config.enabled) {
    return null;
  }
  
  const enabledDate = evidenceStore.config.enabledAt
    ? new Date(evidenceStore.config.enabledAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';
  
  return `Evidence Mode active since ${enabledDate}`;
}
