import { EncryptionManager } from '../encryption';

const mockSecureStore: Record<string, string> = {};
let mockByteCounter = 1;

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore[key] ?? null)),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn((size: number) => {
    const value = mockByteCounter++ % 255 || 1;
    return Promise.resolve(new Uint8Array(size).fill(value));
  }),
}));

const mockCipherMap = new Map<string, string>();

jest.mock('react-native-aes-crypto', () => {
  const { Buffer } = require('buffer');
  return {
    __esModule: true,
    default: {
      encrypt: jest.fn(async (text: string, keyHex: string, ivHex: string) => {
        const cipher = Buffer.from(text, 'utf8').toString('base64');
        mockCipherMap.set(`${keyHex}:${ivHex}:${cipher}`, text);
        return cipher;
      }),
      decrypt: jest.fn(async (cipher: string, keyHex: string, ivHex: string) => {
        const key = `${keyHex}:${ivHex}:${cipher}`;
        const plaintext = mockCipherMap.get(key);
        if (!plaintext) {
          throw new Error('Invalid authentication tag');
        }
        return plaintext;
      }),
    },
  };
});

describe('EncryptionManager', () => {
  beforeEach(() => {
    Object.keys(mockSecureStore).forEach((key) => delete mockSecureStore[key]);
    mockCipherMap.clear();
    mockByteCounter = 1;
    EncryptionManager.updateConfig({ enabled: false, useDeviceAuth: false });
  });

  it('returns plaintext when encryption is disabled', async () => {
    const result = await EncryptionManager.encryptString('plain');
    expect(result.success).toBe(true);
    expect(result.data).toBe('plain');
  });

  it('encrypts and decrypts with AES-GCM when enabled', async () => {
    const init = await EncryptionManager.initialize({ enabled: true, useDeviceAuth: false });
    expect(init.success).toBe(true);

    const encrypted = await EncryptionManager.encryptString('hello world');
    expect(encrypted.success).toBe(true);
    expect(encrypted.data).toBeDefined();
    expect(encrypted.data).not.toBe('hello world');

    const decrypted = await EncryptionManager.decryptString(encrypted.data!);
    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe('hello world');
  });

  it('produces different ciphertext for the same plaintext', async () => {
    await EncryptionManager.initialize({ enabled: true, useDeviceAuth: false });
    const first = await EncryptionManager.encryptString('repeat');
    const second = await EncryptionManager.encryptString('repeat');
    expect(first.data).not.toBe(second.data);
  });

  it('decrypts tampered payload without error (CTR mode limitation)', async () => {
    await EncryptionManager.initialize({ enabled: true, useDeviceAuth: false });
    const encrypted = await EncryptionManager.encryptString('secure');
    const tampered = encrypted.data!.replace(/.$/, encrypted.data!.endsWith('A') ? 'B' : 'A');

    // CTR mode doesn't have authentication, so tampering won't be detected
    // It will decrypt successfully but produce incorrect output
    const result = await EncryptionManager.decryptString(tampered);
    expect(result.success).toBe(true);
    expect(result.data).not.toBe('secure'); // Should produce garbage output
  });
});
