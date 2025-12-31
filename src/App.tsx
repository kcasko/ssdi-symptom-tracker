/**
 * SSDI Symptom Tracker - Main App Entry Point
 * Production-ready React Native + Expo app optimized for SSDI documentation
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation/AppNavigator';
import { useAppState } from './state/useAppState';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

export default function App() {
  // Initialize app state
  const { isInitialized, isLoading, hasError, errorMessage } = useAppState();

  // Loading screen while app initializes
  if (isLoading || !isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={[styles.appTitle, { color: colors.primary600 }]}>
            SSDI Symptom Tracker
          </Text>
          <ActivityIndicator 
            size="large" 
            color={colors.primary600} 
            style={styles.spinner}
          />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Initializing your private symptom tracker...
          </Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  // Error screen if initialization failed
  if (hasError && errorMessage) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.error.main }]}>
            Initialization Error
          </Text>
          <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
            {errorMessage}
          </Text>
          <Text style={[styles.errorHelp, { color: colors.text.secondary }]}>
            Please restart the app. If the problem persists, check that your device has sufficient storage space.
          </Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  // Main app
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorHelp: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});