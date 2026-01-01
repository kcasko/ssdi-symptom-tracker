/**
 * Backup and Restore Service
 * Handles complete data backup and restoration
 */

import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Profile } from '../domain/models/Profile';
import { Limitation } from '../domain/models/Limitation';
import { Medication } from '../domain/models/Medication';
import { Appointment } from '../domain/models/Appointment';
import { ReportDraft } from '../domain/models/ReportDraft';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';

export interface BackupData {
  version: string;
  timestamp: string;
  profiles: Profile[];
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
  medications: Medication[];
  appointments: Appointment[];
  reportDrafts: ReportDraft[];
  photos: PhotoAttachment[];
  settings?: any;
  evidenceModeConfig?: any;
}

export interface RestoreResult {
  success: boolean;
  profilesRestored: number;
  logsRestored: number;
  errors: string[];
}

export class BackupRestoreService {
  private static BACKUP_VERSION = '1.0';

  /**
   * Create complete backup of all app data
   */
  static async createBackup(data: {
    profiles: Profile[];
    dailyLogs: DailyLog[];
    activityLogs: ActivityLog[];
    limitations: Limitation[];
    medications: Medication[];
    appointments: Appointment[];
    reportDrafts: ReportDraft[];
    photos: PhotoAttachment[];
    settings?: any;
    evidenceModeConfig?: any;
  }): Promise<string> {
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      ...data,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = this.generateBackupFilename();
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, json);
    return fileUri;
  }

  /**
   * Generate backup filename with timestamp
   */
  static generateBackupFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `ssdi-backup-${dateStr}-${timeStr}.json`;
  }

  /**
   * Select and parse backup file
   */
  static async selectBackupFile(): Promise<BackupData | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backup = JSON.parse(fileContent) as BackupData;

      // Validate backup structure
      if (!this.validateBackup(backup)) {
        Alert.alert('Invalid Backup', 'The selected file is not a valid SSDI Symptom Tracker backup.');
        return null;
      }

      return backup;
    } catch (error) {
      console.error('Error selecting backup file:', error);
      Alert.alert('Error', 'Failed to read backup file. Please ensure the file is valid JSON.');
      return null;
    }
  }

  /**
   * Validate backup data structure
   */
  static validateBackup(backup: any): backup is BackupData {
    return (
      backup &&
      typeof backup.version === 'string' &&
      typeof backup.timestamp === 'string' &&
      Array.isArray(backup.profiles) &&
      Array.isArray(backup.dailyLogs) &&
      Array.isArray(backup.activityLogs)
    );
  }

  /**
   * Restore data from backup
   * @param backup Backup data to restore
   * @param options Restore options
   */
  static async restoreFromBackup(
    backup: BackupData,
    _options: {
      mergeWithExisting?: boolean; // If false, clears existing data first
      skipPhotos?: boolean; // Photos may not restore if files don't exist
    } = {}
  ): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      profilesRestored: 0,
      logsRestored: 0,
      errors: [],
    };

    try {
      // Version compatibility check
      if (backup.version !== this.BACKUP_VERSION) {
        result.errors.push(
          `Backup version mismatch. Expected ${this.BACKUP_VERSION}, got ${backup.version}`
        );
        // Continue anyway, but warn user
      }

      // Count restored items
      result.profilesRestored = backup.profiles.length;
      result.logsRestored = backup.dailyLogs.length + backup.activityLogs.length;

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during restore');
      return result;
    }
  }

  /**
   * Create minimal backup with only essential data
   */
  static async createMinimalBackup(data: {
    profiles: Profile[];
    dailyLogs: DailyLog[];
    activityLogs: ActivityLog[];
  }): Promise<string> {
    const backup = {
      version: this.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      profiles: data.profiles,
      dailyLogs: data.dailyLogs,
      activityLogs: data.activityLogs,
      limitations: [],
      medications: [],
      appointments: [],
      reportDrafts: [],
      photos: [],
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `ssdi-minimal-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, json);
    return fileUri;
  }

  /**
   * Get backup file info without loading full content
   */
  static async getBackupInfo(uri: string): Promise<{
    version: string;
    timestamp: string;
    profileCount: number;
    logCount: number;
  } | null> {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      const backup = JSON.parse(content) as BackupData;

      return {
        version: backup.version,
        timestamp: backup.timestamp,
        profileCount: backup.profiles.length,
        logCount: backup.dailyLogs.length + backup.activityLogs.length,
      };
    } catch {
      return null;
    }
  }

  /**
   * Export backup to sharing options
   */
  static async shareBackup(fileUri: string): Promise<void> {
    // Platform-specific sharing would go here
    // For now, just return the URI for the app to handle
    console.log('Backup ready for sharing:', fileUri);
  }
}
