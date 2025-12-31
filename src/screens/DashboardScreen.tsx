/**
 * Dashboard Screen
 * Main hub with quick stats and navigation
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton, SummaryCard } from '../components';
import { useAppState } from '../state/useAppState';
import { AnalysisService } from '../services';
import { formatDate, DISPLAY_DATE_SHORT } from '../utils/dates';

type DashboardProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<DashboardProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, activityLogs, limitations } = useAppState();

  useEffect(() => {
    if (!activeProfile) {
      navigation.replace('ProfilePicker');
    }
  }, [activeProfile, navigation]);

  if (!activeProfile) {
    return null;
  }

  // Filter logs for active profile
  const profileDailyLogs = dailyLogs.filter(l => l.profileId === activeProfile.id);
  const profileActivityLogs = activityLogs.filter(l => l.profileId === activeProfile.id);
  const profileLimitations = limitations.filter(l => l.profileId === activeProfile.id);

  // Get quick stats
  const stats = AnalysisService.getQuickStats(
    profileDailyLogs,
    profileActivityLogs,
    profileLimitations
  );

  // Check if logged today
  const today = new Date().toISOString().split('T')[0];
  const loggedToday = profileDailyLogs.some(l => l.logDate === today);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.profileName}>{activeProfile.displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Status */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today</Text>
          {loggedToday ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>✓ Logged</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DailyLog')}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <BigButton
              label="Log Today's Symptoms"
              onPress={() => navigation.navigate('DailyLog')}
              variant="primary"
              fullWidth
            />
          )}
        </View>

        {/* Quick Stats - Last 7 Days */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          <View style={styles.statsGrid}>
            <SummaryCard
              title="Symptoms"
              value={stats.last7Days.symptomCount}
              subtitle="Unique symptoms"
              variant={stats.last7Days.symptomCount > 5 ? 'warning' : 'default'}
            />
            <SummaryCard
              title="Bad Days"
              value={stats.last7Days.badDays}
              subtitle="High severity"
              variant={stats.last7Days.badDays >= 4 ? 'error' : stats.last7Days.badDays >= 2 ? 'warning' : 'success'}
            />
          </View>
          <View style={styles.statsGrid}>
            <SummaryCard
              title="Activities"
              value={stats.last7Days.activitiesLogged}
              subtitle="Logged"
              variant="default"
            />
            <SummaryCard
              title="Total Logs"
              value={stats.allTime.totalLogs}
              subtitle="All time"
              variant="default"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <BigButton
            label="Log Activity Impact"
            onPress={() => navigation.navigate('ActivityLog')}
            variant="secondary"
            fullWidth
          />

          <BigButton
            label="Update Limitations"
            onPress={() => navigation.navigate('Limitations')}
            variant="secondary"
            fullWidth
          />

          <BigButton
            label="View Reports"
            onPress={() => navigation.navigate('Reports')}
            variant="secondary"
            fullWidth
          />
        </View>

        {/* Data Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Data Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Logs:</Text>
              <Text style={styles.summaryValue}>{stats.allTime.totalLogs}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Unique Symptoms:</Text>
              <Text style={styles.summaryValue}>{stats.allTime.totalSymptoms}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active Limitations:</Text>
              <Text style={styles.summaryValue}>{stats.allTime.totalLimitations}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  profileName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: typography.sizes.xl,
  },
  todaySection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  statusCard: {
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.success,
  },
  editLink: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.semibold as any,
  },
  statsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summarySection: {
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  summaryValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
});
