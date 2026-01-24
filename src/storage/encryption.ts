/**
 * Encryption Utilities
 * AES-256-GCM via react-native-aes-crypto
 *
 * Payload format (string):
 *   v2:<base64IV>:<base64CiphertextWithTag>
 *
 * Keys are 256-bit, stored in SecureStore (base64).
 */

import { Buffer } from 'buffer';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as crypto from 'expo-crypto';
import AES from 'react-native-aes-crypto';

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
const IV_LENGTH = 12; // 96-bit IV for GCM
const VERSION_TAG = 'v2';

const b64Encode = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const b64Decode = (b64: string) => new Uint8Array(Buffer.from(b64, 'base64'));

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
        const keyResult = await this.getEncryptionKey();
        if (!keyResult.success) {
          return { success: false, capabilities: { secureStoreAvailable, biometricsAvailable: biometricsAvailable && enrolled, biometryType }, error: keyResult.error };
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
      const keyBytes = await crypto.getRandomBytesAsync(32);
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

      const keyHex = Buffer.from(b64Decode(keyResult.data)).toString('hex');
      const iv = await crypto.getRandomBytesAsync(IV_LENGTH);
      const ivHex = Buffer.from(iv).toString('hex');

      const cipherBase64 = await AES.encrypt(plaintext, keyHex, ivHex, 'aes-256-gcm');
      const payload = `${VERSION_TAG}:${b64Encode(iv)}:${cipherBase64}`;

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

      const parts = ciphertext.split(':');
      if (parts.length !== 3 || parts[0] !== VERSION_TAG) {
        return { success: false, error: 'Unsupported encryption format' };
      }
      const ivB64 = parts[1];
      const cipherBase64 = parts[2];

      const keyHex = Buffer.from(b64Decode(keyResult.data)).toString('hex');
      const ivHex = Buffer.from(b64Decode(ivB64)).toString('hex');

      const plaintext = await AES.decrypt(cipherBase64, keyHex, ivHex, 'aes-256-gcm');
      return { success: true, data: plaintext };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Decryption error' };
    }
  }
}
