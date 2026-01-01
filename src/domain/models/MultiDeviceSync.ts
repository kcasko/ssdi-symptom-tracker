/**
 * Multi-Device Sync Models
 * 
 * Data structures for synchronizing data across multiple devices.
 * Builds on top of SyncService (offline queue) and CloudBackupService (cloud storage).
 */

/**
 * Device registration
 */
export interface Device {
  id: string; // Unique device ID
  name: string; // User-friendly name (e.g., "Keith's iPhone")
  platform: 'ios' | 'android' | 'web';
  lastSyncTime?: Date;
  registeredAt: Date;
  active: boolean;
}

/**
 * Sync manifest - tracks what each device has
 */
export interface DeviceSyncManifest {
  deviceId: string;
  lastUpdated: Date;
  
  // Entity checksums for quick change detection
  entityChecksums: Map<string, string>; // entityId -> checksum
  
  // Version vectors for conflict resolution
  versionVectors: Map<string, number>; // entityId -> version
}

/**
 * Change record for delta sync
 */
export interface ChangeRecord {
  id: string;
  timestamp: Date;
  deviceId: string;
  
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  
  // For delta sync
  changes: any; // Only changed fields
  previousChecksum?: string;
  newChecksum: string;
  
  // Version tracking
  version: number;
  parentVersion?: number; // Version this change is based on
}

/**
 * Sync session - tracks a multi-device sync operation
 */
export interface SyncSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  deviceId: string;
  
  // What was synced
  changesPushed: number;
  changesPulled: number;
  conflictsResolved: number;
  
  // Performance
  bytesUploaded: number;
  bytesDownloaded: number;
  
  // Status
  status: 'in_progress' | 'completed' | 'failed';
  error?: string;
}

/**
 * Device conflict - when same entity modified on multiple devices
 */
export interface DeviceConflict {
  id: string;
  detectedAt: Date;
  entityType: string;
  entityId: string;
  
  // Conflicting versions from different devices
  versions: Array<{
    deviceId: string;
    deviceName: string;
    timestamp: Date;
    version: number;
    data: any;
    checksum: string;
  }>;
  
  // Resolution
  resolved: boolean;
  resolution?: 'use_device' | 'merge' | 'manual';
  selectedDeviceId?: string;
  resolvedData?: any;
  resolvedAt?: Date;
}

/**
 * Multi-device sync configuration
 */
export interface MultiDeviceSyncConfig {
  // Device settings
  deviceName: string;
  autoRegisterDevice: boolean;
  
  // Sync behavior
  autoSync: boolean;
  syncIntervalMinutes: number;
  syncOnAppForeground: boolean;
  
  // Conflict resolution
  conflictStrategy: 'newest_wins' | 'manual' | 'device_priority';
  devicePriority?: string[]; // Device IDs in priority order
  
  // Performance
  useDeltaSync: boolean; // Only sync changes, not full entities
  maxChangesPerBatch: number;
  compressionEnabled: boolean;
  
  // Storage
  cloudProvider: 'icloud' | 's3' | 'gdrive' | 'firebase';
  useCloudStorage: boolean; // If false, devices sync via local network only
}

/**
 * Sync statistics
 */
export interface SyncStatistics {
  totalDevices: number;
  activeDevices: number;
  
  totalSyncSessions: number;
  lastSyncTime?: Date;
  
  totalChangesPushed: number;
  totalChangesPulled: number;
  totalConflicts: number;
  totalConflictsResolved: number;
  
  averageSyncDurationMs: number;
  totalDataSynced: number; // bytes
}

/**
 * Default multi-device sync configuration
 */
export const DEFAULT_MULTI_DEVICE_CONFIG: MultiDeviceSyncConfig = {
  deviceName: 'My Device',
  autoRegisterDevice: true,
  autoSync: true,
  syncIntervalMinutes: 15,
  syncOnAppForeground: true,
  conflictStrategy: 'newest_wins',
  useDeltaSync: true,
  maxChangesPerBatch: 100,
  compressionEnabled: true,
  cloudProvider: 'icloud',
  useCloudStorage: true
};

/**
 * Helper to generate device ID
 */
export function generateDeviceId(): string {
  // In real implementation, use expo-constants to get device ID
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to calculate entity checksum
 */
export async function calculateEntityChecksum(entity: any): Promise<string> {
  const json = JSON.stringify(entity);
  // In real implementation, use crypto hash
  return json.length.toString(); // Simplified
}

/**
 * Helper to detect changes between entities
 */
export function detectChanges(oldEntity: any, newEntity: any): any {
  const changes: any = {};
  
  for (const key in newEntity) {
    if (JSON.stringify(oldEntity[key]) !== JSON.stringify(newEntity[key])) {
      changes[key] = newEntity[key];
    }
  }
  
  return changes;
}

/**
 * Helper to apply changes to entity
 */
export function applyChanges(entity: any, changes: any): any {
  return { ...entity, ...changes };
}

/**
 * Helper to merge conflicting entities
 */
export function mergeEntities(entities: any[]): any {
  // Simple merge: take most recent value for each field
  const merged: any = {};
  
  entities.forEach(entity => {
    Object.keys(entity).forEach(key => {
      if (key === 'lastModified' || key === 'updatedAt') {
        // Take latest timestamp
        if (!merged[key] || new Date(entity[key]) > new Date(merged[key])) {
          merged[key] = entity[key];
        }
      } else {
        // For other fields, last write wins
        merged[key] = entity[key];
      }
    });
  });
  
  return merged;
}
