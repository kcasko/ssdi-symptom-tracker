import React from 'react';
import { render } from '@testing-library/react-native';
import { LogFinalizationControls } from '../LogFinalizationControls';

jest.mock('../../state/evidenceModeStore', () => ({
  useEvidenceModeStore: () => ({
    isLogFinalized: jest.fn().mockReturnValue(false),
    finalizeLog: jest.fn(),
  }),
}));

jest.mock('../../services/EvidenceLogService', () => ({
  canFinalizeLog: () => ({ canFinalize: true }),
  getFinalizationStatus: () => 'Not Finalized',
  getRevisionCount: () => 0,
}));

describe('LogFinalizationControls', () => {
  const baseLog = { id: 'log1', logDate: '2026-01-01' } as any;

  it('renders finalize controls when not finalized', () => {
    const { getByText } = render(
      <LogFinalizationControls log={baseLog} logType="daily" profileId="profile-1" />
    );
    expect(getByText('Finalize Log')).toBeTruthy();
  });
});
