/**
 * Voice Recorder Component
 * Records audio and converts to text for hands-free symptom logging
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  autoSpeak?: boolean; // Provide audio feedback
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onError,
  placeholder = "Tap and speak to log symptoms",
  autoSpeak = true,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Use refs to always access latest prop values without re-registering listeners
  const onTranscriptionRef = useRef(onTranscription);
  const onErrorRef = useRef(onError);
  const autoSpeakRef = useRef(autoSpeak);

  // Update refs when props change
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onErrorRef.current = onError;
    autoSpeakRef.current = autoSpeak;
  }, [onTranscription, onError, autoSpeak]);

  // ...existing code...

  const getErrorMessage = (errorCode: string, errorMessage: string): { message: string; isRecoverable: boolean } => {
    // Handle specific error codes from speech recognition
    // Code 5: Client side error (cancelled, timeout)
    // Code 7: No match (speech not recognized)
    // Code 11: Didn't understand
    if (errorCode === '5' || errorMessage.includes('Client side')) {
      return { message: 'Recording stopped. Tap to try again.', isRecoverable: true };
    }
    if (errorCode === '7' || errorMessage.includes('No match')) {
      return { message: 'No speech detected. Please speak clearly.', isRecoverable: true };
    }
    if (errorCode === '11' || errorMessage.includes('understand')) {
      return { message: 'Could not understand. Please try again.', isRecoverable: true };
    }
    if (errorMessage.includes('network')) {
      return { message: 'Network error. Please check your internet connection.', isRecoverable: false };
    }
    if (errorMessage.includes('permission')) {
      return { message: 'Microphone permission required for voice logging.', isRecoverable: false };
    }
    if (errorMessage.includes('no-speech')) {
      return { message: 'No speech detected. Please speak clearly and try again.', isRecoverable: true };
    }
    return { message: 'Voice recognition failed. Please try again.', isRecoverable: true };
  };

  const speakFeedback = (text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const onSpeechStart = () => {
    setIsRecording(true);
    setIsProcessing(false);
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
    setIsProcessing(true);
  };

  const onSpeechResults = (event: any) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setTranscription(text);
      setIsProcessing(false);
      onTranscriptionRef.current?.(text);
      
      // Provide audio feedback
      if (autoSpeakRef.current) {
        speakFeedback(`I heard: ${text}`);
      }
    }
  };

  const onSpeechPartialResults = (event: any) => {
    if (event.value && event.value.length > 0) {
      setTranscription(event.value[0]);
    }
  };

  const onSpeechError = (event: any) => {
    setIsRecording(false);
    setIsProcessing(false);

    const errorCode = event.error?.code || '';
    const errorMsg = event.error?.message || event.error || '';
    const { message, isRecoverable } = getErrorMessage(errorCode, errorMsg);

    // Use warn for recoverable errors (no speech, cancelled) to avoid alarming red logs
    if (isRecoverable) {
      console.warn('Speech recognition:', message);
    } else {
      console.error('Speech recognition error:', event);
    }

    onErrorRef.current?.(message);

    if (autoSpeakRef.current && !isRecoverable) {
      speakFeedback('Sorry, I didn\'t catch that. Please try again.');
    }
  };

  useEffect(() => {
    const initializeVoice = async () => {
      try {
        // Request audio recording permissions
        if (Platform.OS !== 'web') {
          const { status } = await Audio.requestPermissionsAsync();
          setHasPermission(status === 'granted');
          
          if (status !== 'granted') {
            Alert.alert(
              'Microphone Permission Required',
              'Voice logging needs microphone access to work. Please enable it in your device settings.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Initialize voice recognition
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
      } catch (error) {
        console.error('Voice initialization error:', error);
        onErrorRef.current?.('Failed to initialize voice recognition');
      }
    };

    initializeVoice();
    return () => {
      // Cleanup must be synchronous, so we don't await
      Voice.destroy().catch(console.error);
      Voice.removeAllListeners();
    };
    // Handlers use refs for props, so they don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (hasPermission === false) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required for voice logging.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setTranscription('');
      setIsProcessing(false);
      
      if (autoSpeak) {
        speakFeedback('Listening...');
      }
      
      await Voice.start('en-US');
    } catch (error) {
      console.error('Start recording error:', error);
      onError?.('Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Stop Recording';
    return 'Start Voice Logging';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Converting speech to text...';
    if (isRecording) return 'Listening... Speak clearly';
    if (transcription) return 'Tap to record again or edit the text';
    return placeholder;
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Microphone permission required for voice logging
          </Text>
          <Text style={styles.errorSubtext}>
            Enable microphone access in your device settings
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          (isProcessing || hasPermission === null) && styles.recordButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={isProcessing || hasPermission === null}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop voice recording' : 'Start voice recording'}
        testID="voice-recorder-button"
      >
        <View style={styles.recordButtonInner}>
          <Text style={[
            styles.recordButtonText,
            isRecording && styles.recordButtonTextActive,
          ]}>
            🎤
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.statusText}>{getStatusText()}</Text>
      
      <Text style={styles.buttonLabel}>{getButtonText()}</Text>

      {transcription ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Voice Input:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearTranscription}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear voice transcription"
            testID="clear-transcription-button"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    borderWidth: 3,
    borderColor: colors.primary[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recordButtonActive: {
    backgroundColor: colors.error.main,
    borderColor: colors.error.dark,
  },
  recordButtonDisabled: {
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[300],
  },
  recordButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 32,
  },
  recordButtonTextActive: {
    fontSize: 32,
  },
  statusText: {
    ...typography.bodyMedium,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
    maxWidth: 250,
  },
  buttonLabel: {
    ...typography.labelLarge,
    color: colors.primary[600],
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  transcriptionContainer: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 4,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  transcriptionLabel: {
    ...typography.labelMedium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  transcriptionText: {
    ...typography.bodyLarge,
    color: colors.gray[900],
    minHeight: 40,
    marginBottom: spacing.sm,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    ...typography.labelSmall,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: spacing.lg,
    backgroundColor: colors.error.light,
    borderRadius: 4,
    alignItems: 'center',
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.error.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    ...typography.bodySmall,
    color: colors.error.text,
    textAlign: 'center',
    opacity: 0.8,
  },
});