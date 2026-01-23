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
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VoiceLoggingService, VoiceLogResult } from '../services/VoiceLoggingService';
import { BigButton, PainScale } from '../components';
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editedSymptoms, setEditedSymptoms] = useState<SymptomEntry[]>([]);
  const [editedNotes, setEditedNotes] = useState('');

  const handleTranscription = async (text: string) => {
    setCurrentTranscription(text);
    setIsProcessing(true);

    try {
      const result = VoiceLoggingService.processVoiceInput(text);
      setVoiceResult(result);
      setEditedSymptoms(result.symptoms);
      setEditedNotes(result.notes || '');
      
      // Automatically show review modal after processing
      setShowReviewModal(true);
      
      // Provide audio feedback
      // Note: Feedback would be spoken via the VoiceRecorder component
      // VoiceLoggingService.generateFeedback(result);
      
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

  const handleReviewAndSave = () => {
    if (!activeProfile || editedSymptoms.length === 0) {
      Alert.alert('No Symptoms', 'Please ensure at least one symptom is included.');
      return;
    }
    setShowReviewModal(true);
  };

  const saveDailyLog = async () => {
    if (!activeProfile || editedSymptoms.length === 0) {
      Alert.alert('No Data', 'Please record some symptoms first.');
      return;
    }

    const missingSeverity = editedSymptoms.find((s) => (s.severity ?? -1) < 0);
    if (missingSeverity) {
      Alert.alert('Severity Required', 'Set a severity for each symptom before saving.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      await addDailyLog({
        profileId: activeProfile.id,
        logDate: today,
        timeOfDay: 'evening',
        symptoms: editedSymptoms,
        overallSeverity: calculateOverallSeverity(editedSymptoms),
        notes: editedNotes,
        // voiceTranscription: currentTranscription, // Store original transcription (if needed, add to model)
      });

      setShowReviewModal(false);
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

  const handleEditSymptomSeverity = (index: number, newSeverity: number) => {
    const updated = [...editedSymptoms];
    updated[index] = { ...updated[index], severity: newSeverity };
    setEditedSymptoms(updated);
  };

  const handleRemoveSymptom = (index: number) => {
    const updated = editedSymptoms.filter((_, i) => i !== index);
    setEditedSymptoms(updated);
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
    // Reset to original voice result
    if (voiceResult) {
      setEditedSymptoms(voiceResult.symptoms);
      setEditedNotes(voiceResult.notes || '');
    }
  };

  const calculateOverallSeverity = (symptoms: SymptomEntry[]): number => {
    const valid = symptoms.filter((s) => (s.severity ?? -1) >= 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((sum, s) => sum + (s.severity || 0), 0) / valid.length);
  };

  const clearResults = () => {
    setVoiceResult(null);
    setCurrentTranscription('');
  };

  const renderSymptomPreview = (symptom: SymptomEntry, index: number) => {
    const symptomDef = getSymptomById(symptom.symptomId);
    if (!symptomDef) return null;
    const severityLabel = symptom.severity >= 0 ? `${symptom.severity}/10` : 'Set severity';

    return (
      <View key={`${symptom.symptomId}-${index}`} style={styles.symptomCard}>
        <View style={styles.symptomHeader}>
          <Text style={styles.symptomName}>{symptomDef.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
            <Text style={styles.severityText}>{severityLabel}</Text>
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
    if (severity < 0) return colors.gray[300];
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

  const hasMissingSeverity = editedSymptoms.some((s) => (s.severity ?? -1) < 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Logging</Text>
          <Text style={styles.subtitle}>
            Alternative input method for symptom documentation
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
                label="Review & Save"
                onPress={handleReviewAndSave}
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

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelReview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Your Voice Log</Text>
                <Text style={styles.modalSubtitle}>
                  Review and edit detected symptoms before saving
                </Text>
              </View>

              {/* Original Transcription */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>Original Recording:</Text>
                <View style={styles.transcriptionBox}>
                  <Text style={styles.transcriptionBoxText}>{currentTranscription}</Text>
                </View>
              </View>

              {/* Detected Symptoms */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>
                  Detected Symptoms ({editedSymptoms.length})
                </Text>
                {editedSymptoms.map((symptom, index) => {
                  const symptomData = getSymptomById(symptom.symptomId);
                  const symptomName = symptomData?.name || 'Unknown Symptom';
                  
                  return (
                    <View key={index} style={styles.editableSymptomCard}>
                      <View style={styles.symptomCardHeader}>
                        <Text style={styles.symptomCardName}>{symptomName}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveSymptom(index)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.severitySliderContainer}>
                        <PainScale
                          value={symptom.severity ?? -1}
                          onChange={(value) => handleEditSymptomSeverity(index, value)}
                          label={symptom.severity >= 0 ? `Severity: ${symptom.severity}/10` : 'Select severity (0-10)'}
                        />
                      </View>

                      {symptom.location && (
                        <Text style={styles.symptomMetaText}>Location: {symptom.location}</Text>
                      )}
                      {symptom.notes && (
                        <Text style={styles.symptomMetaText}>Notes: {symptom.notes}</Text>
                      )}
                    </View>
                  );
                })}

                {editedSymptoms.length === 0 && (
                  <View style={styles.noSymptomsBox}>
                    <Text style={styles.noSymptomsText}>
                      No symptoms detected. You can record again or manually add symptoms from the Daily Log screen.
                    </Text>
                  </View>
                )}
              </View>

              {/* General Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>General Notes:</Text>
                <TextInput
                  style={styles.notesInput}
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Add any additional notes..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Confidence Score */}
              {voiceResult && (
                <View style={styles.modalSection}>
                  <Text style={styles.confidenceInfo}>
                    Detection Confidence: {Math.round(voiceResult.confidence * 100)}%
                  </Text>
                  {voiceResult.unrecognizedText && (
                    <Text style={styles.unrecognizedText}>
                      Unrecognized: "{voiceResult.unrecognizedText}"
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelReview}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  (editedSymptoms.length === 0 || hasMissingSeverity) && styles.modalSaveButtonDisabled
                ]}
                onPress={saveDailyLog}
                disabled={editedSymptoms.length === 0 || hasMissingSeverity}
              >
                <Text style={styles.modalSaveText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
  },
  modalScroll: {
    maxHeight: '85%',
  },
  modalHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    ...typography.headlineMedium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.gray[600],
  },
  modalSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionLabel: {
    ...typography.titleSmall,
    color: colors.gray[700],
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  transcriptionBox: {
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  transcriptionBoxText: {
    ...typography.bodyMedium,
    color: colors.gray[800],
    fontStyle: 'italic',
  },
  editableSymptomCard: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  symptomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  symptomCardName: {
    ...typography.titleMedium,
    color: colors.gray[900],
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.error.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  removeButtonText: {
    ...typography.labelSmall,
    color: colors.error.main,
    fontWeight: '600',
  },
  severitySliderContainer: {
    marginBottom: spacing.md,
  },
  symptomMetaText: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  noSymptomsBox: {
    backgroundColor: colors.warning.light,
    borderRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  noSymptomsText: {
    ...typography.bodyMedium,
    color: colors.warning.text,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    ...typography.bodyMedium,
    color: colors.gray[900],
    minHeight: 80,
  },
  confidenceInfo: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '500',
  },
  unrecognizedText: {
    ...typography.bodySmall,
    color: colors.warning.text,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    backgroundColor: colors.warning.light,
    padding: spacing.sm,
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[400],
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.buttonMedium,
    color: colors.gray[700],
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  modalSaveText: {
    ...typography.buttonMedium,
    color: colors.white,
    fontWeight: '600',
  },
});
