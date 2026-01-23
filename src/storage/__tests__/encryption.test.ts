/**
 * Encryption Tests
 * Tests for AES-256-GCM encryption implementation
 */

import { EncryptionManager } from '../encryption';

// Mock expo modules
jest.mock('expo-crypto', () => {
  let counter = 1;

  return {
    getRandomBytesAsync: jest.fn((size: number) => {
      // Return varying bytes to simulate unique IV/salt per call
      const value = counter++ % 256 || 1;
      return Promise.resolve(new Uint8Array(size).fill(value));
    }),
    digestStringAsync: jest.fn((_algorithm: string, data: string) => {
      // Deterministic hash for test verification
      const hash = require('crypto').createHash('sha256').update(data).digest('hex');
      return Promise.resolve(hash);
    }),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256',
    },
  };
});

jest.mock('expo-secure-store', () => {
  let storage: Record<string, string> = {};

  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => {
      return Promise.resolve(storage[key] || null);
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete storage[key];
      return Promise.resolve();
    }),
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])), // FINGERPRINT
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

describe('EncryptionManager', () => {
  beforeEach(async () => {
    // Clear secure store
    await EncryptionManager.clearSecureData();
  });

  describe('Initialization', () => {
    it('should initialize with encryption disabled', async () => {
      const result = await EncryptionManager.initialize({
        enabled: false,
        useDeviceAuth: false,
        keyAlias: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.capabilities).toBeDefined();
      expect(result.capabilities.biometricsAvailable).toBe(true);
      expect(result.capabilities.secureStoreAvailable).toBe(true);
    });

    it('should initialize with encryption enabled and generate key', async () => {
      const result = await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: false,
        keyAlias: 'test',
      });

      expect(result.success).toBe(true);
      expect(EncryptionManager.isEnabled()).toBe(true);
    });

    it('should check biometric capabilities', async () => {
      const result = await EncryptionManager.isBiometricAvailable();

      expect(result.success).toBe(true);
      expect(result.biometryType).toBe('fingerprint');
    });
  });

  describe('Encryption/Decryption', () => {
    beforeEach(async () => {
      await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: false,
        keyAlias: 'test',
      });
    });

    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'Hello, World!';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBeDefined();
      expect(encryptResult.data).not.toBe(plaintext);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plaintext);
    });

    it('should encrypt and decrypt complex medical data', async () => {
      const medicalData = JSON.stringify({
        date: '2026-01-23',
        symptoms: ['headache', 'fatigue', 'dizziness'],
        severity: 7,
        notes: 'Experiencing severe symptoms after activity',
        medications: ['aspirin', 'ibuprofen'],
      });

      const encryptResult = await EncryptionManager.encryptString(medicalData);
      expect(encryptResult.success).toBe(true);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(medicalData);

      // Verify data integrity
      const parsed = JSON.parse(decryptResult.data!);
      expect(parsed.severity).toBe(7);
      expect(parsed.symptoms).toHaveLength(3);
    });

    it('should encrypt unicode and special characters', async () => {
      const plaintext = '日本語 Ñoño émojis 🔒🔐 symbols: !@#$%^&*()';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plaintext);
    });

    it('should encrypt empty string', async () => {
      const plaintext = '';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plaintext);
    });

    it('should encrypt large text (10KB)', async () => {
      const plaintext = 'A'.repeat(10000);

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plaintext);
      expect(decryptResult.data!.length).toBe(10000);
    });

    it('should return plaintext when encryption is disabled', async () => {
      await EncryptionManager.initialize({
        enabled: false,
        useDeviceAuth: false,
        keyAlias: 'test',
      });

      const plaintext = 'Not encrypted';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBe(plaintext);

      const decryptResult = await EncryptionManager.decryptString(encryptResult.data!);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(plaintext);
    });
  });

  describe('Authentication Tag Verification', () => {
    beforeEach(async () => {
      await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: false,
        keyAlias: 'test',
      });
    });

    it('should detect tampered ciphertext', async () => {
      const plaintext = 'Secret medical data';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      expect(encryptResult.success).toBe(true);

      // Tamper with the ciphertext
      const tamperedData = encryptResult.data!.slice(0, -5) + 'AAAAA';

      const decryptResult = await EncryptionManager.decryptString(tamperedData);
      // Should fail authentication
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.error).toContain('Authentication failed');
    });

    it('should detect corrupted data', async () => {
      const corruptedData = 'InvalidBase64Data!!!';

      const decryptResult = await EncryptionManager.decryptString(corruptedData);
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.error).toBeDefined();
    });
  });

  describe('Round-trip Encryption', () => {
    beforeEach(async () => {
      await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: false,
        keyAlias: 'test',
      });
    });

    it('should handle multiple encrypt/decrypt cycles', async () => {
      const plaintext = 'Persistent medical record';

      // Encrypt 3 times
      const encrypt1 = await EncryptionManager.encryptString(plaintext);
      const encrypt2 = await EncryptionManager.encryptString(plaintext);
      const encrypt3 = await EncryptionManager.encryptString(plaintext);

      // All should succeed but produce different ciphertexts (random IVs)
      expect(encrypt1.success).toBe(true);
      expect(encrypt2.success).toBe(true);
      expect(encrypt3.success).toBe(true);
      expect(encrypt1.data).not.toBe(encrypt2.data);
      expect(encrypt2.data).not.toBe(encrypt3.data);

      // All should decrypt to same plaintext
      const decrypt1 = await EncryptionManager.decryptString(encrypt1.data!);
      const decrypt2 = await EncryptionManager.decryptString(encrypt2.data!);
      const decrypt3 = await EncryptionManager.decryptString(encrypt3.data!);

      expect(decrypt1.data).toBe(plaintext);
      expect(decrypt2.data).toBe(plaintext);
      expect(decrypt3.data).toBe(plaintext);
    });

    it('should handle repeated encryption of same data', async () => {
      const testData = [
        'Symptom log entry 1',
        'Symptom log entry 2',
        'Symptom log entry 3',
      ];

      for (const data of testData) {
        const encrypted = await EncryptionManager.encryptString(data);
        expect(encrypted.success).toBe(true);

        const decrypted = await EncryptionManager.decryptString(encrypted.data!);
        expect(decrypted.success).toBe(true);
        expect(decrypted.data).toBe(data);
      }
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      await EncryptionManager.initialize({
        enabled: false,
        useDeviceAuth: false,
        keyAlias: 'test',
      });

      expect(EncryptionManager.isEnabled()).toBe(false);

      EncryptionManager.updateConfig({ enabled: true });

      expect(EncryptionManager.isEnabled()).toBe(true);
    });

    it('should get current configuration', async () => {
      await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: true,
        keyAlias: 'production',
      });

      const config = EncryptionManager.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.useDeviceAuth).toBe(true);
      expect(config.keyAlias).toBe('production');
    });
  });

  describe('Security Properties', () => {
    beforeEach(async () => {
      await EncryptionManager.initialize({
        enabled: true,
        useDeviceAuth: false,
        keyAlias: 'test',
      });
    });

    it('should produce different ciphertexts for same plaintext (IV randomness)', async () => {
      const plaintext = 'Same medical data';

      const encrypt1 = await EncryptionManager.encryptString(plaintext);
      const encrypt2 = await EncryptionManager.encryptString(plaintext);

      expect(encrypt1.data).not.toBe(encrypt2.data);
    });

    it('should include version byte in ciphertext', async () => {
      const plaintext = 'Versioned data';

      const encryptResult = await EncryptionManager.encryptString(plaintext);
      const cipherBytes = Uint8Array.from(atob(encryptResult.data!), c => c.charCodeAt(0));

      // First byte should be version 2
      expect(cipherBytes[0]).toBe(2);
    });

    it('should maintain data integrity across encryption boundaries', async () => {
      // Test that no data is lost or corrupted at byte boundaries
      const testCases = [
        '\x00\x01\x02\x03', // Low bytes
        '\xFD\xFE\xFF',     // High bytes
        'Mixed\x00\xFF\x01text', // Mixed
      ];

      for (const testCase of testCases) {
        const encrypted = await EncryptionManager.encryptString(testCase);
        const decrypted = await EncryptionManager.decryptString(encrypted.data!);

        expect(decrypted.success).toBe(true);
        expect(decrypted.data).toBe(testCase);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption without initialization', async () => {
      await EncryptionManager.clearSecureData();

      const result = await EncryptionManager.encryptString('test');

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle decryption without initialization', async () => {
      await EncryptionManager.clearSecureData();

      const result = await EncryptionManager.decryptString('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
