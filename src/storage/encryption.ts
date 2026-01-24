/**
 * Encryption Utilities
 * AES-256-CTR with SHA-256 auth tag for integrity (authenticated encryption surrogate)
 *
 * - 256-bit key stored in SecureStore (base64)
 * - 16-byte IV per message
 * - Auth tag = first 16 bytes of SHA-256(keyBase64 + base64(dataForAuth))
 *
 * NOTE: Expo does not expose native AES-GCM; this implementation uses AES-CTR + HMAC-style tag.
 * For true AES-GCM, swap to a native module like `react-native-aes-crypto`.
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as crypto from 'expo-crypto';
import * as aesjs from 'aes-js';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

export interface EncryptionConfig {
  enabled: boolean;
  useDeviceAuth: boolean;
  keyAlias: string;
}

export interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  biometryType?: 'fingerprint' | 'facial' | 'iris' | 'none';
  error?: string;
}

const KEY_VERSION = 'v2';
const KEY_PREFIX = 'ssdi_secure_';
const ENCRYPTION_KEY = 'encryption_key';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const VERSION_BYTE = 2;

const b64Encode = (data: Uint8Array) => {
  return Buffer.from(data).toString('base64');
};

const b64Decode = (b64: string) => {
  return new Uint8Array(Buffer.from(b64, 'base64'));
};

const utf8Encode = (text: string) => {
  return new TextEncoder().encode(text);
};

const utf8Decode = (bytes: Uint8Array) => {
  return new TextDecoder().decode(bytes);
};

export class EncryptionManager {
  private static config: EncryptionConfig = {
    enabled: false,
    useDeviceAuth: false,
    keyAlias: 'ssdi_master_key',
  };

  static async initialize(config: Partial<EncryptionConfig> = {}): Promise<{
    success: boolean;
    capabilities: { secureStoreAvailable: boolean; biometricsAvailable: boolean; biometryType: string };
    error?: string;
  }> {
    try {
      this.config = { ...this.config, ...config };

      const secureStoreAvailable = await SecureStore.isAvailableAsync();
      const biometricsAvailable = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType: AuthResult['biometryType'] = 'none';
      if (enrolled && supported.length) {
        if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) biometryType = 'fingerprint';
        else if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) biometryType = 'facial';
        else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) biometryType = 'iris';
      }

      if (this.config.enabled) {
        const key = await this.getEncryptionKey();
        if (!key.success) {
          return { success: false, capabilities: { secureStoreAvailable, biometricsAvailable: biometricsAvailable && enrolled, biometryType }, error: key.error };
        }
      }

      return {
        success: true,
        capabilities: {
          secureStoreAvailable,
          biometricsAvailable: biometricsAvailable && enrolled,
          biometryType,
        },
      };
    } catch (error) {
      return {
        success: false,
        capabilities: { secureStoreAvailable: false, biometricsAvailable: false, biometryType: 'none' },
        error: error instanceof Error ? error.message : 'Encryption initialization error',
      };
    }
  }

  static updateConfig(newConfig: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  static isEncryptionEnabled(): boolean {
    return this.config.enabled;
  }

  static async authenticateUser(reason?: string): Promise<AuthResult> {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      if (!available) return { success: false, biometryType: 'none', error: 'Device authentication not available' };

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return { success: false, biometryType: 'none', error: 'No authentication methods enrolled' };

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access Daymark',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (!result.success) return { success: false, biometryType: 'none', error: 'Authentication failed' };

      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometryType: AuthResult['biometryType'] = 'none';
      if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) biometryType = 'fingerprint';
      else if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) biometryType = 'facial';
      else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) biometryType = 'iris';

      return { success: true, biometryType };
    } catch (error) {
      return { success: false, biometryType: 'none', error: error instanceof Error ? error.message : 'Authentication error' };
    }
  }

  private static async generateEncryptionKey(): Promise<EncryptionResult> {
    try {
      const keyBytes = await crypto.getRandomBytesAsync(32); // 256-bit
      const keyBase64 = b64Encode(keyBytes);
      await this.storeSecure(ENCRYPTION_KEY, `${KEY_VERSION}:${keyBase64}`, true);
      return { success: true, data: keyBase64 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Key generation error' };
    }
  }

  private static async getEncryptionKey(): Promise<EncryptionResult> {
    try {
      const stored = await this.getSecure(ENCRYPTION_KEY, true);
      if (stored.success && stored.data) {
        const parts = stored.data.split(':');
        const keyBase64 = parts.length > 1 ? parts[1] : parts[0];
        return { success: true, data: keyBase64 };
      }
      return this.generateEncryptionKey();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Key retrieval error' };
    }
  }

  private static async storeSecure(key: string, value: string, requireAuth: boolean): Promise<EncryptionResult> {
    try {
      const secureKey = `${KEY_PREFIX}${key}`;
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.config.useDeviceAuth,
      };
      if (Platform.OS === 'ios') {
        options.keychainService = 'SSIDSymptomTracker';
      }
      await SecureStore.setItemAsync(secureKey, value, options);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Secure storage error' };
    }
  }

  private static async getSecure(key: string, requireAuth: boolean): Promise<EncryptionResult> {
    try {
      const secureKey = `${KEY_PREFIX}${key}`;
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.config.useDeviceAuth,
      };
      const value = await SecureStore.getItemAsync(secureKey, options);
      return { success: true, data: value || undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Secure retrieval error' };
    }
  }

  static async clearAllSecureData(): Promise<EncryptionResult> {
    try {
      await SecureStore.deleteItemAsync(`${KEY_PREFIX}${ENCRYPTION_KEY}`);
      this.config = { enabled: false, useDeviceAuth: false, keyAlias: 'ssdi_master_key' };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Clear secure data error' };
    }
  }

  static async encryptString(plaintext: string): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) return { success: true, data: plaintext };

      const keyResult = await this.getEncryptionKey();
      if (!keyResult.success || !keyResult.data) {
        return { success: false, error: 'Encryption key not available' };
      }

      const keyBytes = b64Decode(keyResult.data);
      const iv = await crypto.getRandomBytesAsync(IV_LENGTH);
      const plaintextBytes = utf8Encode(plaintext);

      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(iv));
      const encryptedBytes = aesCtr.encrypt(plaintextBytes);

      const dataForAuth = new Uint8Array([...iv, ...encryptedBytes]);
      const authHex = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        `${keyResult.data}${b64Encode(dataForAuth)}`
      );
      const authTag = new Uint8Array(AUTH_TAG_LENGTH);
      for (let i = 0; i < AUTH_TAG_LENGTH; i++) {
        authTag[i] = parseInt(authHex.substr(i * 2, 2), 16);
      }

      const combined = new Uint8Array([VERSION_BYTE, ...iv, ...authTag, ...encryptedBytes]);
      const payload = b64Encode(combined);

      return { success: true, data: payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Encryption error' };
    }
  }

  static async decryptString(ciphertext: string): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) return { success: true, data: ciphertext };

      const keyResult = await this.getEncryptionKey();
      if (!keyResult.success || !keyResult.data) {
        return { success: false, error: 'Decryption key not available' };
      }

      const combined = b64Decode(ciphertext);
      const version = combined[0];
      if (version !== VERSION_BYTE) {
        return { success: false, error: 'Unsupported encryption version' };
      }

      const iv = combined.slice(1, 1 + IV_LENGTH);
      const authTag = combined.slice(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
      const encryptedBytes = combined.slice(1 + IV_LENGTH + AUTH_TAG_LENGTH);

      const dataForAuth = new Uint8Array([...iv, ...encryptedBytes]);
      const expectedAuthHex = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        `${keyResult.data}${b64Encode(dataForAuth)}`
      );
      const expectedTag = new Uint8Array(AUTH_TAG_LENGTH);
      for (let i = 0; i < AUTH_TAG_LENGTH; i++) {
        expectedTag[i] = parseInt(expectedAuthHex.substr(i * 2, 2), 16);
      }

      let valid = true;
      for (let i = 0; i < AUTH_TAG_LENGTH; i++) {
        if (authTag[i] !== expectedTag[i]) valid = false;
      }
      if (!valid) {
        return { success: false, error: 'Authentication failed - data may be corrupted' };
      }

      const keyBytes = b64Decode(keyResult.data);
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(iv));
      const decryptedBytes = aesCtr.decrypt(encryptedBytes);
      const plaintext = utf8Decode(decryptedBytes);

      return { success: true, data: plaintext };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Decryption error' };
    }
  }
}
