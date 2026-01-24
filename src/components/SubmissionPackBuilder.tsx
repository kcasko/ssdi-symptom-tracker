/**
 * Submission Pack Builder Component
 * Creates immutable bundles of finalized logs and reports
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useEvidenceModeStore } from '../state/evidenceModeStore';
import { useLogStore } from '../state/logStore';
import { colors } from '../theme/colors';
import { parseDate } from '../utils/dates';

interface SubmissionPackBuilderProps {
  profileId: string;
  appVersion: string;
  onPackCreated?: (packId: string) => void;
}

export function SubmissionPackBuilder({
  profileId,
  appVersion,
  onPackCreated,
}: SubmissionPackBuilderProps) {
  const evidenceStore = useEvidenceModeStore();
  const logStore = useLogStore();
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePack = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please provide a title for this submission pack.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select a date range.');
      return;
    }

    const startParsed = parseDate(startDate);
    const endParsed = parseDate(endDate);
    if (!startParsed || !endParsed) {
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format.');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('Error', 'Start date must be before end date.');
      return;
    }

    // Get logs in date range
    const dailyLogs = logStore.dailyLogs.filter((log) => {
      return log.logDate >= startDate && log.logDate <= endDate;
    });

    const activityLogs = logStore.activityLogs.filter((log) => {
      return log.activityDate >= startDate && log.activityDate <= endDate;
    });

    // Check for finalized logs
    const finalizedDailyLogs = dailyLogs.filter((log) =>
      evidenceStore.isLogFinalized(log.id)
    );
    const finalizedActivityLogs = activityLogs.filter((log) =>
      evidenceStore.isLogFinalized(log.id)
    );

    if (finalizedDailyLogs.length === 0 && finalizedActivityLogs.length === 0) {
      Alert.alert(
        'No Finalized Logs',
        'This date range contains no finalized logs. Would you like to continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => createPack() },
        ]
      );
      return;
    }

    await createPack();
  };

  const createPack = async () => {
    setLoading(true);

    try {
      // Get logs in date range
      const dailyLogs = logStore.dailyLogs.filter((log) => {
        return log.logDate >= startDate && log.logDate <= endDate;
      });

      const activityLogs = logStore.activityLogs.filter((log) => {
        return log.activityDate >= startDate && log.activityDate <= endDate;
      });

      const dailyLogIds = dailyLogs.map((log) => log.id);
      const activityLogIds = activityLogs.map((log) => log.id);

      // For now, no reports included (could be extended)
      const reportIds: string[] = [];

      const packId = await evidenceStore.createPack(
        profileId,
        title,
        startDate,
        endDate,
        dailyLogIds,
        activityLogIds,
        reportIds,
        appVersion
      );

      if (packId) {
        Alert.alert('Success', 'Submission pack created successfully.');
        setTitle('');
        setStartDate('');
        setEndDate('');
        onPackCreated?.(packId);
      } else {
        Alert.alert('Error', 'Failed to create submission pack.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Create Submission Pack</Text>
      <Text style={styles.description}>
        Submission packs bundle finalized logs and reports into an immutable package
        for submission to legal representatives or agencies.
      </Text>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Pack Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Initial Filing - Q1 2024"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          {startDate && (
            <Text style={styles.datePreview}>{formatDateForDisplay(startDate)}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>End Date</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
          {endDate && (
            <Text style={styles.datePreview}>{formatDateForDisplay(endDate)}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreatePack}
          disabled={loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={loading ? 'Creating submission pack' : 'Create submission pack'}
          testID="create-submission-pack-button"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Submission Pack'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.packsList}>
        <Text style={styles.subsectionTitle}>Existing Submission Packs</Text>
        <SubmissionPackList profileId={profileId} />
      </View>
    </ScrollView>
  );
}

interface SubmissionPackListProps {
  profileId: string;
}

function SubmissionPackList({ profileId }: SubmissionPackListProps) {
  const evidenceStore = useEvidenceModeStore();
  const packs = evidenceStore.getSubmissionPacks(profileId);

  if (packs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No submission packs created yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.packsContainer}>
      {packs.map((pack) => (
        <View key={pack.id} style={styles.packCard}>
          <Text style={styles.packTitle}>{pack.title}</Text>
          <Text style={styles.packDate}>
            {new Date(pack.startDate).toLocaleDateString()} -{' '}
            {new Date(pack.endDate).toLocaleDateString()}
          </Text>
          <View style={styles.packStats}>
            <Text style={styles.packStat}>
              Daily Logs: {pack.includedDailyLogs.length}
            </Text>
            <Text style={styles.packStat}>
              Activity Logs: {pack.includedActivityLogs.length}
            </Text>
            <Text style={styles.packStat}>
              Revisions: {pack.generationMetadata.totalRevisions}
            </Text>
          </View>
          <Text style={styles.packCreated}>
            Created: {new Date(pack.createdAt).toLocaleDateString()}
          </Text>
          <View style={styles.immutableBadge}>
            <Text style={styles.immutableText}>Immutable</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  datePreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primaryMain,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.gray400,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  packsList: {
    marginTop: 24,
  },
  packsContainer: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  packCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  packDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  packStats: {
    marginBottom: 8,
  },
  packStat: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  packCreated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  immutableBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  immutableText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
});
