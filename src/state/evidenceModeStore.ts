/**
 * Evidence Mode Store
 * Manages Evidence Mode state, log finalization, and revision tracking
 */

import { create } from 'zustand';
import { Storage } from '../storage/storage';
import { 
  EvidenceModeConfig, 
  LogFinalization, 
  RevisionRecord, 
  SubmissionPack,
  RevisionReasonCategory,
  RevisionTargetType,
  createRevisionRecord,
  createSubmissionPack
} from '../domain/models/EvidenceMode';

const STORAGE_KEYS = {
  EVIDENCE_CONFIG: '@ssdi/evidence_mode_config',
  FINALIZATIONS: '@ssdi/log_finalizations',
  REVISIONS: '@ssdi/revisions',
  SUBMISSION_PACKS: '@ssdi/submission_packs',
};

interface EvidenceModeState {
  // Configuration
  config: EvidenceModeConfig;
  
  // Finalized logs
  finalizations: LogFinalization[];
  
  // Revision records
  revisions: RevisionRecord[];
  
  // Submission packs
  submissionPacks: SubmissionPack[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions - Evidence Mode
  loadEvidenceMode: () => Promise<void>;
  enableEvidenceMode: (profileId: string) => Promise<void>;
  disableEvidenceMode: () => Promise<void>;
  isEvidenceModeEnabled: () => boolean;
  
  // Actions - Finalization
  finalizeLog: (logId: string, logType: 'daily' | 'activity', profileId: string) => Promise<void>;
  isLogFinalized: (logId: string) => boolean;
  getFinalizedLogs: (logType?: 'daily' | 'activity') => LogFinalization[];
  
  // Actions - Revisions
  createRevision: (
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
  ) => Promise<void>;
  getLogRevisions: (logId: string) => RevisionRecord[];
  getAllRevisions: () => RevisionRecord[];
  
  // Actions - Submission Packs
  createPack: (
    profileId: string,
    title: string,
    startDate: string,
    endDate: string,
    dailyLogIds: string[],
    activityLogIds: string[],
    reportIds: string[],
    appVersion: string
  ) => Promise<string | null>;
  getSubmissionPacks: (profileId?: string) => SubmissionPack[];
  getSubmissionPack: (packId: string) => SubmissionPack | null;
  
  // Utility
  clearError: () => void;
}

const DEFAULT_CONFIG: EvidenceModeConfig = {
  enabled: false,
  enabledAt: null,
  enabledBy: null,
};

export const useEvidenceModeStore = create<EvidenceModeState>((set, get) => ({
  // Initial state
  config: DEFAULT_CONFIG,
  finalizations: [],
  revisions: [],
  submissionPacks: [],
  loading: false,
  error: null,

  // Load Evidence Mode configuration
  loadEvidenceMode: async () => {
    set({ loading: true, error: null });
    try {
      const configResult = await Storage.get<EvidenceModeConfig>(
        STORAGE_KEYS.EVIDENCE_CONFIG,
        DEFAULT_CONFIG
      );
      const finalizationsResult = await Storage.get<LogFinalization[]>(
        STORAGE_KEYS.FINALIZATIONS,
        []
      );
      const revisionsResult = await Storage.get<RevisionRecord[]>(
        STORAGE_KEYS.REVISIONS,
        []
      );
      const packsResult = await Storage.get<SubmissionPack[]>(
        STORAGE_KEYS.SUBMISSION_PACKS,
        []
      );

      set({
        config: configResult.data || DEFAULT_CONFIG,
        finalizations: finalizationsResult.data || [],
        revisions: revisionsResult.data || [],
        submissionPacks: packsResult.data || [],
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load evidence mode',
        loading: false,
      });
    }
  },

  // Enable Evidence Mode
  enableEvidenceMode: async (profileId: string) => {
    const newConfig: EvidenceModeConfig = {
      enabled: true,
      enabledAt: new Date().toISOString(),
      enabledBy: profileId,
    };

    const result = await Storage.set(STORAGE_KEYS.EVIDENCE_CONFIG, newConfig);
    if (result.success) {
      set({ config: newConfig });
    } else {
      set({ error: result.error || 'Failed to enable evidence mode' });
    }
  },

  // Disable Evidence Mode
  disableEvidenceMode: async () => {
    const newConfig: EvidenceModeConfig = {
      enabled: false,
      enabledAt: null,
      enabledBy: null,
    };

    const result = await Storage.set(STORAGE_KEYS.EVIDENCE_CONFIG, newConfig);
    if (result.success) {
      set({ config: newConfig });
    } else {
      set({ error: result.error || 'Failed to disable evidence mode' });
    }
  },

  // Check if Evidence Mode is enabled
  isEvidenceModeEnabled: () => {
    return get().config.enabled;
  },

  // Finalize a log
  finalizeLog: async (logId: string, logType: 'daily' | 'activity', profileId: string) => {
    const { finalizations } = get();
    
    // Check if already finalized
    if (finalizations.some((f) => f.logId === logId)) {
      set({ error: 'Log is already finalized' });
      return;
    }

    const finalization: LogFinalization = {
      finalizedAt: new Date().toISOString(),
      finalizedBy: profileId,
      logId,
      logType,
    };

    const updated = [...finalizations, finalization];
    const result = await Storage.set(STORAGE_KEYS.FINALIZATIONS, updated);

    if (result.success) {
      set({ finalizations: updated });
    } else {
      set({ error: result.error || 'Failed to finalize log' });
    }
  },

  // Check if log is finalized
  isLogFinalized: (logId: string) => {
    return get().finalizations.some((f) => f.logId === logId);
  },

  // Get all finalized logs
  getFinalizedLogs: (logType?: 'daily' | 'activity') => {
    const { finalizations } = get();
    if (logType) {
      return finalizations.filter((f) => f.logType === logType);
    }
    return finalizations;
  },

  // Create a revision
  createRevision: async (
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
  ) => {
    const { revisions } = get();
    const revisionId = `revision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const note = reasonCategory === 'other' ? (reasonNote || '') : reasonNote;

    const revision = createRevisionRecord(
      revisionId,
      logId,
      logType,
      profileId,
      fieldPath,
      originalValue,
      updatedValue,
      reasonCategory,
      note,
      originalSnapshot,
      summary
    );

    const updated = [...revisions, revision];
    const result = await Storage.set(STORAGE_KEYS.REVISIONS, updated);

    if (result.success) {
      set({ revisions: updated });
    } else {
      set({ error: result.error || 'Failed to create revision' });
    }
  },

  // Get revisions for a specific log
  getLogRevisions: (logId: string) => {
    return get().revisions.filter((r) => r.logId === logId);
  },

  // Get all revisions
  getAllRevisions: () => {
    return get().revisions;
  },

  // Create submission pack
  createPack: async (
    profileId: string,
    title: string,
    startDate: string,
    endDate: string,
    dailyLogIds: string[],
    activityLogIds: string[],
    reportIds: string[],
    appVersion: string
  ) => {
    const { submissionPacks, config, revisions } = get();
    const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Count revisions for included logs
    const includedLogIds = new Set([...dailyLogIds, ...activityLogIds]);
    const totalRevisions = revisions.filter((r) => includedLogIds.has(r.logId)).length;

    const pack = createSubmissionPack(
      packId,
      profileId,
      title,
      startDate,
      endDate,
      dailyLogIds,
      activityLogIds,
      reportIds,
      appVersion,
      config.enabled,
      totalRevisions
    );

    const updated = [...submissionPacks, pack];
    const result = await Storage.set(STORAGE_KEYS.SUBMISSION_PACKS, updated);

    if (result.success) {
      set({ submissionPacks: updated });
      return packId;
    } else {
      set({ error: result.error || 'Failed to create submission pack' });
      return null;
    }
  },

  // Get submission packs
  getSubmissionPacks: (profileId?: string) => {
    const { submissionPacks } = get();
    if (profileId) {
      return submissionPacks.filter((p) => p.profileId === profileId);
    }
    return submissionPacks;
  },

  // Get specific submission pack
  getSubmissionPack: (packId: string) => {
    return get().submissionPacks.find((p) => p.id === packId) || null;
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
