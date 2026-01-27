import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

const mockUseAppState = jest.fn();
const mockEvidenceStore = { isLogFinalized: jest.fn() };
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

jest.mock('../services', () => ({
  LogService: {
    updateDailyLog: (log: any, updates: any) => ({
      ...log,
      ...updates,
    }),
  },
  PhotoService: {
    deletePhoto: jest.fn(),
  },
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
    SymptomPicker: () => (
      <View>
        <Text>Symptom Picker</Text>
      </View>
    ),
    PainScale: ({ value }: any) => (
      <View>
        <Text>{`Severity: ${value}`}</Text>
      </View>
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
    PhotoPicker: () => <View />,
    PhotoGallery: () => <View />,
    LogFinalizationControls: () => <View />,
    RevisionHistoryViewer: () => <View />,
    RevisionReasonModal: ({ visible, note, onChangeNote, onConfirm, onCancel }: any) =>
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
  };
});

import { DailyLogScreen } from './DailyLogScreen';

const baseLog = {
  id: 'log-1',
  profileId: 'profile-1',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-01-15T08:00:00.000Z',
  logDate: '2026-01-15',
  timeOfDay: 'morning',
  symptoms: [
    {
      symptomId: 'headache',
      severity: 5,
      notes: 'Headache after noon.',
    },
  ],
  overallSeverity: 5,
  notes: 'General note',
  photos: [],
};

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as any;
const route = {
  key: 'DailyLog',
  name: 'DailyLog',
  params: undefined,
} as any;

describe('DailyLogScreen revisions', () => {
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

  it('requires a revision reason for finalized daily logs', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);
    const mockUpdateDailyLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      dailyLogs: [baseLog],
      addDailyLog: jest.fn(),
      updateDailyLog: mockUpdateDailyLog,
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      getPhotosByEntity: jest.fn().mockReturnValue([]),
      addGapExplanation: jest.fn(),
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <DailyLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');

    await waitFor(() => {
      expect(getByText('Create Revision (original preserved)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('Create Revision (original preserved)-button'));
    fireEvent.press(getByTestId('revision-confirm'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Revision Reason Required',
      'Provide a neutral reason of at least 20 characters for this revision.'
    );
    expect(mockUpdateLogWithRevision).not.toHaveBeenCalled();
    expect(mockUpdateDailyLog).not.toHaveBeenCalled();
  });

  it('creates revisions for finalized daily logs when reason is provided', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(true);
    const mockUpdateDailyLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      dailyLogs: [baseLog],
      addDailyLog: jest.fn(),
      updateDailyLog: mockUpdateDailyLog,
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      getPhotosByEntity: jest.fn().mockReturnValue([]),
      addGapExplanation: jest.fn(),
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <DailyLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');

    await waitFor(() => {
      expect(getByText('Create Revision (original preserved)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('Create Revision (original preserved)-button'));
    fireEvent.changeText(
      getByTestId('revision-note-input'),
      'Corrected symptom notes from records.'
    );
    fireEvent.press(getByTestId('revision-confirm'));

    await waitFor(() => {
      expect(mockUpdateLogWithRevision).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateDailyLog).not.toHaveBeenCalled();
  });

  it('updates draft daily logs when not finalized', async () => {
    mockEvidenceStore.isLogFinalized.mockReturnValue(false);
    const mockUpdateDailyLog = jest.fn();

    mockUseAppState.mockReturnValue({
      activeProfile: { id: 'profile-1' },
      dailyLogs: [baseLog],
      addDailyLog: jest.fn(),
      updateDailyLog: mockUpdateDailyLog,
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      getPhotosByEntity: jest.fn().mockReturnValue([]),
      addGapExplanation: jest.fn(),
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <DailyLogScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-01-15');

    await waitFor(() => {
      expect(getByText('Replace Entry (draft mode only)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('Replace Entry (draft mode only)-button'));

    await waitFor(() => {
      expect(mockUpdateDailyLog).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateLogWithRevision).not.toHaveBeenCalled();
  });
});
