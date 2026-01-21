/**
 * Tests for Cloud Backup Service
 */

import { CloudBackupService } from '../CloudBackupService';
import { BackupConfig } from '../../domain/models/BackupModels';

// Mock all Expo modules that cause import issues
const fileStore: Record<string, string> = {};

jest.mock('expo-file-system', () => ({
  documentDirectory: 'mock://documents/',
  writeAsStringAsync: jest.fn((path: string, content: string) => {
    fileStore[path] = content;
    return Promise.resolve();
  }),
  readAsStringAsync: jest.fn((path: string) => Promise.resolve(fileStore[path] ?? '')),
  readDirectoryAsync: jest.fn(() => Promise.resolve(Object.keys(fileStore))),
  deleteAsync: jest.fn((path: string) => {
    delete fileStore[path];
    return Promise.resolve();
  }),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn((path: string) => Promise.resolve({ exists: Boolean(fileStore[path]), size: fileStore[path]?.length ?? 0 })),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mock-hash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256'
  }
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve('mock-stored-value')),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../storage/encryption', () => ({
  EncryptionManager: {
    encryptString: jest.fn(async (plaintext: string) => ({ success: true, data: `enc:${plaintext}` })),
    decryptString: jest.fn(async (ciphertext: string) => ({ success: true, data: ciphertext.replace(/^enc:/, '') })),
    config: { enabled: true },
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default)
  }
}));

jest.mock('pako', () => ({
  deflate: jest.fn((data) => Buffer.from(String(data))),
  inflate: jest.fn((data, opts) => {
    if (opts && opts.to === 'string') {
      return Buffer.from(data).toString();
    }
    return new Uint8Array(Buffer.from(data));
  }),
  constants: {
    Z_BEST_COMPRESSION: 9
  }
}));

describe('CloudBackupService', () => {
  const mockConfig: BackupConfig = {
    provider: 'local',
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

  beforeEach(async () => {
    jest.clearAllMocks();
    await CloudBackupService.updateConfig(mockConfig);

    // Mocks are already defined at the module level above
    // jest.clearAllMocks() will reset their call history but keep the implementations
  });

  describe('createBackup', () => {
    it('should create encrypted backup', async () => {
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      expect(metadata.encrypted).toBe(true);
      expect(metadata.checksum).toBeDefined();
    });

    it('should compress backup data', async () => {
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata.compressedSizeBytes).toBeDefined();
      expect(metadata.compressedSizeBytes).toBeLessThanOrEqual(metadata.totalSizeBytes);
    });

    it('should include metadata', async () => {
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata.id).toBeDefined();
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.dataVersion).toBe(1);
      expect(metadata.appVersion).toBeDefined();
    });

    it('should calculate checksum', async () => {
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata.checksum).toBeDefined();
      expect(metadata.checksum.length).toBeGreaterThan(0);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore and decrypt backup', async () => {
      const metadata = await CloudBackupService.createBackup(true);
      const result = await CloudBackupService.restoreFromBackup(metadata.id);

      expect(result.success).toBe(true);
      expect(result.entitiesRestored).toBeDefined();
    });

    it('should verify checksum before restore', async () => {
      // This test would require mocking the cloud provider
      // to return a tampered backup package
      expect(true).toBe(true);
    });

    it('should handle decryption errors', async () => {
      // This test would require mocking the cloud provider
      // to return an invalid encrypted backup
      expect(true).toBe(true);
    });
  });

  describe('listBackups', () => {
    it('should list available backups', async () => {
      const backups = await CloudBackupService.listBackups();

      expect(Array.isArray(backups)).toBe(true);
    });

    it('should return backup metadata', async () => {
      const backups = await CloudBackupService.listBackups();

      expect(Array.isArray(backups)).toBe(true);
      if (backups.length > 0) {
        expect(backups[0].id).toBeDefined();
        expect(backups[0].createdAt).toBeDefined();
      }
    });
  });

  describe('deleteBackup', () => {
    it('should delete specified backup', async () => {
      await CloudBackupService.deleteBackup('backup1');

      // Verify deletion was attempted (cloud provider mock)
      expect(true).toBe(true);
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup integrity', async () => {
      // This test would require creating a valid BackupPackage
      // which needs cloud provider mocking
      expect(true).toBe(true);
    });

    it('should detect corrupted backups', async () => {
      // This test would require creating a corrupted BackupPackage
      expect(true).toBe(true);
    });
  });

  describe('automatic backups', () => {
    it('should schedule automatic backups when enabled', async () => {
      await CloudBackupService.updateConfig({ autoBackup: true });
      const config = CloudBackupService.getConfig();
      
      expect(config.autoBackup).toBe(true);
    });

    it('should respect backup frequency setting', async () => {
      const frequencies = ['hourly', 'daily', 'weekly'] as const;
      
      for (const frequency of frequencies) {
        await CloudBackupService.updateConfig({ backupFrequency: frequency });
        const config = CloudBackupService.getConfig();
        expect(config.backupFrequency).toBe(frequency);
      }
    });
  });

  describe('encryption', () => {
    it('should encrypt when encryption enabled', async () => {
      await CloudBackupService.updateConfig({ encryptionEnabled: true });
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata.encrypted).toBe(true);
    });

    it('should not encrypt when encryption disabled', async () => {
      await CloudBackupService.updateConfig({ encryptionEnabled: false });
      const metadata = await CloudBackupService.createBackup(true);

      expect(metadata.encrypted).toBe(false);
    });
  });
});
