/**
 * Storage Layer
 * Handles all data persistence to AsyncStorage with error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from '../utils/constants';

// Type definitions for storage operations
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic storage operations
 */
export class Storage {
  /**
   * Store data with automatic error handling
   */
  static async set<T>(key: string, data: T): Promise<StorageResult<T>> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
      return { success: true, data };
    } catch (error) {
      console.error(`Storage.set error for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }

  /**
   * Retrieve data with automatic error handling and type safety
   */
  static async get<T>(key: string, defaultValue: T): Promise<StorageResult<T>> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData === null) {
        return { success: true, data: defaultValue };
      }
      const data = JSON.parse(jsonData) as T;
      return { success: true, data };
    } catch (error) {
      console.error(`Storage.get error for key ${key}:`, error);
      return {
        success: false,
        data: defaultValue,
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }

  /**
   * Remove data from storage
   */
  static async remove(key: string): Promise<StorageResult<null>> {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error(`Storage.remove error for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }

  /**
   * Get all keys from storage (for debugging/migration)
   */
  static async getAllKeys(): Promise<StorageResult<string[]>> {
    try {
      const keys = [...await AsyncStorage.getAllKeys()];
      return { success: true, data: keys };
    } catch (error) {
      console.error('Storage.getAllKeys error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }

  /**
   * Clear all app data (for reset/logout)
   */
  static async clearAll(): Promise<StorageResult<null>> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((key) => key.startsWith('@ssdi/'));
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }
      return { success: true };
    } catch (error) {
      console.error('Storage.clearAll error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }

  /**
   * Get storage usage info (for diagnostics)
   */
  static async getStorageInfo(): Promise<{
    keys: string[];
    totalItems: number;
    appItems: number;
    error?: string;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((key) => key.startsWith('@ssdi/'));
      
      return {
        keys: appKeys,
        totalItems: allKeys.length,
        appItems: appKeys.length,
      };
    } catch (error) {
      return {
        keys: [],
        totalItems: 0,
        appItems: 0,
        error: error instanceof Error ? error.message : 'Storage error',
      };
    }
  }
}

/**
 * Profile-specific storage operations
 */
export class ProfileStorage {
  static async getActiveProfileId(): Promise<string | null> {
    const result = await Storage.get(STORAGE_KEYS.ACTIVE_PROFILE, null);
    return result.data || null;
  }

  static async setActiveProfileId(profileId: string | null): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.ACTIVE_PROFILE, profileId);
    return result.success;
  }

  static async getAllProfiles(): Promise<any[]> {
    const result = await Storage.get(STORAGE_KEYS.PROFILES, []);
    return result.data || [];
  }

  static async saveProfiles(profiles: any[]): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.PROFILES, profiles);
    return result.success;
  }
}

/**
 * Log-specific storage operations
 */
export class LogStorage {
  static async getDailyLogs(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.DAILY_LOGS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveDailyLogs(profileId: string, logs: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.DAILY_LOGS}_${profileId}`;
    const result = await Storage.set(key, logs);
    return result.success;
  }

  static async getActivityLogs(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.ACTIVITY_LOGS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveActivityLogs(profileId: string, logs: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.ACTIVITY_LOGS}_${profileId}`;
    const result = await Storage.set(key, logs);
    return result.success;
  }

  static async getGapExplanations(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.GAP_EXPLANATIONS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveGapExplanations(profileId: string, explanations: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.GAP_EXPLANATIONS}_${profileId}`;
    const result = await Storage.set(key, explanations);
    return result.success;
  }

  static async getLimitations(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.LIMITATIONS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveLimitations(profileId: string, limitations: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.LIMITATIONS}_${profileId}`;
    const result = await Storage.set(key, limitations);
    return result.success;
  }

  static async getMedications(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.MEDICATIONS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveMedications(profileId: string, medications: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.MEDICATIONS}_${profileId}`;
    const result = await Storage.set(key, medications);
    return result.success;
  }

  static async getAppointments(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.APPOINTMENTS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveAppointments(profileId: string, appointments: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.APPOINTMENTS}_${profileId}`;
    const result = await Storage.set(key, appointments);
    return result.success;
  }
  
  // Photo attachments
  static async getPhotos(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.PHOTOS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async savePhotos(profileId: string, photos: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.PHOTOS}_${profileId}`;
    const result = await Storage.set(key, photos);
    return result.success;
  }

  static async getReportDrafts(profileId: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.REPORT_DRAFTS}_${profileId}`;
    const result = await Storage.get(key, []);
    return result.data || [];
  }

  static async saveReportDrafts(profileId: string, drafts: any[]): Promise<boolean> {
    const key = `${STORAGE_KEYS.REPORT_DRAFTS}_${profileId}`;
    const result = await Storage.set(key, drafts);
    return result.success;
  }
}

/**
 * Settings storage
 */
export class SettingsStorage {
  static async getSettings(): Promise<any> {
    const result = await Storage.get(STORAGE_KEYS.SETTINGS, {});
    return result.data || {};
  }

  static async saveSettings(settings: any): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.SETTINGS, settings);
    return result.success;
  }

  static async getAppLockEnabled(): Promise<boolean> {
    const result = await Storage.get(STORAGE_KEYS.APP_LOCK_ENABLED, false);
    return result.data || false;
  }

  static async setAppLockEnabled(enabled: boolean): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.APP_LOCK_ENABLED, enabled);
    return result.success;
  }

  static async isFirstLaunch(): Promise<boolean> {
    const result = await Storage.get(STORAGE_KEYS.FIRST_LAUNCH, true);
    return result.data || false;
  }

  static async setFirstLaunchComplete(): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.FIRST_LAUNCH, false);
    return result.success;
  }
}

/**
 * Schema version management
 */
export class SchemaStorage {
  static async getCurrentVersion(): Promise<number> {
    const result = await Storage.get(STORAGE_KEYS.SCHEMA_VERSION, 0);
    return result.data || 0;
  }

  static async setCurrentVersion(version: number): Promise<boolean> {
    const result = await Storage.set(STORAGE_KEYS.SCHEMA_VERSION, version);
    return result.success;
  }

  static async needsMigration(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return currentVersion < CURRENT_SCHEMA_VERSION;
  }
}

/**
 * Backup and restore operations
 */
export class BackupStorage {
  /**
   * Export all data for a profile
   */
  static async exportProfileData(profileId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const [
        profiles,
        dailyLogs,
        activityLogs,
        limitations,
        medications,
        appointments,
        photos,
        reportDrafts,
      ] = await Promise.all([
        ProfileStorage.getAllProfiles(),
        LogStorage.getDailyLogs(profileId),
        LogStorage.getActivityLogs(profileId),
        LogStorage.getLimitations(profileId),
        LogStorage.getMedications(profileId),
        LogStorage.getAppointments(profileId),
        LogStorage.getPhotos(profileId),
        LogStorage.getReportDrafts(profileId),
      ]);

      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      const exportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        profile,
        dailyLogs,
        activityLogs,
        limitations,
        medications,
        appointments,
        photos,
        reportDrafts,
      };

      return { success: true, data: exportData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export error',
      };
    }
  }

  /**
   * Get app-wide backup data
   */
  static async createFullBackup(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((key) => key.startsWith('@ssdi/'));
      const allData = await AsyncStorage.multiGet(appKeys);
      
      const backupData: Record<string, any> = {};
      allData.forEach(([key, value]) => {
        if (value) {
          try {
            backupData[key] = JSON.parse(value);
          } catch {
            backupData[key] = value;
          }
        }
      });

      return {
        success: true,
        data: {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          keys: appKeys,
          data: backupData,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup error',
      };
    }
  }
}
