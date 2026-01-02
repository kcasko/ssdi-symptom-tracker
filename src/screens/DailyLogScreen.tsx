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
import { BigButton, SymptomPicker, PainScale, NotesField, PhotoPicker, PhotoGallery, LogFinalizationControls, RevisionHistoryViewer } from '../components';
import { useAppState } from '../state/useAppState';
import { LogService, PhotoService } from '../services';
import { canModifyLog, updateLogWithRevision } from '../services/EvidenceLogService';
import { getSymptomById } from '../data/symptoms';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';

type DailyLogProps = NativeStackScreenProps<RootStackParamList, 'DailyLog'>;

interface SymptomEntry {
  symptomId: string;
  severity: number;
  notes?: string;
}

export const DailyLogScreen: React.FC<DailyLogProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, addDailyLog, updateDailyLog, addPhoto, deletePhoto, getPhotosByEntity } = useAppState();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [symptomEntries, setSymptomEntries] = useState<Record<string, SymptomEntry>>({});
  const [activeSymptomId, setActiveSymptomId] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [logPhotos, setLogPhotos] = useState<PhotoAttachment[]>([]);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  const existingLog = dailyLogs.find(
    (l) => l.profileId === activeProfile?.id && l.logDate === date
  );

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

      // Load photos for this log
      if (existingLog.id) {
        const existingPhotos = getPhotosByEntity('daily_log', existingLog.id);
        setLogPhotos(existingPhotos);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSave = async () => {
    if (!activeProfile) return;

    if (selectedSymptomIds.length === 0) {
      Alert.alert('No Symptoms', 'Please select at least one symptom');
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
        severity: symptomEntries[id]?.severity || 5,
        notes: symptomEntries[id]?.notes,
      }));

      // Collect photo IDs
      const photoIds = logPhotos.map(p => p.id);

      if (existingLog) {
        const updated = LogService.updateDailyLog(existingLog, {
          symptoms,
          notes: generalNotes,
          photos: photoIds,
        });
        
        // Use revision system if log is finalized
        if (existingLog.finalized) {
          await updateLogWithRevision(
            existingLog.id,
            'daily',
            activeProfile.id,
            existingLog,
            updated,
            'Updated symptom entries and notes'
          );
          // updateDailyLog will be called by the revision system
        } else {
          await updateDailyLog(updated);
        }
      } else {
        // Pass data to store, which will create the log with proper IDs and timestamps
        await addDailyLog({
          profileId: activeProfile.id,
          logDate: date,
          timeOfDay: 'morning',
          symptoms,
          overallSeverity: symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length,
          notes: generalNotes,
          photos: photoIds,
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
              logType="daily"
              profileId={activeProfile.id}
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

        {/* Photo Evidence Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          
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
          label="🎤 Voice Log Symptoms"
          onPress={() => navigation.navigate('VoiceLog')}
          variant="secondary"
          fullWidth
          style={{ marginBottom: spacing.sm }}
        />
        <BigButton
          label={existingLog ? 'Update Log' : 'Save Log'}
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
