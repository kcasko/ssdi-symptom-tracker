/**
 * Settings Store
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import { SettingsStorage } from '../storage/storage';
import { EncryptionManager } from '../storage/encryption';

interface AppSettings {
  // Privacy & Security
  appLockEnabled: boolean;
  encryptionEnabled: boolean;
  biometricAuthEnabled: boolean;
  
  // Data & Backup
  autoBackupEnabled: boolean;
  lastBackupDate?: string;
  
  // Notifications (future feature)
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:mm
  activityReminderEnabled: boolean;
  
  // Display preferences
  darkMode: boolean;
  textSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  
  // Logging preferences
  defaultSymptomScale: 'numeric' | 'descriptive';
  showDetailedHistory: boolean;
  confirmBeforeDelete: boolean;
  
  // Report preferences
  includePersonalInfo: boolean;
  defaultReportType: 'daily_summary' | 'activity_impact' | 'functional_limitations' | 'full_narrative';
  defaultDateRange: string;
  
  // Developer settings (debug builds)
  debugMode?: boolean;
  showStorageInfo?: boolean;
}

interface SettingsState {
  // Data
  settings: AppSettings;
  
  // Device capabilities
  capabilities: {
    biometricsAvailable: boolean;
    secureStoreAvailable: boolean;
    biometryType: string;
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Security actions
  enableAppLock: () => Promise<boolean>;
  disableAppLock: () => Promise<boolean>;
  authenticateUser: () => Promise<boolean>;
  
  // Backup actions
  createBackup: () => Promise<string | null>;
  
  // Utility
  clearError: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  // Privacy & Security
  appLockEnabled: false,
  encryptionEnabled: false,
  biometricAuthEnabled: false,
  
  // Data & Backup
  autoBackupEnabled: false,
  
  // Notifications
  dailyReminderEnabled: false,
  dailyReminderTime: '09:00',
  activityReminderEnabled: false,
  
  // Display preferences
  darkMode: false,
  textSize: 'medium',
  highContrast: false,
  
  // Logging preferences
  defaultSymptomScale: 'numeric',
  showDetailedHistory: true,
  confirmBeforeDelete: true,
  
  // Report preferences
  includePersonalInfo: false,
  defaultReportType: 'daily_summary',
  defaultDateRange: 'week',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  capabilities: {
    biometricsAvailable: false,
    secureStoreAvailable: false,
    biometryType: 'none',
  },
  loading: false,
  error: null,

  // Actions
  loadSettings: async () => {
    set({ loading: true, error: null });
    
    try {
      // Load settings from storage
      const storedSettings = await SettingsStorage.getSettings();
      const appLockEnabled = await SettingsStorage.getAppLockEnabled();
      
      // Initialize encryption to check capabilities
      const encryptionResult = await EncryptionManager.initialize();
      
      const mergedSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...storedSettings,
        appLockEnabled,
      };
      
      set({
        settings: mergedSettings,
        capabilities: encryptionResult.capabilities,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      });
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    
    try {
      // Handle app lock setting separately
      if ('appLockEnabled' in updates) {
        await SettingsStorage.setAppLockEnabled(updates.appLockEnabled!);
      }
      
      // Save other settings
      await SettingsStorage.saveSettings(newSettings);
      
      // Update encryption config if needed
      if ('encryptionEnabled' in updates) {
        EncryptionManager.updateConfig({ enabled: updates.encryptionEnabled });
      }
      
      set({ settings: newSettings, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
    }
  },

  resetSettings: async () => {
    try {
      await SettingsStorage.saveSettings(DEFAULT_SETTINGS);
      await SettingsStorage.setAppLockEnabled(false);
      
      set({ settings: DEFAULT_SETTINGS, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset settings' });
    }
  },

  // Security actions
  enableAppLock: async () => {
    try {
      const authResult = await EncryptionManager.authenticateUser(
        'Enable app lock to protect your symptom data'
      );
      
      if (authResult.success) {
        await get().updateSettings({ appLockEnabled: true });
        return true;
      } else {
        set({ error: authResult.error || 'Authentication failed' });
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to enable app lock' });
      return false;
    }
  },

  disableAppLock: async () => {
    try {
      const authResult = await EncryptionManager.authenticateUser(
        'Authenticate to disable app lock'
      );
      
      if (authResult.success) {
        await get().updateSettings({ appLockEnabled: false });
        return true;
      } else {
        set({ error: authResult.error || 'Authentication failed' });
        return false;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to disable app lock' });
      return false;
    }
  },

  authenticateUser: async () => {
    try {
      const authResult = await EncryptionManager.authenticateUser();
      
      if (!authResult.success && authResult.error) {
        set({ error: authResult.error });
      }
      
      return authResult.success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Authentication failed' });
      return false;
    }
  },

  // Backup actions
  createBackup: async () => {
    try {
      // This would integrate with backup storage
      const backupDate = new Date().toISOString();
      
      await get().updateSettings({ 
        lastBackupDate: backupDate,
      });
      
      // Return backup filename or identifier
      return `ssdi_backup_${backupDate.split('T')[0]}.json`;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create backup' });
      return null;
    }
  },

  // Utility
  clearError: () => set({ error: null }),
}));