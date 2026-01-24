// @ts-nocheck
import { renderHook, act } from '@testing-library/react-hooks';
import { useAppState } from '../useAppState';

// Mock initial state for deterministic, auditable tests
const initialState = {
  logs: [],
  profiles: [],
  settings: { theme: 'light', notificationsEnabled: true },
  evidenceMode: false,
};

describe('useAppState (Zustand store)', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.logs).toBeDefined();
    expect(Array.isArray(result.current.logs)).toBe(true);
    expect(result.current.settings).toBeDefined();
  });

  it('should allow updating logs', () => {
    const { result } = renderHook(() => useAppState());
    act(() => {
      result.current.addLog({ id: 'log1', profileId: 'profile1', logDate: '2026-01-01' });
    });
    expect(result.current.logs.length).toBeGreaterThan(0);
    expect(result.current.logs[0].id).toBe('log1');
  });

  it('should toggle evidence mode', () => {
    const { result } = renderHook(() => useAppState());
    act(() => {
      result.current.setEvidenceMode(true);
    });
    expect(result.current.evidenceMode).toBe(true);
  });

  // Add more tests for other state actions as needed
});
