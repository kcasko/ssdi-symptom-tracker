/**
 * Onboarding Screen
 * First-time user introduction
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';

type OnboardingProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<OnboardingProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Daymark</Text>
        <Text style={styles.subtitle}>Mark your days without judgment</Text>

        <View style={styles.features}>
          <Text style={styles.featureText}>✓ Track symptoms and daily patterns</Text>
          <Text style={styles.featureText}>✓ Generate clear, organized summaries</Text>
          <Text style={styles.featureText}>✓ 100% private - local storage only</Text>
          <Text style={styles.featureText}>✓ Multi-profile support</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            A calm, neutral tool for tracking how you're feeling over time. No wellness advice, no medical claims, just honest records.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label="Get Started"
          onPress={() => navigation.replace('ProfilePicker')}
          variant="primary"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any, color: colors.gray900, textAlign: 'center' },
  subtitle: { fontSize: typography.sizes.lg, color: colors.gray600, textAlign: 'center' },
  features: { gap: spacing.md, marginVertical: spacing.lg },
  featureText: { fontSize: typography.sizes.md, color: colors.gray700 },
  disclaimer: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 8 },
  disclaimerText: { fontSize: typography.sizes.sm, color: colors.gray700, textAlign: 'center' },
  footer: { padding: spacing.lg },
});
