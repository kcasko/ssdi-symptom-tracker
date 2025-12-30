/**
 * Reports Screen
 * View and generate reports
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton, DateRangePicker, SummaryCard } from '../components';
import { useAppState } from '../state/useAppState';
import { ReportService } from '../services';
import { formatDateShort } from '../utils/dates';

type ReportsProps = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export const ReportsScreen: React.FC<ReportsProps> = ({ navigation }) => {
  const { activeProfile, dailyLogs, activityLogs, limitations, reportDrafts, addReportDraft } =
    useAppState();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  const profileReports = reportDrafts.filter((r) => r.profileId === activeProfile?.id);

  const handleGenerateReport = async () => {
    if (!activeProfile) return;

    setGenerating(true);
    try {
      const profileLogs = dailyLogs.filter((l) => l.profileId === activeProfile.id);
      const profileActivities = activityLogs.filter((l) => l.profileId === activeProfile.id);
      const profileLimitations = limitations.filter((l) => l.profileId === activeProfile.id);

      const draft = await ReportService.generateReportDraft(
        {
          profileId: activeProfile.id,
          dateRange: { start: startDate, end: endDate },
          templateId: 'full_narrative',
          includeSections: [],
        },
        profileLogs,
        profileActivities,
        profileLimitations
      );

      addReportDraft(draft);
      Alert.alert('Success', 'Report generated', [
        { text: 'View', onPress: () => navigation.navigate('ReportEditor', { reportId: draft.id }) },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Generate SSDI documentation</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate New Report</Text>
          
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          <BigButton
            label={generating ? 'Generating...' : 'Generate Full Report'}
            onPress={handleGenerateReport}
            variant="primary"
            fullWidth
            disabled={generating}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Reports ({profileReports.length})</Text>

          {profileReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubtext}>Generate your first report above</Text>
            </View>
          ) : (
            profileReports.map((report) => {
              const stats = ReportService.getReportStats(report);
              return (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => navigation.navigate('ReportEditor', { reportId: report.id })}
                >
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.reportType}</Text>
                    <Text style={styles.reportMeta}>
                      {formatDateShort(report.dateRange.start)} - {formatDateShort(report.dateRange.end)}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {stats.totalSections} sections • {stats.totalWords} words
                    </Text>
                    <Text style={styles.reportMeta}>
                      Last edited {formatDateShort(report.lastModified)}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray600,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  reportInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  reportTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  reportMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  arrow: {
    fontSize: typography.sizes.xl,
    color: colors.primary,
  },
});
