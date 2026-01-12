/**
 * Data Migrations
 * Handles schema changes and data migrations between versions
 */

// Declare __DEV__ global for React Native
declare const __DEV__: boolean;

import { CURRENT_SCHEMA_VERSION } from '../utils/constants';
import { Storage, SchemaStorage, ProfileStorage, LogStorage } from './storage';
import { generateId } from '../utils/ids';

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: string[];
  error?: string;
}

export interface Migration {
  version: number;
  name: string;
  description: string;
  migrate: () => Promise<void>;
}

/**
 * Migration Manager
 */
export class MigrationManager {
  private static migrations: Migration[] = [
    {
      version: 1,
      name: 'initial_schema',
      description: 'Set up initial schema version',
      migrate: async () => {
        // Initial migration - just set schema version
        await SchemaStorage.setCurrentVersion(1);
      },
    },
    // Future migrations would be added here
    // {
    //   version: 2,
    //   name: 'add_medication_effectiveness',
    //   description: 'Add effectiveness rating to medications',
    //   migrate: async () => {
    //     // Migration logic for version 2
    //   },
    // },
  ];

  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<MigrationResult> {
    const currentVersion = await SchemaStorage.getCurrentVersion();
    const targetVersion = CURRENT_SCHEMA_VERSION;
    
    if (currentVersion >= targetVersion) {
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        migrationsApplied: [],
      };
    }

    const pendingMigrations = this.migrations.filter(
      (m) => m.version > currentVersion && m.version <= targetVersion
    );

    const appliedMigrations: string[] = [];

    try {
      for (const migration of pendingMigrations) {
        console.log(`Running migration: ${migration.name}`);
        await migration.migrate();
        appliedMigrations.push(migration.name);
      }

      await SchemaStorage.setCurrentVersion(targetVersion);

      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        migrationsApplied: appliedMigrations,
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        migrationsApplied: appliedMigrations,
        error: error instanceof Error ? error.message : 'Migration error',
      };
    }
  }

  /**
   * Check if migrations are needed
   */
  static async needsMigration(): Promise<boolean> {
    return await SchemaStorage.needsMigration();
  }

  /**
   * Get migration info
   */
  static async getMigrationInfo(): Promise<{
    currentVersion: number;
    targetVersion: number;
    pendingMigrations: Migration[];
  }> {
    const currentVersion = await SchemaStorage.getCurrentVersion();
    const targetVersion = CURRENT_SCHEMA_VERSION;
    
    const pendingMigrations = this.migrations.filter(
      (m) => m.version > currentVersion && m.version <= targetVersion
    );

    return {
      currentVersion,
      targetVersion,
      pendingMigrations,
    };
  }
}

/**
 * Data repair utilities
 */
export class DataRepair {
  /**
   * Repair missing IDs in existing data
   */
  static async repairMissingIds(): Promise<{
    success: boolean;
    repaired: number;
    error?: string;
  }> {
    try {
      let repairedCount = 0;
      const profiles = await ProfileStorage.getAllProfiles();
      
      for (const profile of profiles) {
        // Repair profile ID if missing
        if (!profile.id) {
          profile.id = generateId();
          repairedCount++;
        }
        
        // Repair daily logs
        const dailyLogs = await LogStorage.getDailyLogs(profile.id);
        let logsChanged = false;
        
        for (const log of dailyLogs) {
          if (!log.id) {
            log.id = generateId();
            repairedCount++;
            logsChanged = true;
          }
          if (!log.profileId) {
            log.profileId = profile.id;
            repairedCount++;
            logsChanged = true;
          }
        }
        
        if (logsChanged) {
          await LogStorage.saveDailyLogs(profile.id, dailyLogs);
        }
        
        // Repair activity logs
        const activityLogs = await LogStorage.getActivityLogs(profile.id);
        logsChanged = false;
        
        for (const log of activityLogs) {
          if (!log.id) {
            log.id = generateId();
            repairedCount++;
            logsChanged = true;
          }
          if (!log.profileId) {
            log.profileId = profile.id;
            repairedCount++;
            logsChanged = true;
          }
        }
        
        if (logsChanged) {
          await LogStorage.saveActivityLogs(profile.id, activityLogs);
        }
        
        // Repair other data types similarly...
      }
      
      if (profiles.some(p => !p.id)) {
        await ProfileStorage.saveProfiles(profiles);
      }

      return { success: true, repaired: repairedCount };
    } catch (error) {
      return {
        success: false,
        repaired: 0,
        error: error instanceof Error ? error.message : 'Repair error',
      };
    }
  }

  /**
   * Validate data integrity
   */
  static async validateDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const profiles = await ProfileStorage.getAllProfiles();
      
      // Check for profiles without IDs
      const profilesWithoutIds = profiles.filter(p => !p.id);
      if (profilesWithoutIds.length > 0) {
        issues.push(`${profilesWithoutIds.length} profiles missing IDs`);
      }

      // Check for duplicate profile IDs
      const profileIds = profiles.map(p => p.id).filter(Boolean);
      const duplicateIds = profileIds.filter((id, index) => profileIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        issues.push(`Duplicate profile IDs found: ${duplicateIds.join(', ')}`);
      }

      for (const profile of profiles) {
        if (!profile.id) continue;

        // Check daily logs
        const dailyLogs = await LogStorage.getDailyLogs(profile.id);
        const logsWithoutIds = dailyLogs.filter(log => !log.id);
        if (logsWithoutIds.length > 0) {
          issues.push(`Profile ${profile.name}: ${logsWithoutIds.length} daily logs missing IDs`);
        }

        const logsWithWrongProfile = dailyLogs.filter(log => log.profileId !== profile.id);
        if (logsWithWrongProfile.length > 0) {
          issues.push(`Profile ${profile.name}: ${logsWithWrongProfile.length} daily logs with wrong profileId`);
        }

        // Check activity logs
        const activityLogs = await LogStorage.getActivityLogs(profile.id);
        const activityLogsWithoutIds = activityLogs.filter(log => !log.id);
        if (activityLogsWithoutIds.length > 0) {
          issues.push(`Profile ${profile.name}: ${activityLogsWithoutIds.length} activity logs missing IDs`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Data validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Clean up orphaned data
   */
  static async cleanupOrphanedData(): Promise<{
    success: boolean;
    cleaned: number;
    error?: string;
  }> {
    try {
      let cleanedCount = 0;
      const profiles = await ProfileStorage.getAllProfiles();
      const validProfileIds = profiles.map(p => p.id).filter(Boolean);

      // Get all keys to check for orphaned profile data
      const storageInfo = await Storage.getStorageInfo();
      
      for (const key of storageInfo.keys) {
        // Check if this is a profile-specific key
        const keyParts = key.split('_');
        if (keyParts.length >= 2) {
          const potentialProfileId = keyParts[keyParts.length - 1];
          
          // If this looks like a profile ID but isn't in our valid list
          if (potentialProfileId.includes('-') && !validProfileIds.includes(potentialProfileId)) {
            await Storage.remove(key);
            cleanedCount++;
            console.log(`Cleaned up orphaned data: ${key}`);
          }
        }
      }

      return { success: true, cleaned: cleanedCount };
    } catch (error) {
      return {
        success: false,
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Cleanup error',
      };
    }
  }
}

/**
 * Development utilities (only for development builds)
 */
export class DevUtilities {
  /**
   * Reset all app data (development only)
   */
  static async resetAllData(): Promise<boolean> {
    if (__DEV__) {
      const result = await Storage.clearAll();
      if (result.success) {
        await SchemaStorage.setCurrentVersion(0);
      }
      return result.success;
    }
    return false;
  }

  /**
   * Create sample data for testing and development
   */
  static async createSampleData(): Promise<boolean> {
    if (__DEV__) {
      console.log('[Migration] Sample data creation is disabled - use test data import feature instead');
    }
    return false;
  }

  /**
   * Log storage statistics
   */
  static async logStorageStats(): Promise<void> {
    if (__DEV__) {
      const info = await Storage.getStorageInfo();
      console.log('Storage Statistics:', info);
      
      const profiles = await ProfileStorage.getAllProfiles();
      console.log(`Profiles: ${profiles.length}`);
      
      for (const profile of profiles) {
        const dailyLogs = await LogStorage.getDailyLogs(profile.id);
        const activityLogs = await LogStorage.getActivityLogs(profile.id);
        console.log(`Profile ${profile.name}: ${dailyLogs.length} daily logs, ${activityLogs.length} activity logs`);
      }
    }
  }
}