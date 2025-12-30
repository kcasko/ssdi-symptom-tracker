/**
 * Encryption Utilities
 * Optional encryption layer for sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

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

/**
 * Encryption Manager
 * Handles secure storage and device authentication
 */
export class EncryptionManager {
  private static readonly KEY_PREFIX = 'ssdi_secure_';
  private static readonly ENCRYPTION_KEY = 'encryption_key';
  private static config: EncryptionConfig = {
    enabled: false,
    useDeviceAuth: false,
    keyAlias: 'ssdi_master_key',
  };

  /**
   * Initialize encryption system
   */
  static async initialize(config: Partial<EncryptionConfig> = {}): Promise<{
    success: boolean;
    capabilities: {
      secureStoreAvailable: boolean;
      biometricsAvailable: boolean;
      biometryType: string;
    };
    error?: string;
  }> {
    try {
      this.config = { ...this.config, ...config };

      // Check device capabilities
      const secureStoreAvailable = await SecureStore.isAvailableAsync();
      const biometricsAvailable = await LocalAuthentication.hasHardwareAsync();
      const enrolledBiometrics = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType = 'none';
      if (enrolledBiometrics && supportedTypes.length > 0) {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'facial';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometryType = 'iris';
        }
      }

      return {
        success: true,
        capabilities: {
          secureStoreAvailable,
          biometricsAvailable: biometricsAvailable && enrolledBiometrics,
          biometryType,
        },
      };
    } catch (error) {
      return {
        success: false,
        capabilities: {
          secureStoreAvailable: false,
          biometricsAvailable: false,
          biometryType: 'none',
        },
        error: error instanceof Error ? error.message : 'Encryption initialization error',
      };
    }
  }

  /**
   * Check if encryption is available and configured
   */
  static isEncryptionEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Authenticate user with device biometrics or passcode
   */
  static async authenticateUser(reason?: string): Promise<AuthResult> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Device authentication not available',
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          success: false,
          error: 'No authentication methods enrolled',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access SSDI Symptom Tracker',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        let biometryType: AuthResult['biometryType'] = 'none';
        
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'facial';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometryType = 'iris';
        }

        return {
          success: true,
          biometryType,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  }

  /**
   * Store sensitive data securely
   */
  static async storeSecure(key: string, value: string, requireAuth: boolean = true): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          error: 'Encryption not enabled',
        };
      }

      const secureKey = `${this.KEY_PREFIX}${key}`;
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.config.useDeviceAuth,
      };

      // On iOS, we can use keychain access groups if needed
      if (Platform.OS === 'ios') {
        options.keychainService = 'SSIDSymptomTracker';
      }

      await SecureStore.setItemAsync(secureKey, value, options);

      return { success: true, data: value };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure storage error',
      };
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static async getSecure(key: string, requireAuth: boolean = true): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          error: 'Encryption not enabled',
        };
      }

      const secureKey = `${this.KEY_PREFIX}${key}`;
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.config.useDeviceAuth,
      };

      const value = await SecureStore.getItemAsync(secureKey, options);

      return {
        success: true,
        data: value || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure retrieval error',
      };
    }
  }

  /**
   * Remove sensitive data
   */
  static async removeSecure(key: string): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) {
        return { success: true }; // No-op if encryption not enabled
      }

      const secureKey = `${this.KEY_PREFIX}${key}`;
      await SecureStore.deleteItemAsync(secureKey);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure deletion error',
      };
    }
  }

  /**
   * Generate and store encryption key
   */
  static async generateEncryptionKey(): Promise<EncryptionResult> {
    try {
      // Generate a random key (in production, use proper crypto libraries)
      const key = Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');

      const result = await this.storeSecure(this.ENCRYPTION_KEY, key, true);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key generation error',
      };
    }
  }

  /**
   * Get or create encryption key
   */
  static async getEncryptionKey(): Promise<EncryptionResult> {
    try {
      // Try to get existing key
      let result = await this.getSecure(this.ENCRYPTION_KEY, true);
      
      if (result.success && result.data) {
        return result;
      }

      // Generate new key if none exists
      return await this.generateEncryptionKey();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key retrieval error',
      };
    }
  }

  /**
   * Simple string encryption (placeholder - use proper crypto in production)
   * This is a basic implementation for demonstration
   */
  static async encryptString(plaintext: string): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) {
        return { success: true, data: plaintext };
      }

      const keyResult = await this.getEncryptionKey();
      if (!keyResult.success || !keyResult.data) {
        return {
          success: false,
          error: 'Encryption key not available',
        };
      }

      // Simple XOR encryption (use AES in production)
      const key = keyResult.data;
      let encrypted = '';
      for (let i = 0; i < plaintext.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const textChar = plaintext.charCodeAt(i);
        encrypted += String.fromCharCode(textChar ^ keyChar);
      }

      // Base64 encode the result
      const base64 = btoa(encrypted);
      
      return { success: true, data: base64 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption error',
      };
    }
  }

  /**
   * Simple string decryption (placeholder - use proper crypto in production)
   */
  static async decryptString(ciphertext: string): Promise<EncryptionResult> {
    try {
      if (!this.config.enabled) {
        return { success: true, data: ciphertext };
      }

      const keyResult = await this.getEncryptionKey();
      if (!keyResult.success || !keyResult.data) {
        return {
          success: false,
          error: 'Encryption key not available',
        };
      }

      // Decode base64
      const encrypted = atob(ciphertext);
      const key = keyResult.data;
      
      // Simple XOR decryption
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }

      return { success: true, data: decrypted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption error',
      };
    }
  }

  /**
   * Clear all secure data
   */
  static async clearAllSecureData(): Promise<EncryptionResult> {
    try {
      // Note: SecureStore doesn't provide a way to list all keys,
      // so we'll need to track them or clear known keys
      await this.removeSecure(this.ENCRYPTION_KEY);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear secure data error',
      };
    }
  }

  /**
   * Update encryption configuration
   */
  static updateConfig(newConfig: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  static getConfig(): EncryptionConfig {
    return { ...this.config };
  }
}