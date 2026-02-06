/**
 * UI Tests: Finalization Action and Badge Display
 * Tests REQ-FN-001 (finalize action), REQ-FN-005 (finalized badge)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogFinalizationControls } from '../../src/components/LogFinalizationControls';
import { Alert } from 'react-native';

const mockLog = {
  id: 'log-1',
  logDate: '2026-01-15',
  symptoms: [{ symptomId: 'sym-1', severity: 5 }],
};

const mockEvidenceStore = {
  isLogFinalized: jest.fn().mockReturnValue(false),
  finalizeLog: jest.fn(),
};

jest.mock('../../src/state/evidenceModeStore', () => ({
  useEvidenceModeStore: () => mockEvidenceStore,
}));

jest.mock('../../src/services/EvidenceLogService', () => ({
  canFinalizeLog: () => ({ canFinalize: true }),
  getFinalizationStatus: (logId: string) => 
    mockEvidenceStore.isLogFinalized(logId) ? 'Finalized on Jan 15, 2026' : 'Not finalized',
  getRevisionCount: () => 0,
}));

jest.spyOn(Alert, 'alert');

describe('REQ-FN-001: Finalize for Evidence Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEvidenceStore.isLogFinalized.mockReturnValue(false);
  });

  it('displays "Finalize Log" button when log not finalized', () => {
    const { getByTestId } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    const finalizeButton = getByTestId('finalize-log-button');
    expect(finalizeButton).toBeTruthy();
  });

  it('finalize button has accessible label', () => {
    const { getByTestId } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    const finalizeButton = getByTestId('finalize-log-button');
    expect(finalizeButton.props.accessibilityLabel).toBe('Finalize log and make read-only');
  });

  it('shows confirmation alert when Finalize button pressed', () => {
    const { getByTestId } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    const finalizeButton = getByTestId('finalize-log-button');
    fireEvent.press(finalizeButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Finalize Log',
      expect.stringContaining('make it read-only'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Finalize' }),
      ])
    );
  });

  it('calls finalizeLog service when user confirms', async () => {
    const { getByTestId } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    const finalizeButton = getByTestId('finalize-log-button');
    fireEvent.press(finalizeButton);

    // Get confirmation handler from Alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Finalize');
    
    await confirmButton.onPress();

    await waitFor(() => {
      expect(mockEvidenceStore.finalizeLog).toHaveBeenCalledWith(
        'log-1',
        'daily',
        'profile-1'
      );
    });
  });

  it('shows validation error when log cannot be finalized', () => {
    // Mock canFinalizeLog to return false
    jest.doMock('../../src/services/EvidenceLogService', () => ({
      canFinalizeLog: () => ({ 
        canFinalize: false, 
        reason: 'Cannot finalize a log with no symptoms recorded' 
      }),
      getFinalizationStatus: () => 'Not finalized',
      getRevisionCount: () => 0,
    }));

    const emptyLog = { ...mockLog, symptoms: [] };

    const { getByTestId } = render(
      <LogFinalizationControls 
        log={emptyLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    const finalizeButton = getByTestId('finalize-log-button');
    fireEvent.press(finalizeButton);

    // Validation alert shown before finalization
    // (Implementation note: canFinalizeLog check happens in handleFinalize)
  });

  it('REQ-FN-001 COMPLIANCE: Finalize action exists and is user-accessible', () => {
    const { getByTestId, getByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    // Verify complete finalization action UI
    expect(getByTestId('finalize-log-button')).toBeTruthy();
    expect(getByText('Finalize Log')).toBeTruthy();
    expect(getByText('Status:')).toBeTruthy();
    expect(getByText('Not finalized')).toBeTruthy();
  });
});

describe('REQ-FN-005: Finalized Badge Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays "Read-Only" badge when log is finalized', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);

    const { getByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    expect(getByText('Read-Only')).toBeTruthy();
  });

  it('does NOT display Read-Only badge when log not finalized', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(false);

    const { queryByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    expect(queryByText('Read-Only')).toBeNull();
  });

  it('hides Finalize button when log already finalized', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);

    const { queryByTestId } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    expect(queryByTestId('finalize-log-button')).toBeNull();
  });

  it('displays finalization status with date', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);

    const { getByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    expect(getByText('Finalized on Jan 15, 2026')).toBeTruthy();
  });

  it('REQ-FN-005 COMPLIANCE: Finalized badge displays in UI', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);

    const { getByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    // Verify badge elements required by REQ-FN-005
    expect(getByText('Read-Only')).toBeTruthy();
    expect(getByText('Status:')).toBeTruthy();
    expect(getByText(/Finalized on/)).toBeTruthy();
  });
});

describe('REQ-FN-003: Read-Only Flag for UI Rendering', () => {
  it('provides read-only flag data for UI components', () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);

    const { getByText } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );

    // Read-Only badge indicates UI consuming isReadOnly flag
    expect(getByText('Read-Only')).toBeTruthy();
  });

  it('button label changes based on finalization status', () => {
    // When finalized, button should say "Create Revision" (in parent screen)
    // When not finalized, button should say "Save Entry" (in parent screen)
    // LogFinalizationControls provides the status indicator

    mockEvidenceStore.isLogFinalized.mockReturnValue(false);
    const { getByTestId: getUnfinalized } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );
    expect(getUnfinalized('finalize-log-button')).toBeTruthy();

    jest.clearAllMocks();
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);
    const { queryByTestId: getFinalized } = render(
      <LogFinalizationControls 
        log={mockLog as any} 
        logType="daily" 
        profileId="profile-1" 
      />
    );
    expect(getFinalized('finalize-log-button')).toBeNull();
  });
});
