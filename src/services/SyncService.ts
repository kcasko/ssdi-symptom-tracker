/**
 * Sync Service
 * 
 * Handles offline-first sync with conflict resolution.
 * Queues operations when offline, syncs when connection restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  SyncState,
  SyncConfig,
  SyncResult,
  PendingOperation,
  SyncConflict,
  SyncManifest,
  DEFAULT_SYNC_CONFIG,
  SyncOperation,
  EntityType,
  createOperationId,
  canRetryOperation,
  resolveConflict
} from '../domain/models/SyncModels';

const SYNC_STATE_KEY = '@sync_state';
const SYNC_MANIFEST_KEY = '@sync_manifest';
const SYNC_CONFIG_KEY = '@sync_config';

export class SyncService {
  private static syncState: SyncState | null = null;
  private static syncManifest: SyncManifest | null = null;
  private static config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private static syncTimer: NodeJS.Timeout | null = null;
  private static listeners: Array<(state: SyncState) => void> = [];
  
  /**
   * Initialize sync service
   */
  static async initialize(): Promise<void> {
    // Load state
    await this.loadState();
    await this.loadManifest();
    await this.loadConfig();
    
    // Monitor network state
    NetInfo.addEventListener(state => {
      this.handleNetworkStateChange(state.isConnected || false);
    });
    
    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }
  
  /**
   * Queue an operation for sync
   */
  static async queueOperation(
    operation: SyncOperation,
    entityType: EntityType,
    entityId: string,
    data: any,
    dependsOn?: string[]
  ): Promise<void> {
    if (!this.syncState) {
      await this.loadState();
    }
    
    // Get current version
    const metadata = this.syncManifest?.entities.get(entityId);
    const localVersion = (metadata?.version || 0) + 1;
    
    const pendingOp: PendingOperation = {
      id: createOperationId(operation, entityType, entityId),
      timestamp: new Date(),
      operation,
      entityType,
      entityId,
      data,
      localVersion,
      attempts: 0,
      dependsOn
    };
    
    this.syncState!.pendingOperations.push(pendingOp);
    await this.saveState();
    
    // Update local metadata
    await this.updateLocalMetadata(entityId, entityType, localVersion);
    
    // Try immediate sync if online
    if (this.syncState!.online) {
      await this.sync();
    }
  }
  
  /**
   * Perform sync
   */
  static async sync(): Promise<SyncResult> {
    if (!this.syncState) {
      await this.loadState();
    }
    
    // Prevent concurrent syncs
    if (this.syncState!.syncInProgress) {
      return this.createEmptyResult(false, 'Sync already in progress');
    }
    
    // Check throttle
    if (this.syncState!.lastSyncTime) {
      const timeSinceLastSync = Date.now() - this.syncState!.lastSyncTime.getTime();
      if (timeSinceLastSync < this.config.throttleMs) {
        return this.createEmptyResult(false, 'Sync throttled');
      }
    }
    
    this.syncState!.syncInProgress = true;
    await this.saveState();
    
    const result: SyncResult = {
      success: true,
      timestamp: new Date(),
      operationsAttempted: 0,
      operationsCompleted: 0,
      operationsFailed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      bytesUploaded: 0,
      bytesDownloaded: 0,
      errors: []
    };
    
    try {
      // Get operations ready to sync
      const operations = this.getOperationsToSync();
      result.operationsAttempted = operations.length;
      
      // Process in batches
      for (let i = 0; i < operations.length; i += this.config.batchSize) {
        const batch = operations.slice(i, i + this.config.batchSize);
        const batchResult = await this.processBatch(batch);
        
        result.operationsCompleted += batchResult.completed;
        result.operationsFailed += batchResult.failed;
        result.conflictsDetected += batchResult.conflictsDetected;
        result.conflictsResolved += batchResult.conflictsResolved;
        result.bytesUploaded += batchResult.bytesUploaded;
        result.errors.push(...batchResult.errors);
      }
      
      // Pull server changes
      const pullResult = await this.pullServerChanges();
      result.bytesDownloaded = pullResult.bytesDownloaded;
      
      // Update state
      this.syncState!.lastSyncTime = new Date();
      this.syncState!.consecutiveFailures = result.errors.length > 0
        ? this.syncState!.consecutiveFailures + 1
        : 0;
        
      result.success = result.errors.length === 0;
      
    } catch (error) {
      result.success = false;
      result.errors.push({
        operation: null as any,
        error: String(error),
        recoverable: false
      });
    } finally {
      this.syncState!.syncInProgress = false;
      await this.saveState();
      this.notifyListeners();
    }
    
    return result;
  }
  
  /**
   * Get operations ready to sync
   */
  private static getOperationsToSync(): PendingOperation[] {
    if (!this.syncState) return [];
    
    const ready: PendingOperation[] = [];
    const completed = new Set<string>();
    
    for (const op of this.syncState.pendingOperations) {
      // Check retry eligibility
      if (!canRetryOperation(op, this.config)) {
        continue;
      }
      
      // Check dependencies
      if (op.dependsOn && op.dependsOn.length > 0) {
        const allDepsCompleted = op.dependsOn.every(depId => completed.has(depId));
        if (!allDepsCompleted) {
          continue;
        }
      }
      
      ready.push(op);
      completed.add(op.id);
    }
    
    return ready;
  }
  
  /**
   * Process batch of operations
   */
  private static async processBatch(
    operations: PendingOperation[]
  ): Promise<{
    completed: number;
    failed: number;
    conflictsDetected: number;
    conflictsResolved: number;
    bytesUploaded: number;
    errors: any[];
  }> {
    const result = {
      completed: 0,
      failed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      bytesUploaded: 0,
      errors: [] as any[]
    };
    
    for (const op of operations) {
      try {
        // Simulate server API call (replace with actual API)
        const syncResult = await this.syncOperationToServer(op);
        
        if (syncResult.conflict) {
          result.conflictsDetected++;
          const conflict = this.createConflict(op, syncResult.serverData);
          
          // Try auto-resolve
          const resolved = await this.tryResolveConflict(conflict);
          if (resolved) {
            result.conflictsResolved++;
            await this.removeOperation(op.id);
            result.completed++;
          } else {
            this.syncState!.conflicts.push(conflict);
            result.failed++;
          }
        } else {
          // Success
          await this.removeOperation(op.id);
          await this.updateLocalMetadata(
            op.entityId,
            op.entityType,
            syncResult.serverVersion
          );
          result.completed++;
        }
        
        result.bytesUploaded += JSON.stringify(op.data).length;
        
      } catch (error) {
        op.attempts++;
        op.lastAttempt = new Date();
        op.error = String(error);
        result.failed++;
        result.errors.push({
          operation: op,
          error: String(error),
          recoverable: op.attempts < this.config.maxRetries
        });
      }
    }
    
    return result;
  }
  
  /**
   * Sync operation to server (stub - implement with actual API)
   */
  private static async syncOperationToServer(
    op: PendingOperation
  ): Promise<{
    success: boolean;
    conflict: boolean;
    serverVersion: number;
    serverData?: any;
  }> {
    // TODO: Replace with actual server API call
    // For now, simulate success
    return {
      success: true,
      conflict: false,
      serverVersion: op.localVersion,
      serverData: null
    };
  }
  
  /**
   * Pull changes from server
   */
  private static async pullServerChanges(): Promise<{
    bytesDownloaded: number;
  }> {
    // TODO: Implement server pull
    // For now, return empty result
    return {
      bytesDownloaded: 0
    };
  }
  
  /**
   * Create conflict object
   */
  private static createConflict(
    op: PendingOperation,
    serverData: any
  ): SyncConflict {
    return {
      id: `conflict_${op.id}`,
      detectedAt: new Date(),
      entityType: op.entityType,
      entityId: op.entityId,
      localVersion: {
        data: op.data,
        timestamp: op.timestamp,
        version: op.localVersion
      },
      serverVersion: {
        data: serverData.data,
        timestamp: new Date(serverData.timestamp),
        version: serverData.version
      },
      resolved: false
    };
  }
  
  /**
   * Try to auto-resolve conflict
   */
  private static async tryResolveConflict(
    conflict: SyncConflict
  ): Promise<boolean> {
    if (this.config.conflictStrategy === 'manual') {
      return false;
    }
    
    const resolvedData = resolveConflict(conflict, this.config.conflictStrategy);
    if (!resolvedData) {
      return false;
    }
    
    // Apply resolution
    conflict.resolved = true;
    // Map config strategy to resolution type
    const resolutionMap: Record<string, 'use_local' | 'use_server' | 'merge' | 'manual'> = {
      'local_wins': 'use_local',
      'server_wins': 'use_server',
      'newest_wins': 'merge',
      'manual': 'manual'
    };
    conflict.resolution = resolutionMap[this.config.conflictStrategy] || 'manual';
    conflict.resolvedAt = new Date();
    conflict.resolvedData = resolvedData;
    
    // Update local data with resolved version
    await this.applyResolvedData(conflict);
    
    return true;
  }
  
  /**
   * Apply resolved conflict data
   */
  private static async applyResolvedData(conflict: SyncConflict): Promise<void> {
    // TODO: Apply to actual storage
    // This would update the appropriate store (logStore, etc.)
    console.log('Applying resolved data:', conflict);
  }
  
  /**
   * Update local metadata
   */
  private static async updateLocalMetadata(
    entityId: string,
    entityType: EntityType,
    version: number
  ): Promise<void> {
    if (!this.syncManifest) {
      await this.loadManifest();
    }
    
    this.syncManifest!.entities.set(entityId, {
      id: entityId,
      entityType,
      version,
      lastModified: new Date(),
      modifiedBy: 'local'
    });
    
    await this.saveManifest();
  }
  
  /**
   * Remove completed operation
   */
  private static async removeOperation(operationId: string): Promise<void> {
    if (!this.syncState) return;
    
    this.syncState.pendingOperations = this.syncState.pendingOperations.filter(
      op => op.id !== operationId
    );
    
    await this.saveState();
  }
  
  /**
   * Handle network state change
   */
  private static async handleNetworkStateChange(isConnected: boolean): Promise<void> {
    if (!this.syncState) {
      await this.loadState();
    }
    
    const wasOnline = this.syncState!.online;
    this.syncState!.online = isConnected;
    
    if (isConnected) {
      this.syncState!.lastOnlineTime = new Date();
      
      // Sync on reconnect if configured
      if (!wasOnline && this.config.syncOnConnect) {
        await this.sync();
      }
    }
    
    await this.saveState();
    this.notifyListeners();
  }
  
  /**
   * Start auto-sync
   */
  private static startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    const intervalMs = this.config.syncInterval * 60 * 1000;
    this.syncTimer = setInterval(() => {
      if (this.syncState?.online) {
        this.sync();
      }
    }, intervalMs);
  }
  
  /**
   * Stop auto-sync
   */
  static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Get sync status
   */
  static getSyncState(): SyncState | null {
    return this.syncState;
  }
  
  /**
   * Get pending operations count
   */
  static getPendingCount(): number {
    return this.syncState?.pendingOperations.length || 0;
  }
  
  /**
   * Get conflicts
   */
  static getConflicts(): SyncConflict[] {
    return this.syncState?.conflicts || [];
  }
  
  /**
   * Manually resolve conflict
   */
  static async resolveConflictManually(
    conflictId: string,
    useLocal: boolean
  ): Promise<void> {
    if (!this.syncState) return;
    
    const conflict = this.syncState.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    conflict.resolved = true;
    conflict.resolution = useLocal ? 'use_local' : 'use_server';
    conflict.resolvedAt = new Date();
    conflict.resolvedData = useLocal
      ? conflict.localVersion.data
      : conflict.serverVersion.data;
      
    await this.applyResolvedData(conflict);
    await this.saveState();
  }
  
  /**
   * Update sync config
   */
  static async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    
    // Restart auto-sync if interval changed
    if (config.autoSync !== undefined || config.syncInterval !== undefined) {
      if (this.config.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }
  
  /**
   * Subscribe to sync state changes
   */
  static subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify listeners
   */
  private static notifyListeners(): void {
    if (this.syncState) {
      this.listeners.forEach(listener => listener(this.syncState!));
    }
  }
  
  /**
   * Storage operations
   */
  private static async loadState(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SYNC_STATE_KEY);
      this.syncState = data
        ? JSON.parse(data)
        : {
            syncInProgress: false,
            pendingOperations: [],
            conflicts: [],
            online: true,
            consecutiveFailures: 0
          };
    } catch (error) {
      console.error('Failed to load sync state:', error);
      this.syncState = {
        syncInProgress: false,
        pendingOperations: [],
        conflicts: [],
        online: true,
        consecutiveFailures: 0
      };
    }
  }
  
  private static async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(this.syncState));
    } catch (error) {
      console.error('Failed to save sync state:', error);
    }
  }
  
  private static async loadManifest(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SYNC_MANIFEST_KEY);
      this.syncManifest = data
        ? JSON.parse(data)
        : { lastUpdated: new Date(), entities: new Map() };
    } catch (error) {
      console.error('Failed to load sync manifest:', error);
      this.syncManifest = { lastUpdated: new Date(), entities: new Map() };
    }
  }
  
  private static async saveManifest(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_MANIFEST_KEY, JSON.stringify(this.syncManifest));
    } catch (error) {
      console.error('Failed to save sync manifest:', error);
    }
  }
  
  private static async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
      this.config = data ? JSON.parse(data) : DEFAULT_SYNC_CONFIG;
    } catch (error) {
      console.error('Failed to load sync config:', error);
      this.config = DEFAULT_SYNC_CONFIG;
    }
  }
  
  private static async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }
  
  private static createEmptyResult(success: boolean, error?: string): SyncResult {
    return {
      success,
      timestamp: new Date(),
      operationsAttempted: 0,
      operationsCompleted: 0,
      operationsFailed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      bytesUploaded: 0,
      bytesDownloaded: 0,
      errors: error ? [{
        operation: null as any,
        error,
        recoverable: false
      }] : []
    };
  }
}
