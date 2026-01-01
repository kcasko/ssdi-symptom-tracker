/**
 * Sync Models
 * 
 * Data structures for offline-first sync system.
 * Handles conflict resolution and operation queuing.
 */

/**
 * Sync operation types
 */
export type SyncOperation = 
  | 'create'
  | 'update'
  | 'delete';

export type EntityType =
  | 'dailyLog'
  | 'activityLog'
  | 'limitation'
  | 'appointment'
  | 'medication'
  | 'profile'
  | 'workHistory'
  | 'rfc'
  | 'photo';

/**
 * Pending operation in offline queue
 */
export interface PendingOperation {
  id: string;
  timestamp: Date;
  operation: SyncOperation;
  entityType: EntityType;
  entityId: string;
  data: any;
  
  // For conflict resolution
  localVersion: number;
  serverVersion?: number;
  
  // Retry tracking
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  
  // Dependencies
  dependsOn?: string[]; // Other operation IDs that must complete first
}

/**
 * Sync state tracking
 */
export interface SyncState {
  lastSyncTime?: Date;
  syncInProgress: boolean;
  pendingOperations: PendingOperation[];
  
  // Conflict tracking
  conflicts: SyncConflict[];
  
  // Status
  online: boolean;
  lastOnlineTime?: Date;
  consecutiveFailures: number;
}

/**
 * Conflict when local and server versions differ
 */
export interface SyncConflict {
  id: string;
  detectedAt: Date;
  entityType: EntityType;
  entityId: string;
  
  localVersion: {
    data: any;
    timestamp: Date;
    version: number;
  };
  
  serverVersion: {
    data: any;
    timestamp: Date;
    version: number;
  };
  
  // Resolution
  resolved: boolean;
  resolution?: 'use_local' | 'use_server' | 'merge' | 'manual';
  resolvedAt?: Date;
  resolvedData?: any;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  // Auto-sync settings
  autoSync: boolean;
  syncInterval: number; // minutes
  syncOnConnect: boolean;
  
  // Conflict resolution strategy
  conflictStrategy: 'local_wins' | 'server_wins' | 'newest_wins' | 'manual';
  
  // Retry settings
  maxRetries: number;
  retryBackoff: number; // exponential backoff multiplier
  
  // Performance
  batchSize: number; // operations per sync batch
  throttleMs: number; // minimum time between syncs
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  timestamp: Date;
  
  // Operations
  operationsAttempted: number;
  operationsCompleted: number;
  operationsFailed: number;
  
  // Conflicts
  conflictsDetected: number;
  conflictsResolved: number;
  
  // Data transferred
  bytesUploaded: number;
  bytesDownloaded: number;
  
  // Errors
  errors: SyncError[];
}

export interface SyncError {
  operation: PendingOperation;
  error: string;
  recoverable: boolean;
  retryAfter?: Date;
}

/**
 * Entity metadata for version tracking
 */
export interface EntityMetadata {
  id: string;
  entityType: EntityType;
  version: number;
  lastModified: Date;
  modifiedBy: 'local' | 'server';
  hash?: string; // For quick change detection
}

/**
 * Sync manifest - tracks all synced entities
 */
export interface SyncManifest {
  lastUpdated: Date;
  entities: Map<string, EntityMetadata>;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 15, // 15 minutes
  syncOnConnect: true,
  conflictStrategy: 'newest_wins',
  maxRetries: 3,
  retryBackoff: 2,
  batchSize: 50,
  throttleMs: 5000
};

/**
 * Helper to create operation ID
 */
export function createOperationId(
  operation: SyncOperation,
  entityType: EntityType,
  entityId: string
): string {
  return `${operation}_${entityType}_${entityId}_${Date.now()}`;
}

/**
 * Helper to check if operation can retry
 */
export function canRetryOperation(
  operation: PendingOperation,
  config: SyncConfig
): boolean {
  if (operation.attempts >= config.maxRetries) {
    return false;
  }
  
  if (!operation.lastAttempt) {
    return true;
  }
  
  const backoffMs = config.throttleMs * Math.pow(config.retryBackoff, operation.attempts);
  const nextRetryTime = new Date(operation.lastAttempt.getTime() + backoffMs);
  
  return new Date() >= nextRetryTime;
}

/**
 * Helper to detect conflicts
 */
export function hasConflict(
  localVersion: number,
  serverVersion: number
): boolean {
  return localVersion !== serverVersion && serverVersion > 0;
}

/**
 * Resolve conflict based on strategy
 */
export function resolveConflict(
  conflict: SyncConflict,
  strategy: SyncConfig['conflictStrategy']
): any {
  switch (strategy) {
    case 'local_wins':
      return conflict.localVersion.data;
      
    case 'server_wins':
      return conflict.serverVersion.data;
      
    case 'newest_wins':
      return conflict.localVersion.timestamp > conflict.serverVersion.timestamp
        ? conflict.localVersion.data
        : conflict.serverVersion.data;
        
    case 'manual':
      return null; // User must resolve manually
      
    default:
      return conflict.localVersion.data;
  }
}
