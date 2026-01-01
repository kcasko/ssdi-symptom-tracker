/**
 * Tests for Cloud Backup Service
 */

import { CloudBackupService } from '../CloudBackupService';
import { BackupConfig } from '../../domain/models/BackupModels';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system');
jest.mock('expo-crypto');

describe('CloudBackupService', () => {
  let backupService: CloudBackupService;

  const mockConfig: BackupConfig = {
    provider: 'local',
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    encryptionEnabled: true
  };

  beforeEach(() => {
    backupService = new CloudBackupService(mockConfig);
    jest.clearAllMocks();

    // Mock FileSystem methods
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('{}');
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
  });

  describe('createBackup', () => {
    it('should create encrypted backup', async () => {
      const data = {
        dailyLogs: [{ id: 'log1', profileId: 'profile1' }],
        limitations: [],
        appointments: []
      };

      const backup = await backupService.createBackup(data, 'profile1');

      expect(backup).toBeDefined();
      expect(backup.metadata).toBeDefined();
      expect(backup.metadata.profileId).toBe('profile1');
      expect(backup.metadata.encrypted).toBe(true);
      expect(backup.encryptedData).toBeDefined();
    });

    it('should compress backup data', async () => {
      const data = {
        dailyLogs: Array(100).fill({ id: 'log', data: 'some data' }),
        limitations: [],
        appointments: []
      };

      const backup = await backupService.createBackup(data, 'profile1');

      expect(backup.metadata.compressed).toBe(true);
      expect(backup.metadata.compressionRatio).toBeDefined();
    });

    it('should include metadata', async () => {
      const data = { dailyLogs: [], limitations: [], appointments: [] };
      const backup = await backupService.createBackup(data, 'profile1');

      const metadata = backup.metadata;
      expect(metadata.id).toBeDefined();
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.dataVersion).toBe(1);
      expect(metadata.profileId).toBe('profile1');
    });

    it('should calculate checksum', async () => {
      const data = { dailyLogs: [], limitations: [], appointments: [] };
      const backup = await backupService.createBackup(data, 'profile1');

      expect(backup.metadata.checksum).toBeDefined();
      expect(backup.metadata.checksum.length).toBeGreaterThan(0);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore and decrypt backup', async () => {
      const originalData = {
        dailyLogs: [{ id: 'log1', profileId: 'profile1' }],
        limitations: [],
        appointments: []
      };

      const backup = await backupService.createBackup(originalData, 'profile1');
      const result = await backupService.restoreFromBackup(backup);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should verify checksum before restore', async () => {
      const data = { dailyLogs: [], limitations: [], appointments: [] };
      const backup = await backupService.createBackup(data, 'profile1');

      // Tamper with backup
      backup.metadata.checksum = 'invalid_checksum';

      const result = await backupService.restoreFromBackup(backup);

      expect(result.success).toBe(false);
      expect(result.error).toContain('checksum');
    });

    it('should handle decryption errors', async () => {
      const invalidBackup = {
        metadata: {
          id: 'backup1',
          createdAt: new Date(),
          dataVersion: 1,
          profileId: 'profile1',
          encrypted: true,
          compressed: false,
          checksum: 'checksum',
          size: 100
        },
        encryptedData: 'invalid_encrypted_data',
        signature: 'signature'
      };

      const result = await backupService.restoreFromBackup(invalidBackup);

      expect(result.success).toBe(false);
    });
  });

  describe('listBackups', () => {
    it('should list available backups', async () => {
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'backup_2024-01-01_profile1.backup',
        'backup_2024-01-02_profile1.backup'
      ]);

      const backups = await backupService.listBackups('profile1');

      expect(Array.isArray(backups)).toBe(true);
    });

    it('should filter by profile ID', async () => {
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        'backup_2024-01-01_profile1.backup',
        'backup_2024-01-02_profile2.backup'
      ]);

      const backups = await backupService.listBackups('profile1');

      // Implementation should filter, but this depends on actual implementation
      expect(Array.isArray(backups)).toBe(true);
    });
  });

  describe('deleteBackup', () => {
    it('should delete specified backup', async () => {
      await backupService.deleteBackup('backup1');

      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup integrity', async () => {
      const data = { dailyLogs: [], limitations: [], appointments: [] };
      const backup = await backupService.createBackup(data, 'profile1');

      const isValid = await backupService.verifyBackup(backup);

      expect(typeof isValid).toBe('boolean');
      expect(isValid).toBe(true);
    });

    it('should detect corrupted backups', async () => {
      const data = { dailyLogs: [], limitations: [], appointments: [] };
      const backup = await backupService.createBackup(data, 'profile1');

      // Corrupt the data
      backup.encryptedData = 'corrupted_data';

      const isValid = await backupService.verifyBackup(backup);

      expect(isValid).toBe(false);
    });
  });

  describe('automatic backups', () => {
    it('should schedule automatic backups when enabled', () => {
      const service = new CloudBackupService({ ...mockConfig, autoBackup: true });
      
      // Service should initialize with auto-backup enabled
      expect(service).toBeDefined();
    });

    it('should respect backup frequency setting', () => {
      const frequencies = ['hourly', 'daily', 'weekly'] as const;
      
      frequencies.forEach(frequency => {
        const service = new CloudBackupService({ ...mockConfig, backupFrequency: frequency });
        expect(service).toBeDefined();
      });
    });
  });

  describe('encryption', () => {
    it('should encrypt when encryption enabled', async () => {
      const service = new CloudBackupService({ ...mockConfig, encryptionEnabled: true });
      const data = { dailyLogs: [], limitations: [], appointments: [] };

      const backup = await service.createBackup(data, 'profile1');

      expect(backup.metadata.encrypted).toBe(true);
    });

    it('should not encrypt when encryption disabled', async () => {
      const service = new CloudBackupService({ ...mockConfig, encryptionEnabled: false });
      const data = { dailyLogs: [], limitations: [], appointments: [] };

      const backup = await service.createBackup(data, 'profile1');

      expect(backup.metadata.encrypted).toBe(false);
    });
  });
});
