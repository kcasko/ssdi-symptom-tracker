/**
 * Activity Log Screen
 * Log activity impact
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
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
import { canModifyLog, updateLogWithRevision } from '../services/EvidenceLogService';

type ActivityLogProps = NativeStackScreenProps<RootStackParamList, 'ActivityLog'>;

export const ActivityLogScreen: React.FC<ActivityLogProps> = ({ navigation }) => {
  const { activeProfile, addActivityLog, activityLogs } = useAppState();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [impactSeverity, setImpactSeverity] = useState(5);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Check for existing log on this date
  const existingLog = activityLogs.find(
    (l) => l.profileId === activeProfile?.id && l.activityDate === date && l.activityId === selectedActivityId
  );

  const handleSave = () => {
    if (!activeProfile || !selectedActivityId) {
      Alert.alert('Missing Info', 'Please select an activity');
      return;
    }

    // Check if log can be modified (Evidence Mode finalization check)
    if (existingLog && !canModifyLog(existingLog, activeProfile.id)) {
      Alert.alert(
        'Log Finalized',
        'This log has been finalized for evidence purposes and cannot be directly edited. Use the revision system to record changes.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const log = LogService.createActivityLog({
        profileId: activeProfile.id,
        activityId: selectedActivityId,
        date,
        duration,
        stoppedEarly,
        impacts: impactSeverity > 0 ? [{ symptomId: 'general', severity: impactSeverity }] : [],
        notes,
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
        <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
        {existingLog?.evidenceTimestamp && (
          <Text style={styles.evidenceTimestamp}>
            Evidence recorded: {new Date(existingLog.evidenceTimestamp).toLocaleString()}
          </Text>
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
              onRevisionHistoryPress={() => setShowRevisionHistory(true)}
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
                label={stoppedEarly ? '✓ Stopped Early' : 'Completed Full Duration'}
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
          logType="activity"
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
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  date: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  evidenceTimestamp: {
    fontSize: typography.sizes.sm,
    color: colors.primary600,
    fontWeight: typography.weights.medium as any,
    marginTop: spacing.xs,
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
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
