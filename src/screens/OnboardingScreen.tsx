/**
 * Onboarding Screen
 * First-time user introduction
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';
import { SettingsStorage } from '../storage/storage';

type OnboardingProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<OnboardingProps> = ({ navigation }) => {
  const handleGetStarted = async () => {
    await SettingsStorage.setFirstLaunchComplete();
    navigation.replace('ProfilePicker');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Daymark – Daily Symptom Documentation</Text>
        <Text style={styles.subtitle}>Structured record system for medical and disability documentation</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Does</Text>
          <Text style={styles.bodyText}>
            Daymark creates timestamped records of symptom severity, activity limitations, and functional capacity. Records are organized chronologically and can be exported for medical or legal review.
          </Text>
          <Text style={styles.bodyText}>
            All entries require explicit user input. No defaults are applied. Records cannot be retroactively modified once finalized.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Doesn't Do</Text>
          <Text style={styles.bodyText}>
            Daymark does not diagnose conditions, provide medical advice, or interpret logged data. It is a documentation tool only.
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featureText}>• Timestamped symptom severity records</Text>
          <Text style={styles.featureText}>• Activity limitation documentation</Text>
          <Text style={styles.featureText}>• Structured export format for medical providers</Text>
          <Text style={styles.featureText}>• Local storage only (no cloud transmission)</Text>
          <Text style={styles.featureText}>• Multi-profile support</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Documentation tool only. No diagnostic capability. No medical interpretation. User assumes full responsibility for data accuracy.
          </Text>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any, color: colors.gray900, textAlign: 'center', marginTop: spacing.lg },
  subtitle: { fontSize: typography.sizes.lg, color: colors.gray600, textAlign: 'center' },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold as any, color: colors.primaryMain },
  bodyText: { fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.6, color: colors.gray700 },
  features: { gap: spacing.sm, paddingLeft: spacing.xs },
  featureText: { fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.5, color: colors.gray700 },
  disclaimer: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: colors.primaryMain },
  disclaimerText: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.5, color: colors.gray700, textAlign: 'center' },
  footerSpacer: { height: spacing.md },
  footer: { padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200 },
});
