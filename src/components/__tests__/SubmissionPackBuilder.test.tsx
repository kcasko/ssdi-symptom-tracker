import React from 'react';
import { render } from '@testing-library/react-native';
import { SubmissionPackBuilder } from '../SubmissionPackBuilder';

jest.mock('../state/evidenceModeStore', () => ({
  useEvidenceModeStore: () => ({
    isLogFinalized: jest.fn().mockReturnValue(false),
    createPack: jest.fn().mockResolvedValue('pack-1'),
    getSubmissionPacks: jest.fn(() => []),
  }),
}));

jest.mock('../state/logStore', () => ({
  useLogStore: () => ({
    dailyLogs: [],
    activityLogs: [],
  }),
}));

describe('SubmissionPackBuilder', () => {
  it('renders with required props', () => {
    const { toJSON } = render(
      <SubmissionPackBuilder profileId="profile-1" appVersion="1.0.0" onPackCreated={() => {}} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
