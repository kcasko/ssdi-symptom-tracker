/**
 * Dashboard Screen
 * Main hub showing today's status and navigation to functions
 *
 * Design Philosophy:
 * - Today's status is the primary visual element
 * - No streaks, progress bars, or trend implications
 * - Factual data presentation without judgment
 * - Clear hierarchy: status > actions > reference info
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton, SummaryCard, EvidenceModeControls } from '../components';
import { useAppState } from '../state/useAppState';
import { AnalysisService } from '../services';
import { calculateDaysDelayed, getDaysBetween, addDays, parseDate } from '../utils/dates';
import { getRevisionCount } from '../services/EvidenceLogService';

type DashboardProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<DashboardProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, activityLogs, limitations } = useAppState();
  const [today, setToday] = useState(() => new Date().toISOString().split('T')[0]);
  const [showRecordDetails, setShowRecordDetails] = useState(false);

  // Refresh the date when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setToday(new Date().toISOString().split('T')[0]);
    }, [])
  );

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

  // Get stats
  const stats = activeProfile ? AnalysisService.getQuickStats(
    profileDailyLogs,
    profileActivityLogs,
    profileLimitations
  ) : null;

  const sortedLogs = React.useMemo(
    () => [...profileDailyLogs].sort((a, b) => b.logDate.localeCompare(a.logDate)),
    [profileDailyLogs]
  );
  const latestLog = sortedLogs[0];

  const latestLogMeta = React.useMemo(() => {
    if (!latestLog) return null;
    const createdIso = latestLog.createdAt ? new Date(latestLog.createdAt).toISOString() : 'Not recorded';
    const updatedIso = (latestLog as any).updatedAt
      ? new Date((latestLog as any).updatedAt).toISOString()
      : createdIso;
    const daysDelayed = calculateDaysDelayed(latestLog.logDate, latestLog.createdAt || createdIso);
    const delayLabel =
      daysDelayed > 0
        ? `Logged ${daysDelayed} ${daysDelayed === 1 ? 'day' : 'days'} after event`
        : 'Logged same-day';
    const revisionCount = getRevisionCount(latestLog.id);
    const finalized = Boolean((latestLog as any).finalized);

    return {
      eventDate: latestLog.logDate,
      createdIso,
      updatedIso,
      daysDelayed,
      delayLabel,
      revisionCount,
      finalized,
    };
  }, [latestLog]);

  // Gap calculation
  const gapSummary = React.useMemo(() => {
    if (sortedLogs.length === 0) {
      return { daysMissed: 0, longestGap: 0, lastGapRange: null as null | { start: string; end: string } };
    }

    let daysMissed = 0;
    let longestGap = 0;
    let lastGapRange: { start: string; end: string } | null = null;

    for (let i = 1; i < sortedLogs.length; i++) {
      const current = sortedLogs[i - 1].logDate;
      const previous = sortedLogs[i].logDate;
      const gap = Math.max(0, getDaysBetween(previous, current) - 1);
      if (gap > 0) {
        daysMissed += gap;
        if (gap > longestGap) {
          longestGap = gap;
          const start = addDays(parseDate(previous) || new Date(previous), 1).toISOString().split('T')[0];
          const end = addDays(parseDate(current) || new Date(current), -1).toISOString().split('T')[0];
          lastGapRange = { start, end };
        }
      }
    }

    return { daysMissed, longestGap, lastGapRange };
  }, [sortedLogs]);

  // Check if logged today
  const loggedToday = profileDailyLogs.some(l => l.logDate === today);

  // Calculate days logged in last 7 and 30 days
  const last7DaysLogged = React.useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];
    return profileDailyLogs.filter(l => l.logDate >= cutoff).length;
  }, [profileDailyLogs]);

  const last30DaysLogged = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
    return profileDailyLogs.filter(l => l.logDate >= cutoff).length;
  }, [profileDailyLogs]);

  React.useEffect(() => {
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
          <View style={styles.headerContent}>
            <Text style={styles.profileName}>{activeProfile.name}</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings"
          >
            <Text style={styles.settingsIcon}>&#x2699;</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Status - Primary Focus */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today</Text>
          {loggedToday ? (
            <View style={styles.statusCard}>
              <View style={styles.statusContent}>
                <Text style={styles.statusIndicator}>&#x25CF;</Text>
                <Text style={styles.statusText}>Entry recorded</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('DailyLog')}
                style={styles.modifyButton}
              >
                <Text style={styles.modifyLink}>View / Modify</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noEntryCard}>
              <Text style={styles.noEntryText}>No entry for today</Text>
              <BigButton
                label={profileDailyLogs.length === 0 ? "Create First Entry" : "Log Today"}
                onPress={() => navigation.navigate('DailyLog')}
                variant="primary"
                fullWidth
              />
            </View>
          )}
        </View>

        {/* Evidence Mode Controls */}
        <View style={styles.evidenceSection}>
          <EvidenceModeControls profileId={activeProfile.id} compact={true} />
        </View>

        {/* Quick Counts - Factual, No Judgment */}
        <View style={styles.countsSection}>
          <Text style={styles.sectionTitle}>Record Counts</Text>
          <View style={styles.countsGrid}>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{last7DaysLogged}</Text>
              <Text style={styles.countLabel}>Entries (7 days)</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{last30DaysLogged}</Text>
              <Text style={styles.countLabel}>Entries (30 days)</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{stats.allTime.totalLogs}</Text>
              <Text style={styles.countLabel}>Total entries</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{gapSummary.daysMissed}</Text>
              <Text style={styles.countLabel}>Days not logged</Text>
            </View>
          </View>
        </View>

        {/* Functions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Functions</Text>

          <View style={styles.actionItem}>
            <BigButton
              label="Log Activity Impact"
              onPress={() => navigation.navigate('ActivityLog')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Record how an activity affected you</Text>
          </View>

          <View style={styles.actionItem}>
            <BigButton
              label="Voice Entry"
              onPress={() => navigation.navigate('VoiceLog')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Alternative input method</Text>
          </View>

          <View style={styles.actionItem}>
            <BigButton
              label="View History"
              onPress={() => navigation.navigate('Trends')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Browse logged entries by date</Text>
          </View>

          <View style={styles.actionItem}>
            <BigButton
              label="Update Limitations"
              onPress={() => navigation.navigate('Limitations')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Track functional limitations</Text>
          </View>

          <View style={styles.actionItem}>
            <BigButton
              label="Medications and Appointments"
              onPress={() => navigation.navigate('MedsAppointments')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Treatment records</Text>
          </View>

          <View style={styles.actionItem}>
            <BigButton
              label="Reports"
              onPress={() => navigation.navigate('Reports')}
              variant="secondary"
              fullWidth
            />
            <Text style={styles.actionHelper}>Export records</Text>
          </View>
        </View>

        {/* Record Details - Collapsible */}
        <View style={styles.detailsSection}>
          <TouchableOpacity
            style={styles.detailsHeader}
            onPress={() => setShowRecordDetails(!showRecordDetails)}
            accessibilityLabel={showRecordDetails ? "Hide record details" : "Show record details"}
          >
            <Text style={styles.sectionTitle}>Record Details</Text>
            <Text style={styles.expandIcon}>{showRecordDetails ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showRecordDetails && (
            <View style={styles.detailsContent}>
              {latestLogMeta && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Latest Entry</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Event date</Text>
                    <Text style={styles.detailValue}>{latestLogMeta.eventDate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Record created</Text>
                    <Text style={styles.detailValue}>{latestLogMeta.createdIso.split('T')[0]}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Entry timing</Text>
                    <Text style={styles.detailValue}>{latestLogMeta.delayLabel}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Revisions</Text>
                    <Text style={styles.detailValue}>{latestLogMeta.revisionCount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Finalized</Text>
                    <Text style={styles.detailValue}>{latestLogMeta.finalized ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Gap Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total unlogged days</Text>
                  <Text style={styles.detailValue}>{gapSummary.daysMissed}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Longest gap</Text>
                  <Text style={styles.detailValue}>{gapSummary.longestGap} days</Text>
                </View>
                {gapSummary.lastGapRange && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Longest gap dates</Text>
                    <Text style={styles.detailValue}>
                      {gapSummary.lastGapRange.start} to {gapSummary.lastGapRange.end}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Data Summary</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Daily logs</Text>
                  <Text style={styles.detailValue}>{stats.allTime.totalLogs}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unique symptoms logged</Text>
                  <Text style={styles.detailValue}>{stats.allTime.totalSymptoms}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Active limitations</Text>
                  <Text style={styles.detailValue}>{stats.allTime.totalLimitations}</Text>
                </View>
              </View>
            </View>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    ...typography.headlineLarge,
    color: colors.gray900,
  },
  dateText: {
    ...typography.bodyMedium,
    color: colors.gray600,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.gray700,
  },

  // Today's Status Section
  todaySection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.gray900,
  },
  statusCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryMain,
    borderWidth: 1,
    borderColor: colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    fontSize: 12,
    color: colors.primaryMain,
  },
  statusText: {
    ...typography.bodyLarge,
    color: colors.gray900,
    fontWeight: typography.weights.medium,
  },
  modifyButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  modifyLink: {
    ...typography.bodyMedium,
    color: colors.primaryMain,
    fontWeight: typography.weights.semibold,
  },
  noEntryCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  noEntryText: {
    ...typography.bodyMedium,
    color: colors.gray600,
    textAlign: 'center',
  },

  // Evidence Section
  evidenceSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Counts Section
  countsSection: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.gray50,
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countValue: {
    ...typography.numeric,
    color: colors.gray900,
  },
  countLabel: {
    ...typography.labelSmall,
    color: colors.gray600,
    textAlign: 'center',
  },

  // Actions Section
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionItem: {
    gap: spacing.xs,
  },
  actionHelper: {
    ...typography.bodySmall,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },

  // Details Section
  detailsSection: {
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 20,
    color: colors.primaryMain,
    fontWeight: typography.weights.bold,
  },
  detailsContent: {
    gap: spacing.md,
  },
  detailCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
  },
  detailCardTitle: {
    ...typography.titleSmall,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.gray600,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.gray900,
    fontWeight: typography.weights.medium,
  },
});
