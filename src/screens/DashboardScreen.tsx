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
import { BigButton, SummaryCard, EvidenceModeControls } from '../components';
import { useAppState } from '../state/useAppState';
import { AnalysisService } from '../services';
import { DayQualityAnalyzer } from '../services/DayQualityAnalyzer';
// Date formatting utilities not currently used in this screen

type DashboardProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<DashboardProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, activityLogs, limitations } = useAppState();

  // Filter logs for active profile
  const profileDailyLogs = React.useMemo(() => 
    activeProfile ? dailyLogs.filter(l => l.profileId === activeProfile.id) : [],
    [activeProfile, dailyLogs]
  );
  const profileActivityLogs = React.useMemo(() =>
    activeProfile ? activityLogs.filter(l => l.profileId === activeProfile.id) : [],
    [activeProfile, activityLogs]
  );
  const profileLimitations = React.useMemo(() =>
    activeProfile ? limitations.filter(l => l.profileId === activeProfile.id) : [],
    [activeProfile, limitations]
  );

  // Get quick stats
  const stats = activeProfile ? AnalysisService.getQuickStats(
    profileDailyLogs,
    profileActivityLogs,
    profileLimitations
  ) : null;

  // Calculate day quality ratios
  const dayAnalyzer = React.useMemo(() => new DayQualityAnalyzer(), []);
  const timeRangeRatios = React.useMemo(() => {
    return dayAnalyzer.calculateTimeRangeRatios(profileDailyLogs);
  }, [dayAnalyzer, profileDailyLogs]);
  const last7DayRatios = timeRangeRatios.last7Days;
  const last30DayRatios = timeRangeRatios.last30Days;

  // Check if logged today
  const today = new Date().toISOString().split('T')[0];
  const loggedToday = profileDailyLogs.some(l => l.logDate === today);

  useEffect(() => {
    if (!activeProfile) {
      navigation.replace('ProfilePicker');
    }
  }, [activeProfile, navigation]);

  if (!activeProfile || !stats) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.profileName}>{activeProfile.displayName}</Text>
            <View style={{ marginTop: spacing.sm }}>
              <EvidenceModeControls profileId={activeProfile.id} compact={true} />
            </View>
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
              title="Good Days"
              value={`${last7DayRatios.goodDayPercentage.toFixed(0)}%`}
              subtitle="Functional capacity"
              variant={
                last7DayRatios.goodDayPercentage >= 60 ? 'success' : 
                last7DayRatios.goodDayPercentage >= 30 ? 'warning' : 'error'
              }
            />
            <SummaryCard
              title="Bad Days"
              value={`${last7DayRatios.badDayPercentage.toFixed(0)}%`}
              subtitle="Limited function"
              variant={
                last7DayRatios.badDayPercentage >= 60 ? 'error' : 
                last7DayRatios.badDayPercentage >= 30 ? 'warning' : 'success'
              }
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

        {/* Day Quality Summary - Last 30 Days */}
        <View style={styles.dayQualitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last 30 Days - Functional Capacity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Trends')}>
              <Text style={styles.viewDetailsLink}>View Details →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.capacityBar}>
            <View style={styles.capacityBarTrack}>
              <View 
                style={[
                  styles.capacityBarFill,
                  {
                    width: `${last30DayRatios.goodDayPercentage}%`,
                    backgroundColor: 
                      last30DayRatios.goodDayPercentage >= 60 ? colors.successMain :
                      last30DayRatios.goodDayPercentage >= 30 ? colors.warningMain : colors.errorMain
                  }
                ]} 
              />
            </View>
            <Text style={styles.capacityBarLabel}>
              {last30DayRatios.goodDayPercentage.toFixed(0)}% Good Days
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.streakCard}>
              <Text style={styles.streakValue}>{last30DayRatios.worstStreak}</Text>
              <Text style={styles.streakLabel}>Worst Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <Text style={styles.streakValue}>{last30DayRatios.bestStreak}</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
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
            label="🎤 Voice Log Symptoms"
            onPress={() => navigation.navigate('VoiceLog')}
            variant="secondary"
            fullWidth
          />

          <BigButton
            label="View Symptom Trends"
            onPress={() => navigation.navigate('Trends')}
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
    borderLeftColor: colors.successMain,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.successMain,
  },
  editLink: {
    fontSize: typography.sizes.md,
    color: colors.primaryMain,
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
  dayQualitySection: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.gray50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailsLink: {
    fontSize: typography.sizes.sm,
    color: colors.primaryMain,
    fontWeight: typography.weights.semibold as any,
  },
  capacityBar: {
    gap: spacing.xs,
  },
  capacityBarTrack: {
    height: 32,
    backgroundColor: colors.gray200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 16,
  },
  capacityBarLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray700,
    textAlign: 'center',
  },
  streakCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  streakLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
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
