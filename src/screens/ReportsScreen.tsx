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
import { BigButton, DateRangePicker, SubmissionPackBuilder } from '../components';
import { useAppState } from '../state/useAppState';
import { ReportService, ExportService, BackupRestoreService } from '../services';
import { formatDate, DISPLAY_DATE_SHORT } from '../utils/dates';

type ReportsProps = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export const ReportsScreen: React.FC<ReportsProps> = ({ navigation }) => {
  const {
    activeProfile,
    dailyLogs,
    activityLogs,
    limitations,
    medications,
    appointments,
    reportDrafts,
    addReportDraft,
    updateReportDraft,
    photos,
    profiles,
    settings,
    gapExplanations,
  } = useAppState();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const profileReports = reportDrafts.filter((r) => r.profileId === activeProfile?.id);

  const profileGapExplanations = gapExplanations.filter((g) => g.profileId === activeProfile?.id);

  const handleExportData = async (type: 'daily-logs' | 'activity-logs' | 'medications' | 'limitations' | 'all') => {
    if (!activeProfile) return;

    setExporting(true);
    try {
      if (type === 'all') {
        await ExportService.exportAllData(
          dailyLogs.filter(l => l.profileId === activeProfile.id),
          activityLogs.filter(l => l.profileId === activeProfile.id),
          medications.filter(m => m.profileId === activeProfile.id),
          limitations.filter(l => l.profileId === activeProfile.id)
        );
      } else if (type === 'daily-logs') {
        const filename = ExportService.generateFilename('daily_logs', 'csv');
        await ExportService.exportToCSV(
          'daily-logs',
          dailyLogs.filter(l => l.profileId === activeProfile.id),
          filename,
          { gapExplanations: profileGapExplanations, dateRange: { start: startDate, end: endDate } }
        );
      } else if (type === 'activity-logs') {
        const filename = ExportService.generateFilename('activity_logs', 'csv');
        await ExportService.exportToCSV(
          'activity-logs',
          activityLogs.filter(l => l.profileId === activeProfile.id),
          filename,
          { gapExplanations: profileGapExplanations, dateRange: { start: startDate, end: endDate } }
        );
      } else if (type === 'medications') {
        const filename = ExportService.generateFilename('medications', 'csv');
        await ExportService.exportToCSV(
          'medications',
          medications.filter(m => m.profileId === activeProfile.id),
          filename
        );
      } else if (type === 'limitations') {
        const filename = ExportService.generateFilename('limitations', 'csv');
        await ExportService.exportToCSV(
          'limitations',
          limitations.filter(l => l.profileId === activeProfile.id),
          filename
        );
      }
      Alert.alert('Success', 'Data exported successfully');
    } catch {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!activeProfile) return;

    setGenerating(true);
    try {
      const profileLogs = dailyLogs.filter((l) => l.profileId === activeProfile.id);
      const profileActivities = activityLogs.filter((l) => l.profileId === activeProfile.id);
      const profileLimitations = limitations.filter((l) => l.profileId === activeProfile.id);

      // First create an empty draft
      const draftId = await addReportDraft(
        'SSDI Full Report',
        'full_narrative',
        { start: startDate, end: endDate }
      );
      
      if (!draftId) {
        throw new Error('Failed to create report draft');
      }

      // Generate the full report content
      const generatedDraft = await ReportService.generateReportDraft(
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

      // Update the draft with generated content
      const draftWithGeneratedContent = {
        ...generatedDraft,
        id: draftId, // Keep the original ID from the created draft
      };
      
      await updateReportDraft(draftWithGeneratedContent);
      
      Alert.alert('Success', 'Report generated successfully', [
        { text: 'View', onPress: () => navigation.navigate('ReportEditor', { reportId: draftId }) },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!activeProfile) return;

    setBackingUp(true);
    try {
      await BackupRestoreService.createBackup({
        profiles,
        dailyLogs,
        activityLogs,
        limitations,
        medications,
        appointments,
        reportDrafts,
        photos,
        settings,
      });

      Alert.alert(
        'Backup Created',
        'Your data has been backed up successfully. Save this file to a secure location.',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      'Restore from Backup',
      'This will restore data from a backup file. Current data will be merged with backup data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Backup',
          onPress: async () => {
            const backup = await BackupRestoreService.selectBackupFile();
            if (backup) {
              Alert.alert(
                'Confirm Restore',
                `Restore ${backup.profiles.length} profiles and ${backup.dailyLogs.length + backup.activityLogs.length} logs?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Restore', onPress: () => performRestore(backup) },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const performRestore = async (backup: any) => {
    try {
      const result = await BackupRestoreService.restoreFromBackup(backup, {
        mergeWithExisting: true,
      });

      if (result.success) {
        Alert.alert(
          'Restore Complete',
          `Restored ${result.profilesRestored} profiles and ${result.logsRestored} logs.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      } else {
        Alert.alert('Restore Failed', result.errors.join('\n'));
      }
    } catch {
      Alert.alert('Error', 'Failed to restore backup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Summaries of your logged data</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Data Backup & Restore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Backup & Restore</Text>
          <Text style={styles.sectionDescription}>
            Create backups of all your data and restore from previous backups
          </Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={handleCreateBackup}
              disabled={backingUp}
            >
              <Text style={styles.exportButtonText}>
                {backingUp ? 'Creating Backup...' : 'Create Full Backup'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={handleRestoreBackup}
            >
              <Text style={styles.exportButtonText}>Restore from Backup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={() => handleExportData('daily-logs')}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>Daily Logs (CSV)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={() => handleExportData('activity-logs')}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>Activities (CSV)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={() => handleExportData('medications')}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>Medications (CSV)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={() => handleExportData('all')}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>Full Backup (JSON)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Record Submission Packs */}
        {activeProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Record Submission Packs</Text>
            <Text style={styles.sectionDescription}>
              Generate comprehensive record packages for review
            </Text>
            <SubmissionPackBuilder profileId={activeProfile.id} appVersion="1.0.0" />
          </View>
        )}

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
              <Text style={styles.emptyText}>No reports saved</Text>
              <Text style={styles.emptySubtext}>No reports in this date range.</Text>
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
                      {formatDate(report.dateRange.start, DISPLAY_DATE_SHORT)} - {formatDate(report.dateRange.end, DISPLAY_DATE_SHORT)}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {stats.totalSections} sections - {stats.totalWords} words
                    </Text>
                    <Text style={styles.reportMeta}>
                      Last edited {formatDate(report.updatedAt, DISPLAY_DATE_SHORT)}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>{'>'}</Text>
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
    backgroundColor: colors.background.secondary,
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
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
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
    borderRadius: 4,
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
    color: colors.primaryMain,
  },
  credibilitySection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  credibilityCard: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryMain,
  },
  credibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  credibilityLabel: {
    fontSize: typography.sizes.md,
    color: colors.gray700,
    fontWeight: typography.weights.bold as any,
  },
  credibilityIndicators: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: typography.sizes.md,
    color: colors.gray700,
  },
  indicatorValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.primaryMain,
  },
  recommendationsSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 4,
  },
  recommendationsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  recommendationText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  exportButtons: {
    gap: spacing.sm,
  },
  exportButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryMain,
    borderRadius: 4,
    padding: spacing.md,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.primaryMain,
  },
});
