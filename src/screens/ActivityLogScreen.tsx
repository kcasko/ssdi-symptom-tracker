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
} from '../components';
import { useAppState } from '../state/useAppState';
import { LogService } from '../services';

type ActivityLogProps = NativeStackScreenProps<RootStackParamList, 'ActivityLog'>;

export const ActivityLogScreen: React.FC<ActivityLogProps> = ({ navigation }) => {
  const { activeProfile, addActivityLog } = useAppState();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [impactSeverity, setImpactSeverity] = useState(5);
  const [stoppedEarly, setStoppedEarly] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!activeProfile || !selectedActivityId) {
      Alert.alert('Missing Info', 'Please select an activity');
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
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
