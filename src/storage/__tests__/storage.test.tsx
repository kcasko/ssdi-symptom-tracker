import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores data with set', async () => {
    const result = await Storage.set('key', { foo: 'bar' });
    expect(result.success).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('retrieves data with get', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));
    const result = await Storage.get('key', {});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ foo: 'bar' });
  });

  it('removes data with remove', async () => {
    const result = await Storage.remove('key');
    expect(result.success).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
