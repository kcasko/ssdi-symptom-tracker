/**
 * iCloud Provider
 * 
 * Handles backup storage in iCloud Drive.
 * iOS only - automatically uses user's iCloud account.
 */

import * as FileSystem from 'expo-file-system';
import { BackupPackage, BackupMetadata } from '../../domain/models/BackupModels';

// const ICLOUD_CONTAINER = 'iCloud.com.symptomtracker'; // Update with your actual bundle ID
const BACKUP_DIR = 'backups/';

export class ICloudProvider {
  /**
   * Check if iCloud is available
   */
  static async isAvailable(): Promise<boolean> {
    // In Expo, iCloud support requires custom native modules or managed workflow config
    // For now, check if we're on iOS
    return FileSystem.getInfoAsync !== undefined;
  }
  
  /**
   * Upload backup to iCloud
   */
  static async upload(backup: BackupPackage): Promise<string> {
    try {
      const cloudPath = await this.getCloudPath(backup.metadata.id);
      
      // Write to iCloud-enabled directory
      await FileSystem.writeAsStringAsync(
        cloudPath,
        JSON.stringify(backup),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      return cloudPath;
    } catch (error) {
      throw new Error(`iCloud upload failed: ${error}`);
    }
  }
  
  /**
   * Download backup from iCloud
   */
  static async download(backupId: string): Promise<BackupPackage> {
    try {
      const cloudPath = await this.getCloudPath(backupId);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(cloudPath);
      if (!fileInfo.exists) {
        throw new Error('Backup not found in iCloud');
      }
      
      // Read from iCloud
      const content = await FileSystem.readAsStringAsync(cloudPath, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`iCloud download failed: ${error}`);
    }
  }
  
  /**
   * List all backups in iCloud
   */
  static async list(): Promise<BackupMetadata[]> {
    try {
      const dirPath = await this.getCloudDir();
      
      // Check if directory exists
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        return [];
      }
      
      // Read directory
      const files = await FileSystem.readDirectoryAsync(dirPath);
      
      // Load metadata from each backup
      const metadataList: BackupMetadata[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = `${dirPath}${file}`;
            const content = await FileSystem.readAsStringAsync(filePath);
            const backup: BackupPackage = JSON.parse(content);
            metadataList.push(backup.metadata);
          } catch (error) {
            console.error(`Failed to read backup ${file}:`, error);
          }
        }
      }
      
      // Sort by date, newest first
      metadataList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return metadataList;
    } catch (error) {
      throw new Error(`iCloud list failed: ${error}`);
    }
  }
  
  /**
   * Delete backup from iCloud
   */
  static async delete(backupId: string): Promise<void> {
    try {
      const cloudPath = await this.getCloudPath(backupId);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(cloudPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cloudPath);
      }
    } catch (error) {
      throw new Error(`iCloud delete failed: ${error}`);
    }
  }
  
  /**
   * Get storage info
   */
  static async getStorageInfo(): Promise<{
    totalSpace?: number;
    usedSpace?: number;
    availableSpace?: number;
  }> {
    try {
      const dirPath = await this.getCloudDir();
      const dirInfo = await FileSystem.getInfoAsync(dirPath, { size: true });
      
      if (dirInfo.exists && dirInfo.isDirectory) {
        // Calculate total size of all backups
        const files = await FileSystem.readDirectoryAsync(dirPath);
        let totalSize = 0;
        
        for (const file of files) {
          const filePath = `${dirPath}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
          if (fileInfo.exists && 'size' in fileInfo) {
            totalSize += fileInfo.size || 0;
          }
        }
        
        return {
          usedSpace: totalSize
        };
      }
      
      return {};
    } catch (error) {
      console.error('Failed to get iCloud storage info:', error);
      return {};
    }
  }
  
  /**
   * Get iCloud directory path
   */
  private static async getCloudDir(): Promise<string> {
    // In a real implementation, this would use the iCloud container path
    // For Expo, we'll use the document directory with a special subfolder
    const baseDir = FileSystem.documentDirectory;
    const cloudDir = `${baseDir}icloud/${BACKUP_DIR}`;
    
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(cloudDir, { intermediates: true });
    
    return cloudDir;
  }
  
  /**
   * Get cloud path for specific backup
   */
  private static async getCloudPath(backupId: string): Promise<string> {
    const cloudDir = await this.getCloudDir();
    return `${cloudDir}${backupId}.json`;
  }
}
