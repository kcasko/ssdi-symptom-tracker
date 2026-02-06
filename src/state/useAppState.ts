/**
 * App State Hook
 * Central hook that coordinates all stores and provides app-wide state
 */

import { useEffect, useRef, useState } from 'react';
import { useProfileStore } from './profileStore';
import { useLogStore } from './logStore';
import { useReportStore } from './reportStore';
import { useSettingsStore } from './settingsStore';
import { useEvidenceModeStore } from './evidenceModeStore';
import { MigrationManager } from '../storage/migrations';
import { SettingsStorage } from '../storage/storage';

import { Profile } from '../domain/models/Profile';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { Medication } from '../domain/models/Medication';
import { Appointment } from '../domain/models/Appointment';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';
import { GapExplanation } from '../domain/models/GapExplanation';
import { ReportDraft, ReportType } from '../domain/models/ReportDraft';
import type { AppSettings } from './settingsStore';

interface AppState {
  // Initialization
  isInitialized: boolean;
  isFirstLaunch: boolean;
  needsMigration: boolean;

  // Current state
  activeProfileId: string | null;
  activeProfile: Profile | null;
  profiles: Profile[];

  // Loading states
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;

  // Profile actions
  setActiveProfile: (profileId: string | null) => Promise<void>;
  createProfile: (name: string, options?: Partial<Profile>) => Promise<string | null>;
  deleteProfile: (profileId: string) => Promise<void>;

  // Log data
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
  medications: Medication[];
  appointments: Appointment[];
  photos: PhotoAttachment[];
  gapExplanations: GapExplanation[];

  // Log actions
  addDailyLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDailyLog: (log: DailyLog) => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateActivityLog: (log: ActivityLog) => Promise<void>;
  addLimitation: (limitation: Omit<Limitation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLimitation: (limitation: Limitation) => Promise<void>;
  deleteLimitation: (limitationId: string) => Promise<void>;
  addGapExplanation: (explanation: GapExplanation) => Promise<void>;

  // Photo actions
  addPhoto: (photo: PhotoAttachment) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  getPhotosByEntity: (entityType: string, entityId: string) => PhotoAttachment[];

  // Report data
  reportDrafts: ReportDraft[];

  // Report actions
  addReportDraft: (title: string, reportType: ReportType, dateRange: { start: string; end: string }) => Promise<string | null>;
  updateReportDraft: (draft: ReportDraft) => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // General actions
  initializeApp: () => Promise<void>;
  switchProfile: (profileId: string | null) => Promise<void>;
  clearAllErrors: () => void;
}

export function useAppState(): AppState {
  const profileStore = useProfileStore();
  const logStore = useLogStore();
  const reportStore = useReportStore();
  const settingsStore = useSettingsStore();

  // Use refs to prevent infinite loops and track initialization
  const hasInitialized = useRef(false);
  const [initComplete, setInitComplete] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const lastSyncedProfileId = useRef<string | null>(null);

  // Derived state
  const isLoading =
    profileStore.loading ||
    logStore.loading ||
    reportStore.loading ||
    settingsStore.loading;

  const hasError = Boolean(
    profileStore.error ||
    logStore.error ||
    reportStore.error ||
    settingsStore.error
  );

  const errorMessage =
    profileStore.error ||
    logStore.error ||
    reportStore.error ||
    settingsStore.error ||
    null;

  // Initialize app on mount - only once
  useEffect(() => {
    const initialize = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      console.log('Starting initialization...');

      try {
        // Check if first launch
        const firstLaunchCheck = await SettingsStorage.isFirstLaunch();
        console.log('First launch check:', firstLaunchCheck);
        setIsFirstLaunch(firstLaunchCheck);

        // Check if migration needed
        const needsMigration = await MigrationManager.needsMigration();
        console.log('Migration needed:', needsMigration);

        if (needsMigration) {
          console.log('Running migrations...');
          const migrationResult = await MigrationManager.runMigrations();
          if (!migrationResult.success) {
            console.error('Migration failed:', migrationResult.error);
          }
        }

        // Load settings first
        console.log('Loading settings...');
        await useSettingsStore.getState().loadSettings();

        // Load Evidence Mode configuration
        console.log('Loading Evidence Mode...');
        await useEvidenceModeStore.getState().loadEvidenceMode();

        // Get fresh settings from store (not the stale closure value!)
        const currentSettings = useSettingsStore.getState().settings;
        console.log('Settings loaded, appLockEnabled:', currentSettings.appLockEnabled);

        // Check app lock if enabled
        if (currentSettings.appLockEnabled) {
          const authenticated = await useSettingsStore.getState().authenticateUser();
          if (!authenticated) {
            console.log('Authentication required but failed');
            setInitComplete(true);
            return;
          }
        }

        // Load profiles
        console.log('Loading profiles...');
        await useProfileStore.getState().loadProfiles();

        // Get fresh profile state (not the stale closure value!)
        const currentActiveProfileId = useProfileStore.getState().activeProfileId;
        console.log('Profiles loaded, activeProfileId:', currentActiveProfileId);

        // Load data for active profile
        if (currentActiveProfileId) {
          console.log('Loading data for active profile during initialization');
          // Set the profile ID and force load data
          useLogStore.setState({ currentProfileId: currentActiveProfileId });
          useReportStore.setState({ currentProfileId: currentActiveProfileId });
          await useLogStore.getState().loadData(currentActiveProfileId);
          await useReportStore.getState().loadDrafts(currentActiveProfileId);
          lastSyncedProfileId.current = currentActiveProfileId;
        }

        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        console.log('Setting initComplete to true');
        setInitComplete(true);
      }
    };

    initialize();

    // Cleanup function to reset initialization state on unmount
    return () => {
      hasInitialized.current = false;
    };
  }, []);

  // Keep stores in sync when active profile changes
  useEffect(() => {
    // Don't sync until initialization is complete
    if (!initComplete) return;

    const profileId = profileStore.activeProfileId;

    // Only sync if profile actually changed
    if (lastSyncedProfileId.current === profileId) return;

    lastSyncedProfileId.current = profileId;

    if (logStore.currentProfileId !== profileId) {
      logStore.setCurrentProfile(profileId);
    }

    if (reportStore.currentProfileId !== profileId) {
      reportStore.setCurrentProfile(profileId);
    }
    
    // Cleanup function to reset profile sync state on unmount
    return () => {
      lastSyncedProfileId.current = null;
    };
    
    // Store objects are stable but shouldn't be in dependencies to avoid unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initComplete, profileStore.activeProfileId]); // Don't include store objects

  const initializeApp = async (): Promise<void> => {
    try {
      await settingsStore.loadSettings();
      await profileStore.loadProfiles();
      
      if (profileStore.activeProfileId) {
        logStore.setCurrentProfile(profileStore.activeProfileId);
        reportStore.setCurrentProfile(profileStore.activeProfileId);
      }
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const switchProfile = async (profileId: string | null): Promise<void> => {
    try {
      await profileStore.setActiveProfile(profileId);
      
      // Stores will automatically sync via useEffect above
    } catch (error) {
      console.error('Profile switch error:', error);
    }
  };

  const clearAllErrors = (): void => {
    profileStore.clearError();
    logStore.clearError();
    reportStore.clearError();
    settingsStore.clearError();
  };

  return {
    // Initialization - use explicit flag instead of derived state
    isInitialized: initComplete,
    isFirstLaunch,
    needsMigration: false, // Would need to check this properly

    // Current state
    activeProfileId: profileStore.activeProfileId,
    activeProfile: profileStore.activeProfile,
    profiles: profileStore.profiles,
    
    // Loading states
    isLoading,
    hasError,
    errorMessage,
    
    // Actions
    initializeApp,
    switchProfile,
    clearAllErrors,
    setActiveProfile: profileStore.setActiveProfile,
    createProfile: profileStore.createProfile,
    deleteProfile: profileStore.deleteProfile,
    
    // Log store data and methods
    dailyLogs: logStore.dailyLogs,
    activityLogs: logStore.activityLogs,
    limitations: logStore.limitations,
    medications: logStore.medications,
    appointments: logStore.appointments,
    photos: logStore.photos,
    gapExplanations: logStore.gapExplanations,
    addDailyLog: logStore.addDailyLog,
    updateDailyLog: logStore.updateDailyLog,
    addActivityLog: logStore.addActivityLog,
    updateActivityLog: logStore.updateActivityLog,
    addLimitation: logStore.addLimitation,
    updateLimitation: logStore.updateLimitation,
    deleteLimitation: logStore.deleteLimitation,
    addGapExplanation: logStore.addGapExplanation,
    addPhoto: logStore.addPhoto,
    deletePhoto: logStore.deletePhoto,
    getPhotosByEntity: logStore.getPhotosByEntity,
    
    // Report store data and methods
    reportDrafts: reportStore.drafts,
    addReportDraft: reportStore.createDraft,
    updateReportDraft: reportStore.updateDraft,
    
    // Settings
    settings: settingsStore.settings,
    updateSettings: settingsStore.updateSettings,
  };
}

// Re-export individual stores for direct access when needed
export {
  useProfileStore,
  useLogStore,
  useReportStore,
  useSettingsStore,
};
