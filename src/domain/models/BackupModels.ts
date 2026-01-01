/**
 * Backup Models
 * 
 * Data structures for encrypted cloud backup system.
 */

/**
 * Backup configuration
 */
export interface BackupConfig {
  // Cloud provider
  provider: 'icloud' | 's3' | 'gdrive' | 'local';
  
  // Schedule
  autoBackup: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  retentionDays: number; // How long to keep old backups
  
  // Encryption
  encryptionEnabled: boolean;
  encryptionMethod: 'aes-256-gcm' | 'chacha20-poly1305';
  
  // What to backup
  includePhotos: boolean;
  includeReports: boolean;
  compressBeforeUpload: boolean;
  
  // Storage limits
  maxBackupSizeMB: number;
  warnAtStoragePercent: number;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  createdAt: Date;
  
  // Version info
  appVersion: string;
  dataVersion: number;
  
  // Content
  entities: BackupEntityCount[];
  totalSizeBytes: number;
  compressedSizeBytes?: number;
  
  // Encryption
  encrypted: boolean;
  encryptionMethod?: string;
  encryptionKeyId?: string; // Reference to encryption key (not the key itself!)
  
  // Cloud storage
  provider: BackupConfig['provider'];
  cloudPath?: string;
  checksum: string;
}

export interface BackupEntityCount {
  entityType: string;
  count: number;
  sizeBytes: number;
}

/**
 * Complete backup package
 */
export interface BackupPackage {
  metadata: BackupMetadata;
  
  // Encrypted data blob
  data: string; // Base64-encoded encrypted JSON
  
  // Integrity
  signature: string;
}

/**
 * Backup restore result
 */
export interface RestoreResult {
  success: boolean;
  timestamp: Date;
  
  // What was restored
  entitiesRestored: BackupEntityCount[];
  
  // Conflicts
  conflictsDetected: number;
  conflictsResolved: number;
  
  // Errors
  errors: string[];
  warnings: string[];
}

/**
 * Backup history entry
 */
export interface BackupHistoryEntry {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual';
  success: boolean;
  sizeBytes: number;
  provider: BackupConfig['provider'];
  error?: string;
}

/**
 * Cloud storage info
 */
export interface CloudStorageInfo {
  provider: BackupConfig['provider'];
  connected: boolean;
  lastSync?: Date;
  
  // Quota
  totalSpaceBytes?: number;
  usedSpaceBytes?: number;
  availableSpaceBytes?: number;
  
  // Backups
  backupCount: number;
  oldestBackup?: Date;
  newestBackup?: Date;
}

/**
 * Backup verification result
 */
export interface BackupVerification {
  valid: boolean;
  timestamp: Date;
  
  checks: {
    checksumValid: boolean;
    signatureValid: boolean;
    encryptionValid: boolean;
    dataIntegrity: boolean;
    versionCompatible: boolean;
  };
  
  errors: string[];
}

/**
 * Default backup configuration
 */
export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  provider: 'icloud',
  autoBackup: true,
  backupFrequency: 'daily',
  retentionDays: 30,
  encryptionEnabled: true,
  encryptionMethod: 'aes-256-gcm',
  includePhotos: true,
  includeReports: true,
  compressBeforeUpload: true,
  maxBackupSizeMB: 100,
  warnAtStoragePercent: 80
};
