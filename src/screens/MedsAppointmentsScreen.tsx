/**
 * Medications & Appointments Screen
 * Track treatments and medical visits
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export const MedsAppointmentsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meds & Appointments</Text>
        <Text style={styles.subtitle}>Treatment and visit tracking</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Medication and appointment tracking{'\n'}
          (For compliance documentation)
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: { padding: spacing.lg, backgroundColor: colors.white, gap: spacing.xs },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any, color: colors.gray900 },
  subtitle: { fontSize: typography.sizes.md, color: colors.gray600 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  placeholder: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center' },
});
