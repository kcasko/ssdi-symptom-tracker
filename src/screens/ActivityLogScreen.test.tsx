import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

jest.mock('../services', () => ({
  LogService: {
    updateActivityLog: (log: any, updates: any) => ({
      ...log,
      ...updates,
      immediateImpact: log.immediateImpact || { symptoms: [], overallImpact: 0 },
    }),
    createActivityLog: (input: any) => ({
      id: 'new-log',
      profileId: input.profileId,
      createdAt: '2026-01-15T08:00:00.000Z',
      updatedAt: '2026-01-15T08:00:00.000Z',
      activityDate: input.date,
      activityId: input.activityId,
      activityName: 'Mock Activity',
      duration: input.duration,
      intensity: 'light',
      immediateImpact: { symptoms: [], overallImpact: input.impacts?.[0]?.severity ?? 0 },
      recoveryActions: [],
      stoppedEarly: input.stoppedEarly ?? false,
      notes: input.notes,
    }),
  },
}));

const mockUseAppState = jest.fn();
const mockEvidenceStore = {
  isLogFinalized: jest.fn(),
};
const mockUpdateLogWithRevision = jest.fn();
const mockGetRevisionCount = jest.fn();

jest.mock('../state/useAppState', () => ({
  useAppState: () => mockUseAppState(),
}));

jest.mock('../state/evidenceModeStore', () => ({
  useEvidenceModeStore: () => mockEvidenceStore,
}));

jest.mock('../services/EvidenceLogService', () => ({
  updateLogWithRevision: (...args: any[]) => mockUpdateLogWithRevision(...args),
  getRevisionCount: (...args: any[]) => mockGetRevisionCount(...args),
}));

jest.mock('../components', () => {
  const React = require('react');
  const { Text, TextInput, TouchableOpacity, View } = require('react-native');
  return {
    BigButton: ({ label, onPress, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={`${label}-button`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    ActivityPicker: ({ onSelectActivity }: any) => (
      <TouchableOpacity onPress={() => onSelectActivity('activity-1')} testID="select-activity">
        <Text>Select Activity</Text>
      </TouchableOpacity>
    ),
    DurationPicker: ({ value, onChange }: any) => (
      <TouchableOpacity onPress={() => onChange(value)} testID="duration-picker">
        <Text>Duration</Text>
      </TouchableOpacity>
    ),
    PainScale: ({ value, onChange }: any) => (
      <TouchableOpacity onPress={() => onChange(5)} testID="impact-severity">
        <Text>{`Impact: ${value}`}</Text>
      </TouchableOpacity>
    ),
    NotesField: ({ value, onChange, label, placeholder }: any) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          testID={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
        />
      </View>
    ),
    RevisionReasonModal: ({
      visible,
      note,
      onChangeNote,
      onConfirm,
      onCancel,
    }: any) =>
      visible ? (
        <View>
          <Text>Revision modal</Text>
          <TextInput testID="revision-note-input" value={note} onChangeText={onChangeNote} />
          <TouchableOpacity testID="revision-confirm" onPress={onConfirm}>
            <Text>Save revision</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="revision-cancel" onPress={onCancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null,
    LogFinalizationControls: () => <View />,
    RevisionHistoryViewer: () => <View />,
  };
});

import { ActivityLogScreen } from './ActivityLogScreen';

const baseLog = {
  id: 'log-1',
  profileId: 'profile-1',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-01-15T08:00:00.000Z',
  activityDate: '2026-01-15',
  activityId: 'activity-1',
  activityName: 'Walking',
  duration: 30,
  intensity: 'light',
  immediateImpact: { symptoms: [], overallImpact: 5 },
  recoveryActions: [],
  stoppedEarly: false,
  notes: '',
};

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as any;
const route = {
  key: 'ActivityLog',
  name: 'ActivityLog',
  params: undefined,
} as any;

describe('ActivityLogScreen revisions', () => {
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-01-15T12:00:00.000Z').getTime()
    );
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUpdateLogWithRevision.mockResolvedValue({ success: true, needsRevision: true });
    mockGetRevisionCount.mockReturnValue(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
    dateNowSpy.mockRestore();
  });

  it('requires a revision reason for finalized activity logs', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);
    const mockUpdateActivityLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      addActivityLog: jest.fn(),
      updateActivityLog: mockUpdateActivityLog,
      activityLogs: [baseLog],
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ActivityLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');
    fireEvent.press(getByTestId('select-activity'));
    fireEvent.press(getByTestId('impact-severity'));
    await waitFor(() => {
      expect(getByText('Impact: 5')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('Create Revision (original preserved)')).toBeTruthy();
    });
    fireEvent.press(getByText('Create Revision (original preserved)'));
    fireEvent.press(getByTestId('revision-confirm'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Revision Reason Required',
      'Provide a neutral reason of at least 20 characters for this revision.'
    );
    expect(mockUpdateLogWithRevision).not.toHaveBeenCalled();
    expect(mockUpdateActivityLog).not.toHaveBeenCalled();
  });

  it('creates revisions for finalized activity logs when reason is provided', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);
    const mockUpdateActivityLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      addActivityLog: jest.fn(),
      updateActivityLog: mockUpdateActivityLog,
      activityLogs: [baseLog],
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ActivityLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');
    fireEvent.press(getByTestId('select-activity'));
    fireEvent.press(getByTestId('impact-severity'));
    await waitFor(() => {
      expect(getByText('Impact: 5')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('Create Revision (original preserved)')).toBeTruthy();
    });
    fireEvent.press(getByText('Create Revision (original preserved)'));
    fireEvent.changeText(
      getByTestId('revision-note-input'),
      'Corrected impact details from paper notes.'
    );
    fireEvent.press(getByTestId('revision-confirm'));

    await waitFor(() => {
      expect(mockUpdateLogWithRevision).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateActivityLog).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Activity log saved',
      expect.any(Array)
    );
  });

  it('updates draft activity logs when not finalized', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(false);
    const mockUpdateActivityLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      addActivityLog: jest.fn(),
      updateActivityLog: mockUpdateActivityLog,
      activityLogs: [baseLog],
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ActivityLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');
    fireEvent.press(getByTestId('select-activity'));
    fireEvent.press(getByTestId('impact-severity'));
    await waitFor(() => {
      expect(getByText('Impact: 5')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('Replace Entry (draft mode only)')).toBeTruthy();
    });
    fireEvent.press(getByText('Replace Entry (draft mode only)'));

    await waitFor(() => {
      expect(mockUpdateActivityLog).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateLogWithRevision).not.toHaveBeenCalled();
  });
});
