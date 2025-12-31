/**
 * Voice Log Screen
 * Hands-free symptom logging using voice input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VoiceLoggingService, VoiceLogResult } from '../services/VoiceLoggingService';
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { getSymptomById } from '../data/symptoms';
import { SymptomEntry } from '../domain/models/DailyLog';

type VoiceLogProps = NativeStackScreenProps<RootStackParamList, 'VoiceLog'>;

export const VoiceLogScreen: React.FC<VoiceLogProps> = ({ navigation }) => {
  const { activeProfile, addDailyLog } = useAppState();
  const [voiceResult, setVoiceResult] = useState<VoiceLogResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');

  const handleTranscription = async (text: string) => {
    setCurrentTranscription(text);
    setIsProcessing(true);

    try {
      const result = VoiceLoggingService.processVoiceInput(text);
      setVoiceResult(result);
      
      // Provide audio feedback
      const feedback = VoiceLoggingService.generateFeedback(result);
      // Note: Feedback would be spoken via the VoiceRecorder component
      
    } catch (error) {
      console.error('Voice processing error:', error);
      Alert.alert('Processing Error', 'Failed to process your voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: string) => {
    Alert.alert('Voice Recognition Error', error);
  };

  const saveDailyLog = async () => {
    if (!activeProfile || !voiceResult || voiceResult.symptoms.length === 0) {
      Alert.alert('No Data', 'Please record some symptoms first.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      await addDailyLog({
        profileId: activeProfile.id,
        logDate: today,
        timeOfDay: 'evening',
        symptoms: voiceResult.symptoms,
        overallSeverity: calculateOverallSeverity(voiceResult.symptoms),
        notes: voiceResult.notes,
        // voiceTranscription: currentTranscription, // Store original transcription (if needed, add to model)
      });

      Alert.alert(
        'Saved!', 
        'Your voice log has been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save your voice log. Please try again.');
    }
  };

  const calculateOverallSeverity = (symptoms: SymptomEntry[]): number => {
    if (symptoms.length === 0) return 0;
    return Math.round(symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length);
  };

  const clearResults = () => {
    setVoiceResult(null);
    setCurrentTranscription('');
  };

  const renderSymptomPreview = (symptom: SymptomEntry, index: number) => {
    const symptomDef = getSymptomById(symptom.symptomId);
    if (!symptomDef) return null;

    return (
      <View key={`${symptom.symptomId}-${index}`} style={styles.symptomCard}>
        <View style={styles.symptomHeader}>
          <Text style={styles.symptomName}>{symptomDef.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
            <Text style={styles.severityText}>{symptom.severity}/10</Text>
          </View>
        </View>
        
        {symptom.location && (
          <Text style={styles.symptomDetail}>Location: {symptom.location}</Text>
        )}
        
        {symptom.notes && (
          <Text style={styles.symptomDetail}>Notes: {symptom.notes}</Text>
        )}
      </View>
    );
  };

  const getSeverityColor = (severity: number): string => {
    if (severity <= 2) return colors.success.main;
    if (severity <= 4) return colors.warning.main;
    if (severity <= 6) return colors.primary[400];
    if (severity <= 8) return colors.error.main;
    return colors.error.dark;
  };

  const renderVoiceInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>Voice Logging Tips</Text>
      <Text style={styles.instructionText}>
        • Speak clearly and describe your symptoms naturally
      </Text>
      <Text style={styles.instructionText}>
        • Include severity: "severe headache" or "mild back pain"
      </Text>
      <Text style={styles.instructionText}>
        • Mention location: "pain in my left knee"
      </Text>
      <Text style={styles.instructionText}>
        • Add details: "throbbing headache after working on computer"
      </Text>
      <Text style={styles.instructionExample}>
        Example: "I have a severe headache in my temples, mild fatigue, and sharp pain in my right shoulder"
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Logging</Text>
          <Text style={styles.subtitle}>
            Speak naturally to log your symptoms hands-free
          </Text>
        </View>

        <VoiceRecorder
          onTranscription={handleTranscription}
          onError={handleError}
          autoSpeak={true}
        />

        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>Processing your voice input...</Text>
          </View>
        )}

        {currentTranscription && !isProcessing && (
          <View style={styles.transcriptionDisplay}>
            <Text style={styles.transcriptionLabel}>What you said:</Text>
            <Text style={styles.transcriptionText}>"{currentTranscription}"</Text>
          </View>
        )}

        {voiceResult && voiceResult.symptoms.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Detected Symptoms ({voiceResult.symptoms.length})
            </Text>
            
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(voiceResult.confidence * 100)}%
              </Text>
            </View>

            {voiceResult.symptoms.map(renderSymptomPreview)}

            {voiceResult.notes && (
              <View style={styles.generalNotesContainer}>
                <Text style={styles.generalNotesLabel}>Additional Notes:</Text>
                <Text style={styles.generalNotesText}>{voiceResult.notes}</Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearResults}
              >
                <Text style={styles.clearButtonText}>Try Again</Text>
              </TouchableOpacity>

              <BigButton
                label="Save Voice Log"
                onPress={saveDailyLog}
                variant="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        )}

        {voiceResult && voiceResult.confidence < 0.3 && (
          <View style={styles.lowConfidenceContainer}>
            <Text style={styles.lowConfidenceTitle}>Low Confidence Detection</Text>
            <Text style={styles.lowConfidenceText}>
              I had trouble understanding your symptoms. Please try speaking more clearly 
              or use specific symptom names like "headache", "back pain", or "fatigue".
            </Text>
          </View>
        )}

        {!voiceResult && !isProcessing && renderVoiceInstructions()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Daily Log</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.displayMedium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[600],
    textAlign: 'center',
    maxWidth: 280,
  },
  processingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  processingText: {
    ...typography.bodyLarge,
    color: colors.primary[600],
    fontStyle: 'italic',
  },
  transcriptionDisplay: {
    margin: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[300],
  },
  transcriptionLabel: {
    ...typography.labelMedium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    ...typography.bodyLarge,
    color: colors.gray[900],
    fontStyle: 'italic',
  },
  resultsContainer: {
    margin: spacing.lg,
    marginTop: spacing.md,
  },
  resultsTitle: {
    ...typography.headlineMedium,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  confidenceContainer: {
    marginBottom: spacing.md,
  },
  confidenceText: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  symptomCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  symptomName: {
    ...typography.titleMedium,
    color: colors.gray[900],
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  severityText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: 'bold',
  },
  symptomDetail: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  generalNotesContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  generalNotesLabel: {
    ...typography.labelMedium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  generalNotesText: {
    ...typography.bodyMedium,
    color: colors.gray[900],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  clearButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[400],
  },
  clearButtonText: {
    ...typography.buttonMedium,
    color: colors.gray[700],
  },
  saveButton: {
    flex: 1,
  },
  lowConfidenceContainer: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.warning.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  lowConfidenceTitle: {
    ...typography.titleMedium,
    color: colors.warning.text,
    marginBottom: spacing.xs,
  },
  lowConfidenceText: {
    ...typography.bodyMedium,
    color: colors.warning.text,
  },
  instructionsContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  instructionsTitle: {
    ...typography.titleLarge,
    color: colors.primary[700],
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.bodyMedium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  instructionExample: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  bottomNav: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.buttonLarge,
    color: colors.primary[600],
  },
});