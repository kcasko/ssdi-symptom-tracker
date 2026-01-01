/**
 * Multi-Device Sync Service
 * 
 * Synchronizes data across multiple devices using cloud storage.
 * Builds on SyncService (offline queue) and CloudBackupService (cloud storage).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  Device,
  DeviceSyncManifest,
  ChangeRecord,
  SyncSession,
  DeviceConflict,
  MultiDeviceSyncConfig,
  SyncStatistics,
  DEFAULT_MULTI_DEVICE_CONFIG,
  generateDeviceId,
  calculateEntityChecksum,
  detectChanges,
  applyChanges,
  mergeEntities
} from '../domain/models/MultiDeviceSync';
import { CloudBackupService } from './CloudBackupService';
import { SyncService } from './SyncService';

const DEVICE_KEY = '@device_info';
const MANIFEST_KEY = '@device_sync_manifest';
const CHANGES_KEY = '@pending_changes';
const CONFIG_KEY = '@multi_device_config';
const SESSIONS_KEY = '@sync_sessions';
const CONFLICTS_KEY = '@device_conflicts';

export class MultiDeviceSyncService {
  private static currentDevice: Device | null = null;
  private static manifest: DeviceSyncManifest | null = null;
  private static pendingChanges: ChangeRecord[] = [];
  private static config: MultiDeviceSyncConfig = DEFAULT_MULTI_DEVICE_CONFIG;
  private static syncTimer: NodeJS.Timeout | null = null;
  private static isSyncing = false;
  
  /**
   * Initialize multi-device sync
   */
  static async initialize(): Promise<void> {
    await this.loadConfig();
    await this.loadOrCreateDevice();
    await this.loadManifest();
    await this.loadPendingChanges();
    
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }
  
  /**
   * Get current device info
   */
  static getCurrentDevice(): Device | null {
    return this.currentDevice;
  }
  
  /**
   * Get all registered devices
   */
  static async getRegisteredDevices(): Promise<Device[]> {
    // TODO: Fetch from cloud storage
    // For now, return current device
    return this.currentDevice ? [this.currentDevice] : [];
  }
  
  /**
   * Record a change for syncing
   */
  static async recordChange(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    previousData?: any
  ): Promise<void> {
    if (!this.currentDevice) {
      console.warn('No device registered, cannot record change');
      return;
    }
    
    const previousChecksum = previousData
      ? await calculateEntityChecksum(previousData)
      : undefined;
    const newChecksum = await calculateEntityChecksum(data);
    
    const changes = previousData
      ? detectChanges(previousData, data)
      : data;
    
    const changeRecord: ChangeRecord = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      deviceId: this.currentDevice.id,
      entityType,
      entityId,
      operation,
      changes: this.config.useDeltaSync ? changes : data,
      previousChecksum,
      newChecksum,
      version: await this.getNextVersion(entityId),
      parentVersion: await this.getCurrentVersion(entityId)
    };
    
    this.pendingChanges.push(changeRecord);
    await this.savePendingChanges();
    
    // Update local manifest
    if (this.manifest) {
      this.manifest.entityChecksums.set(entityId, newChecksum);
      this.manifest.versionVectors.set(entityId, changeRecord.version);
      this.manifest.lastUpdated = new Date();
      await this.saveManifest();
    }
    
    // Trigger sync if auto-sync enabled
    if (this.config.autoSync && !this.isSyncing) {
      await this.sync();
    }
  }
  
  /**
   * Perform multi-device sync
   */
  static async sync(): Promise<SyncSession> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }
    
    if (!this.currentDevice) {
      throw new Error('No device registered');
    }
    
    this.isSyncing = true;
    
    const session: SyncSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      deviceId: this.currentDevice.id,
      changesPushed: 0,
      changesPulled: 0,
      conflictsResolved: 0,
      bytesUploaded: 0,
      bytesDownloaded: 0,
      status: 'in_progress'
    };
    
    try {
      // Step 1: Push local changes to cloud
      const pushResult = await this.pushChanges();
      session.changesPushed = pushResult.count;
      session.bytesUploaded = pushResult.bytes;
      
      // Step 2: Pull changes from other devices
      const pullResult = await this.pullChanges();
      session.changesPulled = pullResult.count;
      session.bytesDownloaded = pullResult.bytes;
      session.conflictsResolved = pullResult.conflictsResolved;
      
      // Step 3: Update device last sync time
      this.currentDevice.lastSyncTime = new Date();
      await this.saveDevice();
      
      session.status = 'completed';
      session.endTime = new Date();
      
    } catch (error) {
      session.status = 'failed';
      session.error = String(error);
      session.endTime = new Date();
      throw error;
    } finally {
      this.isSyncing = false;
      await this.saveSession(session);
    }
    
    return session;
  }
  
  /**
   * Push local changes to cloud
   */
  private static async pushChanges(): Promise<{ count: number; bytes: number }> {
    if (this.pendingChanges.length === 0) {
      return { count: 0, bytes: 0 };
    }
    
    // Batch changes
    const batches = this.batchChanges(this.pendingChanges, this.config.maxChangesPerBatch);
    let totalBytes = 0;
    let totalCount = 0;
    
    for (const batch of batches) {
      const data = JSON.stringify(batch);
      totalBytes += data.length;
      
      // Upload to cloud storage
      // TODO: Implement cloud storage for changes
      // For now, just mark as pushed
      totalCount += batch.length;
    }
    
    // Clear pending changes after successful push
    this.pendingChanges = [];
    await this.savePendingChanges();
    
    return { count: totalCount, bytes: totalBytes };
  }
  
  /**
   * Pull changes from other devices
   */
  private static async pullChanges(): Promise<{
    count: number;
    bytes: number;
    conflictsResolved: number;
  }> {
    // TODO: Implement cloud storage fetch
    // For now, return empty result
    return { count: 0, bytes: 0, conflictsResolved: 0 };
  }
  
  /**
   * Resolve conflicts between devices
   */
  static async resolveConflict(
    conflictId: string,
    resolution: 'use_device' | 'merge' | 'manual',
    selectedDeviceId?: string,
    manualData?: any
  ): Promise<void> {
    const conflicts = await this.loadConflicts();
    const conflict = conflicts.find(c => c.id === conflictId);
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    let resolvedData: any;
    
    switch (resolution) {
      case 'use_device':
        if (!selectedDeviceId) {
          throw new Error('Device ID required for use_device resolution');
        }
        const selectedVersion = conflict.versions.find(v => v.deviceId === selectedDeviceId);
        if (!selectedVersion) {
          throw new Error('Selected device version not found');
        }
        resolvedData = selectedVersion.data;
        break;
        
      case 'merge':
        resolvedData = mergeEntities(conflict.versions.map(v => v.data));
        break;
        
      case 'manual':
        if (!manualData) {
          throw new Error('Manual data required for manual resolution');
        }
        resolvedData = manualData;
        break;
    }
    
    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.selectedDeviceId = selectedDeviceId;
    conflict.resolvedData = resolvedData;
    conflict.resolvedAt = new Date();
    
    await this.saveConflicts(conflicts);
    
    // Apply resolved data to local storage
    await this.applyResolvedConflict(conflict);
  }
  
  /**
   * Apply resolved conflict to local data
   */
  private static async applyResolvedConflict(conflict: DeviceConflict): Promise<void> {
    // TODO: Apply to appropriate storage (logStore, etc.)
    console.log('Applying resolved conflict:', conflict);
  }
  
  /**
   * Get sync statistics
   */
  static async getStatistics(): Promise<SyncStatistics> {
    const sessions = await this.loadSessions();
    const devices = await this.getRegisteredDevices();
    const conflicts = await this.loadConflicts();
    
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()),
      0
    );
    
    return {
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.active).length,
      totalSyncSessions: sessions.length,
      lastSyncTime: this.currentDevice?.lastSyncTime,
      totalChangesPushed: sessions.reduce((sum, s) => sum + s.changesPushed, 0),
      totalChangesPulled: sessions.reduce((sum, s) => sum + s.changesPulled, 0),
      totalConflicts: conflicts.length,
      totalConflictsResolved: conflicts.filter(c => c.resolved).length,
      averageSyncDurationMs: completedSessions.length > 0
        ? totalDuration / completedSessions.length
        : 0,
      totalDataSynced: sessions.reduce(
        (sum, s) => sum + s.bytesUploaded + s.bytesDownloaded,
        0
      )
    };
  }
  
  /**
   * Update configuration
   */
  static async updateConfig(config: Partial<MultiDeviceSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    
    // Restart auto-sync if settings changed
    if (config.autoSync !== undefined || config.syncIntervalMinutes !== undefined) {
      this.stopAutoSync();
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    }
  }
  
  /**
   * Unregister current device
   */
  static async unregisterDevice(): Promise<void> {
    if (!this.currentDevice) return;
    
    this.currentDevice.active = false;
    await this.saveDevice();
    
    // TODO: Notify cloud that device is inactive
    
    this.stopAutoSync();
  }
  
  /**
   * Internal: Start auto-sync
   */
  private static startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    const intervalMs = this.config.syncIntervalMinutes * 60 * 1000;
    this.syncTimer = setInterval(() => {
      if (!this.isSyncing) {
        this.sync().catch(console.error);
      }
    }, intervalMs);
  }
  
  /**
   * Internal: Stop auto-sync
   */
  private static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Internal: Batch changes
   */
  private static batchChanges(
    changes: ChangeRecord[],
    batchSize: number
  ): ChangeRecord[][] {
    const batches: ChangeRecord[][] = [];
    for (let i = 0; i < changes.length; i += batchSize) {
      batches.push(changes.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Internal: Get next version for entity
   */
  private static async getNextVersion(entityId: string): Promise<number> {
    const current = await this.getCurrentVersion(entityId);
    return current + 1;
  }
  
  /**
   * Internal: Get current version for entity
   */
  private static async getCurrentVersion(entityId: string): Promise<number> {
    if (!this.manifest) return 0;
    return this.manifest.versionVectors.get(entityId) || 0;
  }
  
  /**
   * Storage operations
   */
  private static async loadOrCreateDevice(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(DEVICE_KEY);
      if (data) {
        this.currentDevice = JSON.parse(data);
      } else if (this.config.autoRegisterDevice) {
        this.currentDevice = {
          id: generateDeviceId(),
          name: this.config.deviceName,
          platform: 'ios', // TODO: Detect actual platform
          registeredAt: new Date(),
          active: true
        };
        await this.saveDevice();
      }
    } catch (error) {
      console.error('Failed to load device:', error);
    }
  }
  
  private static async saveDevice(): Promise<void> {
    try {
      if (this.currentDevice) {
        await AsyncStorage.setItem(DEVICE_KEY, JSON.stringify(this.currentDevice));
      }
    } catch (error) {
      console.error('Failed to save device:', error);
    }
  }
  
  private static async loadManifest(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(MANIFEST_KEY);
      this.manifest = data
        ? JSON.parse(data)
        : {
            deviceId: this.currentDevice?.id || '',
            lastUpdated: new Date(),
            entityChecksums: new Map(),
            versionVectors: new Map()
          };
    } catch (error) {
      console.error('Failed to load manifest:', error);
      this.manifest = {
        deviceId: this.currentDevice?.id || '',
        lastUpdated: new Date(),
        entityChecksums: new Map(),
        versionVectors: new Map()
      };
    }
  }
  
  private static async saveManifest(): Promise<void> {
    try {
      await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(this.manifest));
    } catch (error) {
      console.error('Failed to save manifest:', error);
    }
  }
  
  private static async loadPendingChanges(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CHANGES_KEY);
      this.pendingChanges = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load pending changes:', error);
      this.pendingChanges = [];
    }
  }
  
  private static async savePendingChanges(): Promise<void> {
    try {
      await AsyncStorage.setItem(CHANGES_KEY, JSON.stringify(this.pendingChanges));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  }
  
  private static async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CONFIG_KEY);
      this.config = data ? JSON.parse(data) : DEFAULT_MULTI_DEVICE_CONFIG;
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = DEFAULT_MULTI_DEVICE_CONFIG;
    }
  }
  
  private static async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  private static async loadSessions(): Promise<SyncSession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }
  
  private static async saveSession(session: SyncSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      sessions.unshift(session);
      
      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(100);
      }
      
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }
  
  private static async loadConflicts(): Promise<DeviceConflict[]> {
    try {
      const data = await AsyncStorage.getItem(CONFLICTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load conflicts:', error);
      return [];
    }
  }
  
  private static async saveConflicts(conflicts: DeviceConflict[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to save conflicts:', error);
    }
  }
}
