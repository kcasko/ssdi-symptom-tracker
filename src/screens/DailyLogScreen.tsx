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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton, SymptomPicker, PainScale, NotesField } from '../components';
import { useAppState } from '../state/useAppState';
import { LogService } from '../services';
import { getSymptomById } from '../data/symptoms';

type DailyLogProps = NativeStackScreenProps<RootStackParamList, 'DailyLog'>;

interface SymptomEntry {
  symptomId: string;
  severity: number;
  notes?: string;
}

export const DailyLogScreen: React.FC<DailyLogProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, addDailyLog, updateDailyLog } = useAppState();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<Record<string, SymptomEntry>>({});
  const [activeSymptomId, setActiveSymptomId] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');

  const existingLog = dailyLogs.find(
    (l) => l.profileId === activeProfile?.id && l.logDate === date
  );

  useEffect(() => {
    if (existingLog) {
      const ids = existingLog.symptoms.map((s) => s.symptomId);
      setSelectedSymptomIds(ids);
      
      const entries: Record<string, SymptomEntry> = {};
      existingLog.symptoms.forEach((s) => {
        entries[s.symptomId] = {
          symptomId: s.symptomId,
          severity: s.severity,
          notes: s.notes,
        };
      });
      setSymptomEntries(entries);
      setGeneralNotes(existingLog.notes || '');
      
      if (ids.length > 0) {
        setActiveSymptomId(ids[0]);
      }
    }
  }, [existingLog?.id]); // Only re-run if the log ID changes

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
        [symptomId]: { symptomId, severity: 5 },
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

  const handleSave = () => {
    if (!activeProfile) return;

    if (selectedSymptomIds.length === 0) {
      Alert.alert('No Symptoms', 'Please select at least one symptom');
      return;
    }

    try {
      const symptoms = selectedSymptomIds.map((id) => ({
        symptomId: id,
        severity: symptomEntries[id]?.severity || 5,
        notes: symptomEntries[id]?.notes,
      }));

      if (existingLog) {
        const updated = LogService.updateDailyLog(existingLog, {
          symptoms,
          notes: generalNotes,
        });
        updateDailyLog(updated);
      } else {
        const log = LogService.createDailyLog({
          profileId: activeProfile.id,
          date,
          symptoms,
          notes: generalNotes,
        });
        addDailyLog(log);
      }

      Alert.alert('Success', 'Daily log saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save log');
    }
  };

  const activeSymptom = activeSymptomId ? getSymptomById(activeSymptomId) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              value={symptomEntries[activeSymptomId!]?.severity || 5}
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
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label={existingLog ? 'Update Log' : 'Save Log'}
          onPress={handleSave}
          variant="primary"
          fullWidth
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
