/**
 * Local Provider
 * 
 * Stores backups locally on device.
 * Fallback when no cloud provider is configured.
 */

import * as FileSystem from 'expo-file-system';
import { BackupPackage, BackupMetadata } from '../../domain/models/BackupModels';

const BACKUP_DIR = 'backups/';

export class LocalProvider {
  /**
   * Always available
   */
  static async isAvailable(): Promise<boolean> {
    return true;
  }
  
  /**
   * Save backup locally
   */
  static async upload(backup: BackupPackage): Promise<string> {
    try {
      const localPath = await this.getLocalPath(backup.metadata.id);
      
      await FileSystem.writeAsStringAsync(
        localPath,
        JSON.stringify(backup),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      return localPath;
    } catch (error) {
      throw new Error(`Local save failed: ${error}`);
    }
  }
  
  /**
   * Load backup from local storage
   */
  static async download(backupId: string): Promise<BackupPackage> {
    try {
      const localPath = await this.getLocalPath(backupId);
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error('Backup not found locally');
      }
      
      const content = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Local load failed: ${error}`);
    }
  }
  
  /**
   * List all local backups
   */
  static async list(): Promise<BackupMetadata[]> {
    try {
      const dirPath = await this.getLocalDir();
      
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        return [];
      }
      
      const files = await FileSystem.readDirectoryAsync(dirPath);
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
      
      metadataList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return metadataList;
    } catch (error) {
      throw new Error(`Local list failed: ${error}`);
    }
  }
  
  /**
   * Delete local backup
   */
  static async delete(backupId: string): Promise<void> {
    try {
      const localPath = await this.getLocalPath(backupId);
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localPath);
      }
    } catch (error) {
      throw new Error(`Local delete failed: ${error}`);
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
      const dirPath = await this.getLocalDir();
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(dirPath);
        let totalSize = 0;
        
        for (const file of files) {
          const filePath = `${dirPath}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
          if (fileInfo.exists && 'size' in fileInfo) {
            totalSize += fileInfo.size || 0;
          }
        }
        
        // Get free disk space
        const freeDiskSpace = await FileSystem.getFreeDiskStorageAsync();
        
        return {
          usedSpace: totalSize,
          availableSpace: freeDiskSpace
        };
      }
      
      return {};
    } catch (error) {
      console.error('Failed to get local storage info:', error);
      return {};
    }
  }
  
  /**
   * Get local directory path
   */
  private static async getLocalDir(): Promise<string> {
    const baseDir = FileSystem.documentDirectory;
    const localDir = `${baseDir}${BACKUP_DIR}`;
    
    await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
    
    return localDir;
  }
  
  /**
   * Get local path for specific backup
   */
  private static async getLocalPath(backupId: string): Promise<string> {
    const localDir = await this.getLocalDir();
    return `${localDir}${backupId}.json`;
  }
}
