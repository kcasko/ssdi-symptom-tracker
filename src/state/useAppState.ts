/**
 * App State Hook
 * Central hook that coordinates all stores and provides app-wide state
 */

import { useEffect } from 'react';
import { useProfileStore } from './profileStore';
import { useLogStore } from './logStore';
import { useReportStore } from './reportStore';
import { useSettingsStore } from './settingsStore';
import { MigrationManager } from '../storage/migrations';
import { SettingsStorage } from '../storage/storage';

interface AppState {
  // Initialization
  isInitialized: boolean;
  isFirstLaunch: boolean;
  needsMigration: boolean;
  
  // Current state
  activeProfileId: string | null;
  activeProfile: any | null;
  profiles: any[];
  
  // Loading states
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  
  // Profile actions
  setActiveProfile: (profileId: string | null) => Promise<void>;
  createProfile: (name: string) => Promise<string | null>;
  
  // Log data
  dailyLogs: any[];
  activityLogs: any[];
  limitations: any[];
  
  // Log actions
  addDailyLog: (log: any) => Promise<void>;
  updateDailyLog: (log: any) => Promise<void>;
  addActivityLog: (log: any) => Promise<void>;
  
  // Report data
  reportDrafts: any[];
  
  // Report actions
  addReportDraft: (title: string, reportType: any, dateRange: any) => Promise<string | null>;
  updateReportDraft: (draft: any) => Promise<void>;
  
  // Settings
  settings: any;
  updateSettings: (updates: any) => Promise<void>;
  
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

  // Initialize app on mount - use ref to prevent re-initialization
  useEffect(() => {
    let isInitialized = false;
    
    const initialize = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        // Check if first launch
        const isFirstLaunch = await SettingsStorage.isFirstLaunch();
        
        // Check if migration needed
        const needsMigration = await MigrationManager.needsMigration();
        
        if (needsMigration) {
          console.log('Running migrations...');
          const migrationResult = await MigrationManager.runMigrations();
          if (!migrationResult.success) {
            console.error('Migration failed:', migrationResult.error);
          }
        }
        
        // Load settings first
        await settingsStore.loadSettings();
        
        // Check app lock if enabled
        if (settingsStore.settings.appLockEnabled) {
          const authenticated = await settingsStore.authenticateUser();
          if (!authenticated) {
            // Handle authentication failure
            console.log('Authentication required but failed');
            return;
          }
        }
        
        // Load profiles
        await profileStore.loadProfiles();
        
        // If we have an active profile, load its data
        if (profileStore.activeProfileId) {
          logStore.setCurrentProfile(profileStore.activeProfileId);
          reportStore.setCurrentProfile(profileStore.activeProfileId);
        }
        
        // Mark first launch complete if needed
        if (isFirstLaunch) {
          await SettingsStorage.setFirstLaunchComplete();
        }
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initialize();
  }, []);

  // Keep stores in sync when active profile changes
  useEffect(() => {
    const profileId = profileStore.activeProfileId;
    
    if (logStore.currentProfileId !== profileId) {
      logStore.setCurrentProfile(profileId);
    }
    
    if (reportStore.currentProfileId !== profileId) {
      reportStore.setCurrentProfile(profileId);
    }
  }, [profileStore.activeProfileId, logStore, reportStore]);

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
    // Initialization
    isInitialized: !isLoading && profileStore.profiles.length >= 0,
    isFirstLaunch: false, // Would need to track this properly
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
    
    // Log store data and methods
    dailyLogs: logStore.dailyLogs,
    activityLogs: logStore.activityLogs,
    limitations: logStore.limitations,
    addDailyLog: logStore.addDailyLog,
    updateDailyLog: logStore.updateDailyLog,
    addActivityLog: logStore.addActivityLog,
    
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