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
        <Text style={styles.title}>Welcome to Daymark</Text>
        <Text style={styles.subtitle}>A simple, honest tool for tracking your daily health patterns</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Does</Text>
          <Text style={styles.bodyText}>
            Daymark helps you keep a consistent record of how you're feeling and how daily activities affect you. It's designed to turn everyday experiences into clear, organized information over time.
          </Text>
          <Text style={styles.bodyText}>
            You don't need medical language, perfect memory, or long explanations. Short, honest entries are enough.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This App Doesn't Do</Text>
          <Text style={styles.bodyText}>
            Daymark does not diagnose conditions, replace medical care, or judge how well you're doing. There are no right or wrong answers. The app simply reflects what you log.
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featureText}>✓ Track symptoms and daily patterns</Text>
          <Text style={styles.featureText}>✓ Log activity impact and limitations</Text>
          <Text style={styles.featureText}>✓ Generate clear reports for doctors</Text>
          <Text style={styles.featureText}>✓ 100% private - your data stays on your device</Text>
          <Text style={styles.featureText}>✓ Multi-profile support for families</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            A calm, neutral tool for tracking how you're feeling over time. No wellness advice, no medical claims, just honest records.
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
  disclaimer: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.primaryMain },
  disclaimerText: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.5, color: colors.gray700, textAlign: 'center' },
  footerSpacer: { height: spacing.md },
  footer: { padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200 },
});
