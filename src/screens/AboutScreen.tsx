/**
 * About Screen
 * In-app documentation explaining what the app is for and how to use it
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type AboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

export const AboutScreen: React.FC<AboutProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About This App</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section 1: What This App Is For */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✨</Text>
            <Text style={styles.sectionTitle}>What This App Is For</Text>
          </View>
          <Text style={styles.paragraph}>
            This app helps you keep a consistent record of how you're feeling and how daily activities affect you. It's designed to turn everyday experiences into clear, organized information over time.
          </Text>
          <Text style={styles.paragraph}>
            You don't need medical language, perfect memory, or long explanations. Short, honest entries are enough.
          </Text>
        </View>

        {/* Section 2: What This App Is Not */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={styles.sectionTitle}>What This App Is Not</Text>
          </View>
          <Text style={styles.paragraph}>
            This app does not diagnose conditions, replace medical care, or judge how well you're doing. There are no right or wrong answers.
          </Text>
          <Text style={styles.paragraph}>
            The app simply reflects what you log.
          </Text>
        </View>

        {/* Section 3: How to Use the App (Basic Flow) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>How to Use the App</Text>
          </View>
          <Text style={styles.paragraph}>
            Most people use the app in three simple ways:
          </Text>
          <View style={styles.instructionBlock}>
            <Text style={styles.instructionLine}>• Once per day, log your symptoms.</Text>
            <Text style={styles.instructionLine}>• When an activity affects you, log the impact.</Text>
            <Text style={styles.instructionLine}>• Review trends or reports when you want an overview.</Text>
          </View>
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              You can skip days, log quiet days, or log only when something changes. Consistency helps, but perfection isn't required.
            </Text>
          </View>
        </View>

        {/* Section 4: Understanding the Overview Screen */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Understanding the Overview</Text>
          </View>
          <Text style={styles.paragraph}>
            The Overview shows summaries based on what you've logged. Numbers and percentages are calculated automatically and change as more data is added.
          </Text>
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              If you see zeros or empty sections, it usually means you haven't logged yet or haven't logged in that category. This is normal.
            </Text>
          </View>
        </View>

        {/* Section 5: About Impact Bands */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>About Impact Bands</Text>
          </View>
          <Text style={styles.paragraph}>
            Impact bands are calculated from the severity and activity impact you record. The labels describe intensity only and do not add interpretation.
          </Text>
        </View>

        {/* Section 6: Logging Quiet Days */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>☀️</Text>
            <Text style={styles.sectionTitle}>Logging Quiet Days</Text>
          </View>
          <Text style={styles.paragraph}>
            Days with few or no symptoms are still important. Logging quiet days helps create an accurate picture over time and prevents gaps in your history.
          </Text>
        </View>

        {/* Section 7: Privacy and Data Use */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔒</Text>
            <Text style={styles.sectionTitle}>Privacy and Data Use</Text>
          </View>
          <Text style={styles.paragraph}>
            Your data stays on your device unless you choose to export or share it. The app only summarizes what you enter. Nothing is assumed or added automatically.
          </Text>
        </View>

        {/* Section 8: Using Reports */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📄</Text>
            <Text style={styles.sectionTitle}>Using Reports</Text>
          </View>
          <Text style={styles.paragraph}>
            Reports turn your logs into readable summaries. They are meant to help you explain patterns over time without having to remember details.
          </Text>
        </View>

        <View style={styles.footer} />
      </ScrollView>
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
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    fontSize: typography.sizes.md,
    color: colors.primaryMain,
    fontWeight: typography.weights.semibold as any,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionIcon: {
    fontSize: typography.sizes.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  paragraph: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.6,
    color: colors.gray700,
  },
  instructionBlock: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  instructionLine: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.6,
    color: colors.gray700,
  },
  tipBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryMain,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.6,
    color: colors.gray700,
  },
  footer: {
    height: spacing.xl,
  },
});
