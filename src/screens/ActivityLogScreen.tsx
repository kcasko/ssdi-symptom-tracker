/**
 * Activity Log Screen
 * Log activity impact
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  BigButton,
  ActivityPicker,
  DurationPicker,
  PainScale,
  NotesField,
  LogFinalizationControls,
  RevisionHistoryViewer,
} from '../components';
import { useAppState } from '../state/useAppState';
import { LogService } from '../services';
import { canModifyLog } from '../services/EvidenceLogService';
import { calculateDaysDelayed, getDelayLabel, parseDate } from '../utils/dates';

type ActivityLogProps = NativeStackScreenProps<RootStackParamList, 'ActivityLog'>;

const RETROSPECTIVE_REASONS = [
  'Symptoms prevented logging earlier',
  'No access to the app or device',
  'Collecting supporting details before logging',
  'Delayed entry to keep timeline complete',
];

export const ActivityLogScreen: React.FC<ActivityLogProps> = ({ navigation }) => {
  const { activeProfile, addActivityLog, activityLogs } = useAppState();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [impactSeverity, setImpactSeverity] = useState(5);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [notes, setNotes] = useState('');
  const [retrospectiveReason, setRetrospectiveReason] = useState('');
  const [retrospectiveNote, setRetrospectiveNote] = useState('');
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Check for existing log on this date
  const existingLog = activityLogs.find(
    (l) => l.profileId === activeProfile?.id && l.activityDate === date && l.activityId === selectedActivityId
  );

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
    : 'None recorded';
  const showRetrospectiveContext =
    (eventDateValid && isBackdated) || Boolean(existingLog?.retrospectiveContext);

  useEffect(() => {
    if (existingLog) {
      setRetrospectiveReason(existingLog.retrospectiveContext?.reason || '');
      setRetrospectiveNote(existingLog.retrospectiveContext?.note || '');
      return;
    }

    setRetrospectiveReason('');
    setRetrospectiveNote('');
  }, [existingLog?.id, date]);

  const handleSave = () => {
    if (!activeProfile || !selectedActivityId) {
      Alert.alert('Missing Info', 'Please select an activity');
      return;
    }

    if (!parseDate(date)) {
      Alert.alert('Invalid Date', 'Please enter the event date in YYYY-MM-DD format.');
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
      const creationTimestamp = existingLog?.createdAt || new Date().toISOString();
      const delayAtSave = calculateDaysDelayed(date, creationTimestamp);
      const retrospectiveContext = delayAtSave > 7
        ? {
            reason: retrospectiveReason || existingLog?.retrospectiveContext?.reason,
            note: retrospectiveNote || existingLog?.retrospectiveContext?.note,
            flaggedAt: existingLog?.retrospectiveContext?.flaggedAt || creationTimestamp,
            daysDelayed: delayAtSave,
          }
        : existingLog?.retrospectiveContext;

      const log = LogService.createActivityLog({
        profileId: activeProfile.id,
        activityId: selectedActivityId,
        date,
        duration,
        stoppedEarly,
        impacts: impactSeverity > 0 ? [{ symptomId: 'general', severity: impactSeverity }] : [],
        notes,
        retrospectiveContext,
      });

      addActivityLog(log);
      Alert.alert('Success', 'Activity log saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save log');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Log</Text>
        <Text style={styles.timelineLabel}>Event date (user-selected)</Text>
        <TextInput
          value={date}
          onChangeText={(text) => setDate(text.trim())}
          placeholder="YYYY-MM-DD"
          style={styles.dateInput}
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        <View style={styles.timelineCard}>
          <Text style={styles.timelineLabel}>Record created timestamp (system)</Text>
          <Text style={styles.timelineValue}>{createdTimestampDisplay}</Text>
          <Text style={styles.timelineLabel}>Last modified timestamp (system)</Text>
          <Text style={styles.timelineValue}>{updatedTimestampDisplay}</Text>
          <Text style={styles.timelineLabel}>Evidence timestamp (system, immutable)</Text>
          <Text style={styles.timelineValue}>{evidenceTimestampDisplay}</Text>
          <Text style={styles.timelineLabel}>Delay between event date and creation</Text>
          <Text style={styles.timelineValue}>
            {eventDateValid ? `${daysDelayed} days` : 'N/A'}
          </Text>
          <Text style={styles.delayLabel}>{delayLabel}</Text>
        </View>
        {showRetrospectiveContext && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Retrospective entry</Text>
            <Text style={styles.noticeBody}>
              {eventDateValid
                ? `This date is ${daysDelayed} days before the creation timestamp. The entry will be marked as retrospective.`
                : 'This entry has retrospective context. Enter a valid event date to confirm the delay.'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Evidence Mode Controls */}
        {existingLog && activeProfile && (
          <View style={styles.section}>
            <LogFinalizationControls
              log={existingLog}
              logType="activity"
              profileId={activeProfile.id}
            />
          </View>
        )}

        {showRetrospectiveContext && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retrospective context (optional)</Text>
            <Text style={styles.helperText}>
              Add neutral context for entries logged after the event date.
            </Text>
            <View style={styles.reasonList}>
              {RETROSPECTIVE_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonButton,
                    retrospectiveReason === reason && styles.reasonButtonSelected,
                  ]}
                  onPress={() =>
                    setRetrospectiveReason(
                      retrospectiveReason === reason ? '' : reason
                    )
                  }
                >
                  <Text style={styles.reasonButtonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <NotesField
              value={retrospectiveNote}
              onChange={setRetrospectiveNote}
              label="Context note"
              placeholder="Optional details for why this was logged after the event date"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Activity</Text>
          <ActivityPicker
            selectedActivityId={selectedActivityId}
            onSelectActivity={setSelectedActivityId}
          />
        </View>

        {selectedActivityId && (
          <>
            <View style={styles.section}>
              <DurationPicker value={duration} onChange={setDuration} />
            </View>

            <View style={styles.section}>
              <PainScale
                value={impactSeverity}
                onChange={setImpactSeverity}
                label="Impact Severity (0-10)"
              />
            </View>

            <View style={styles.section}>
              <BigButton
                label={stoppedEarly ? 'Stopped Early' : 'Completed Full Duration'}
                onPress={() => setStoppedEarly(!stoppedEarly)}
                variant={stoppedEarly ? 'danger' : 'secondary'}
                fullWidth
              />
            </View>

            <View style={styles.section}>
              <NotesField
                value={notes}
                onChange={setNotes}
                label="Activity Context"
                placeholder="Recovery needed, what helped, what made it worse..."
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Save Activity Log"
          onPress={handleSave}
          variant="primary"
          fullWidth
          disabled={!selectedActivityId}
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
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  timelineCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    gap: spacing.xs,
    backgroundColor: colors.background.primary,
  },
  timelineValue: {
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  delayLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    fontWeight: typography.weights.medium as any,
  },
  noticeBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warningMain,
    backgroundColor: colors.warningLight,
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
  reasonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reasonButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
  },
  reasonButtonSelected: {
    borderColor: colors.primary600,
    backgroundColor: colors.primaryLight,
  },
  reasonButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray900,
    fontWeight: typography.weights.medium as any,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
