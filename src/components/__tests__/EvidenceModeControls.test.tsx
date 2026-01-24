import React from 'react';
import { render } from '@testing-library/react-native';
import { EvidenceModeControls } from '../EvidenceModeControls';

jest.mock('../state/evidenceModeStore', () => ({
  useEvidenceModeStore: () => ({
    config: { enabled: false, enabledAt: null },
    loadEvidenceMode: jest.fn(),
    enableEvidenceMode: jest.fn(),
    disableEvidenceMode: jest.fn(),
    isLogFinalized: jest.fn().mockReturnValue(false),
    finalizeLog: jest.fn(),
    getSubmissionPacks: jest.fn(() => []),
    error: null,
  }),
}));

describe('EvidenceModeControls', () => {
  it('renders compact variant without crashing', () => {
    const { toJSON } = render(<EvidenceModeControls profileId="profile-1" compact />);
    expect(toJSON()).toBeTruthy();
  });
});
