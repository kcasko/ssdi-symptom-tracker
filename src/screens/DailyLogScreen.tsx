/**
 * Daily Log Screen
 * Log symptoms for the day
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton, SymptomPicker, PainScale, NotesField, PhotoPicker, PhotoGallery, LogFinalizationControls, RevisionHistoryViewer } from '../components';
import { useAppState } from '../state/useAppState';
import { LogService, PhotoService } from '../services';
import { canModifyLog, updateLogWithRevision, getRevisionCount } from '../services/EvidenceLogService';
import { getSymptomById } from '../data/symptoms';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';
import { GapExplanation } from '../domain/models/GapExplanation';
import { calculateDaysDelayed, getDelayLabel, parseDate, getDaysBetween, addDays } from '../utils/dates';
import { ids } from '../utils/ids';

type DailyLogProps = NativeStackScreenProps<RootStackParamList, 'DailyLog'>;

interface SymptomEntry {
  symptomId: string;
  severity: number;
  notes?: string;
}

// Retrospective reasons removed - require free-form text to avoid coached language

export const DailyLogScreen: React.FC<DailyLogProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, addDailyLog, updateDailyLog, addPhoto, deletePhoto, getPhotosByEntity, addGapExplanation } = useAppState();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<Record<string, SymptomEntry>>({});
  const [activeSymptomId, setActiveSymptomId] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [logPhotos, setLogPhotos] = useState<PhotoAttachment[]>([]);
  const [gapExplanation, setGapExplanation] = useState('');
  const [retrospectiveNote, setRetrospectiveNote] = useState('');
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  const existingLog = dailyLogs.find(
    (l) => l.profileId === activeProfile?.id && l.logDate === date
  );
  const profileDailyLogs = dailyLogs.filter((l) => l.profileId === activeProfile?.id);
  const previousLog = profileDailyLogs
    .filter((l) => l.logDate < date)
    .sort((a, b) => b.logDate.localeCompare(a.logDate))[0];
  const gapDaysSinceLast = previousLog
    ? Math.max(0, getDaysBetween(previousLog.logDate, date) - 1)
    : 0;
  const gapRange =
    previousLog && gapDaysSinceLast > 0
      ? {
          start: addDays(parseDate(previousLog.logDate) || new Date(previousLog.logDate), 1)
            .toISOString()
            .split('T')[0],
          end: addDays(parseDate(date) || new Date(date), -1)
            .toISOString()
            .split('T')[0],
        }
      : null;
  const showGapExplanation = !existingLog && gapDaysSinceLast > 7 && Boolean(gapRange);

  const eventDateValid = Boolean(parseDate(date));
  const creationReference = existingLog?.createdAt || new Date().toISOString();
  const updatedReference = existingLog?.updatedAt || existingLog?.createdAt;
  const daysDelayed = eventDateValid ? calculateDaysDelayed(date, creationReference) : 0;
  const delayLabel = eventDateValid ? getDelayLabel(daysDelayed) : 'Event date format is invalid';
  const isBackdated = eventDateValid && daysDelayed > 7;
  const createdTimestampDisplay = existingLog?.createdAt
    ? new Date(existingLog.createdAt).toISOString()
    : 'Pending (set on save)';
  const updatedTimestampDisplay = updatedReference
    ? new Date(updatedReference).toISOString()
    : 'Pending (set on save)';
  const evidenceTimestampDisplay = existingLog?.evidenceTimestamp
    ? new Date(existingLog.evidenceTimestamp).toISOString()
    : 'Pending (set on save)';
  const showRetrospectiveContext =
    (eventDateValid && isBackdated) || Boolean(existingLog?.retrospectiveContext);

  useEffect(() => {
    if (existingLog) {
      const ids = existingLog.symptoms.map((s: { symptomId: string }) => s.symptomId);
      const entries: Record<string, SymptomEntry> = {};
      existingLog.symptoms.forEach((s: { symptomId: string; severity: number; notes?: string }) => {
        entries[s.symptomId] = {
          symptomId: s.symptomId,
          severity: s.severity,
          notes: s.notes,
        };
      });
      
      // Batch state updates to avoid cascading renders
      setSelectedSymptomIds(ids);
      setSymptomEntries(entries);
      setGeneralNotes(existingLog.notes || '');
      
      if (ids.length > 0) {
        setActiveSymptomId(ids[0]);
      }

      setRetrospectiveNote(existingLog.retrospectiveContext?.note || existingLog.retrospectiveContext?.reason || '');
      setGapExplanation('');

      // Load photos for this log
      if (existingLog.id) {
        const existingPhotos = getPhotosByEntity('daily_log', existingLog.id);
        setLogPhotos(existingPhotos);
      }
      return;
    }

    setSelectedSymptomIds([]);
    setSymptomEntries({});
    setGeneralNotes('');
    setActiveSymptomId(null);
    setLogPhotos([]);
    setRetrospectiveNote('');
    setGapExplanation('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLog?.id, date]); // Reset when the date changes

  const handleToggleSymptom = (symptomId: string) => {
    if (selectedSymptomIds.includes(symptomId)) {
      setSelectedSymptomIds(selectedSymptomIds.filter((id) => id !== symptomId));
      const newEntries = { ...symptomEntries };
      delete newEntries[symptomId];
      setSymptomEntries(newEntries);
      if (activeSymptomId === symptomId) {
        setActiveSymptomId(null);
      }
    } else {
      setSelectedSymptomIds([...selectedSymptomIds, symptomId]);
      setSymptomEntries({
        ...symptomEntries,
        [symptomId]: { symptomId, severity: -1 },
      });
      setActiveSymptomId(symptomId);
    }
  };

  const handleSeverityChange = (symptomId: string, severity: number) => {
    setSymptomEntries({
      ...symptomEntries,
      [symptomId]: { ...symptomEntries[symptomId], severity },
    });
  };

  const handleNotesChange = (symptomId: string, notes: string) => {
    setSymptomEntries({
      ...symptomEntries,
      [symptomId]: { ...symptomEntries[symptomId], notes },
    });
  };

  const handleSave = async () => {
    if (!activeProfile) return;

    if (selectedSymptomIds.length === 0) {
      Alert.alert('No Symptoms', 'Please select at least one symptom');
      return;
    }

    const missingSeverity = selectedSymptomIds.find(
      (id) => (symptomEntries[id]?.severity ?? -1) < 0
    );
    if (missingSeverity) {
      Alert.alert('Severity Required', 'Select a severity for each symptom before saving.');
      return;
    }

    if (!parseDate(date)) {
      Alert.alert('Invalid Date', 'Please enter the event date in YYYY-MM-DD format.');
      return;
    }

    // Block future dates
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      Alert.alert('Invalid Date', 'Cannot log events that have not occurred. Maximum date: today.');
      return;
    }

    // Require gap explanation for gaps >7 days
    if (showGapExplanation && gapRange && (!gapExplanation || gapExplanation.trim().length < 20)) {
      Alert.alert('Gap Explanation Required', 'Please provide an explanation of at least 20 characters for the logging gap.');
      return;
    }

    // Require retrospective context for entries >7 days delayed
    if (showRetrospectiveContext && isBackdated && (!retrospectiveNote || retrospectiveNote.trim().length < 20)) {
      Alert.alert('Retrospective Context Required', 'Please provide an explanation of at least 20 characters for why this entry was logged after the event date.');
      return;
    }

    // Check if log can be modified (Evidence Mode finalization check)
    if (existingLog && !canModifyLog(existingLog.id).canModify) {
      Alert.alert(
        'Log Finalized',
        'This log has been finalized for evidence purposes and cannot be directly edited. Use the revision system to record changes.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const symptoms = selectedSymptomIds.map((id) => ({
        symptomId: id,
        severity: symptomEntries[id]?.severity ?? 0,
        notes: symptomEntries[id]?.notes,
      }));

      // Collect photo IDs
      const photoIds = logPhotos.map(p => p.id);
      const creationTimestamp = existingLog?.createdAt || new Date().toISOString();
      const delayAtSave = calculateDaysDelayed(date, creationTimestamp);
      const retrospectiveContext = delayAtSave > 7
        ? {
            reason: '', // No longer using pre-filled reasons
            note: retrospectiveNote || existingLog?.retrospectiveContext?.note || existingLog?.retrospectiveContext?.reason || '',
            flaggedAt: existingLog?.retrospectiveContext?.flaggedAt || creationTimestamp,
            daysDelayed: delayAtSave,
          }
        : existingLog?.retrospectiveContext;

      if (existingLog) {
        const updated = LogService.updateDailyLog(existingLog, {
          symptoms,
          notes: generalNotes,
          photos: photoIds,
          retrospectiveContext,
        });
        
        // Use revision system if log is finalized
        if (existingLog.finalized) {
          await updateLogWithRevision(
            existingLog.id,
            'daily',
            activeProfile.id,
            existingLog,
            updated,
            'added_detail_omitted_earlier',
            'Updated symptom entries and notes',
            'Symptom severities and notes revised'
          );
          // updateDailyLog will be called by the revision system
        } else {
          await updateDailyLog(updated);
        }
      } else {
        // Pass data to store, which will create the log with proper IDs and timestamps
        if (showGapExplanation && gapRange && gapExplanation.trim().length > 0) {
          const nowIso = new Date().toISOString();
          const gapRecord: GapExplanation = {
            id: ids.gap(),
            profileId: activeProfile.id,
            startDate: gapRange.start,
            endDate: gapRange.end,
            lengthDays: gapDaysSinceLast,
            note: gapExplanation.trim(),
            createdAt: nowIso,
          };
          await addGapExplanation(gapRecord);
        }

        await addDailyLog({
          profileId: activeProfile.id,
          logDate: date,
          timeOfDay: 'morning',
          symptoms,
          overallSeverity: symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length,
          notes: generalNotes,
          photos: photoIds,
          retrospectiveContext,
        });
      }

      // Navigate back immediately after successful save
      console.log('Log saved successfully, navigating back');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save log');
    }
  };

  const handlePhotoAdded = async (photo: PhotoAttachment) => {
    // Save photo to store
    await addPhoto(photo);
    setLogPhotos([...logPhotos, photo]);
  };

  const handleDeletePhoto = async (photoId: string) => {
    // Delete from file system
    const photo = logPhotos.find(p => p.id === photoId);
    if (photo) {
      await PhotoService.deletePhoto(photo.uri);
    }
    
    // Remove from store
    await deletePhoto(photoId);
    setLogPhotos(logPhotos.filter(p => p.id !== photoId));
  };

  const activeSymptom = activeSymptomId ? getSymptomById(activeSymptomId) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.timelineLabel}>Event date (user-selected)</Text>
        <TextInput
          value={date}
          onChangeText={(text) => setDate(text.trim())}
          placeholder="YYYY-MM-DD"
          style={styles.dateInput}
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          blurOnSubmit={false}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {/* Evidence Mode Controls */}
        {existingLog && activeProfile && (
          <View style={styles.section}>
            <LogFinalizationControls
              log={existingLog}
              logType="daily"
              profileId={activeProfile.id}
            />
          </View>
        )}

        {existingLog && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.revisionButton}
              onPress={() => setShowRevisionHistory(true)}
            >
              <Text style={styles.revisionButtonText}>
                Revision history ({getRevisionCount(existingLog.id)})
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Original entry is preserved; revisions are timestamped and counted.
            </Text>
          </View>
        )}

        {showGapExplanation && gapRange && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gap explanation (required for gaps &gt;7 days)</Text>
            <Text style={styles.helperText}>
              No daily logs between {gapRange.start} and {gapRange.end} ({gapDaysSinceLast} days). Explanation required.
            </Text>
            <NotesField
              value={gapExplanation}
              onChange={setGapExplanation}
              label="Gap context"
              placeholder="Explain why no entries were made during this period (minimum 20 characters)"
            />
          </View>
        )}

        {showRetrospectiveContext && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retrospective context (required for entries &gt;7 days delayed)</Text>
            <Text style={styles.helperText}>
              This entry is dated {daysDelayed} days before the creation timestamp. Provide context in your own words.
            </Text>
            <NotesField
              value={retrospectiveNote}
              onChange={setRetrospectiveNote}
              label="Explanation for delay"
              placeholder="Explain in your own words why this entry was logged after the event date (minimum 20 characters)"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Symptoms</Text>
          <SymptomPicker
            selectedSymptomIds={selectedSymptomIds}
            onToggleSymptom={handleToggleSymptom}
          />
        </View>

        {activeSymptom && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate: {activeSymptom.name}</Text>
            <PainScale
              value={symptomEntries[activeSymptomId!]?.severity ?? -1}
              onChange={(severity) => handleSeverityChange(activeSymptomId!, severity)}
            />
            <NotesField
              value={symptomEntries[activeSymptomId!]?.notes || ''}
              onChange={(notes) => handleNotesChange(activeSymptomId!, notes)}
              label="Symptom Context"
              placeholder="What triggered it? How long? What helped?"
            />
          </View>
        )}

        <View style={styles.section}>
          <NotesField
            value={generalNotes}
            onChange={setGeneralNotes}
            label="General Notes"
            placeholder="Overall day summary, patterns noticed, etc."
          />
        </View>

        {/* Photo Evidence Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {existingLog?.finalized ? 'Finalized Evidence Attachments' : 'Supporting Photos (draft)'}
          </Text>

          {logPhotos.length > 0 && (
            <PhotoGallery
              photos={logPhotos}
              onDeletePhoto={handleDeletePhoto}
            />
          )}

          <PhotoPicker
            entityType="daily_log"
            entityId={existingLog?.id || 'temp'}
            onPhotoAdded={handlePhotoAdded}
            currentPhotoCount={logPhotos.length}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Voice Entry (Accessibility Mode)"
          onPress={() => navigation.navigate('VoiceLog')}
          variant="secondary"
          fullWidth
          style={{ marginBottom: spacing.sm }}
        />
        <BigButton
          label={existingLog?.finalized ? 'Create Revision (original preserved)' : existingLog ? 'Replace Entry (draft mode only)' : 'Save Entry'}
          onPress={handleSave}
          variant="primary"
          fullWidth
        />
      </View>

      {/* Revision History Modal */}
      {existingLog && (
        <RevisionHistoryViewer
          visible={showRevisionHistory}
          onClose={() => setShowRevisionHistory(false)}
          logId={existingLog.id}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  timelineLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    fontWeight: typography.weights.medium as any,
  },
  dateInput: {
    borderWidth: 2,
    borderColor: colors.gray400,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.gray900,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timelineCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray400,
    borderRadius: 4,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  timelineValue: {
    fontSize: typography.sizes.lg,
    color: colors.gray900,
    fontWeight: typography.weights.bold as any,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  delayLabel: {
    fontSize: typography.sizes.md,
    color: colors.gray900,
    fontWeight: typography.weights.semibold as any,
  },
  timelineCardWarning: {
    borderColor: colors.errorMain,
    borderWidth: 3,
    backgroundColor: colors.error.light,
  },
  delayValueWarning: {
    color: colors.errorMain,
  },
  delayLabelWarning: {
    color: colors.errorMain,
  },
  noticeBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.errorMain,
    backgroundColor: colors.error.light,
    gap: spacing.xs,
  },
  noticeTitle: {
    fontSize: typography.sizes.md,
    color: colors.gray900,
    fontWeight: typography.weights.bold as any,
  },
  noticeBody: {
    fontSize: typography.sizes.sm,
    color: colors.gray800,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  helperText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
  },
  revisionButton: {
    borderWidth: 1,
    borderColor: colors.gray400,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  revisionButtonText: {
    fontSize: typography.sizes.md,
    color: colors.gray900,
    fontWeight: typography.weights.semibold as any,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
