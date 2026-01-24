// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LogStorage from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const mockLog = { id: 'log1', profileId: 'profile1', logDate: '2026-01-01' };

describe('LogStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a log to AsyncStorage', async () => {
    await LogStorage.saveLog(mockLog);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should retrieve a log from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockLog));
    const log = await LogStorage.getLog('log1');
    expect(log).toBeDefined();
    expect(log?.id).toBe('log1');
  });

  it('should remove a log from AsyncStorage', async () => {
    await LogStorage.deleteLog('log1');
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  // Add more tests for edge cases and validation as needed
});
