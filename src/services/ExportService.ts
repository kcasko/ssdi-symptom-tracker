/**
 * Export Service
 * Handles PDF and CSV export functionality for reports and data
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Medication } from '../domain/models/Medication';
import { Limitation } from '../domain/models/Limitation';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';
import { useEvidenceModeStore } from '../state/evidenceModeStore';
import { getRevisionCount } from './EvidenceLogService';
import { calculateDaysDelayed } from '../utils/dates';
import { Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dataType: 'daily-logs' | 'activity-logs' | 'medications' | 'all';
  dateRange?: { start: string; end: string };
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  static async exportToCSV(
    dataType: 'daily-logs' | 'activity-logs' | 'medications' | 'limitations',
    data: any[],
    filename: string
  ): Promise<void> {
    try {
      let csvContent = '';

      switch (dataType) {
        case 'daily-logs':
          csvContent = this.dailyLogsToCSV(data as DailyLog[]);
          break;
        case 'activity-logs':
          csvContent = this.activityLogsToCSV(data as ActivityLog[]);
          break;
        case 'medications':
          csvContent = this.medicationsToCSV(data as Medication[]);
          break;
        case 'limitations':
          csvContent = this.limitationsToCSV(data as Limitation[]);
          break;
      }

      await this.saveAndShareFile(csvContent, filename, 'text/csv');
    } catch (error) {
      console.error('Export to CSV failed:', error);
      Alert.alert('Export Failed', 'Could not export data to CSV');
      throw error;
    }
  }

  /**
   * Export data to JSON format
   */
  static async exportToJSON(data: any, filename: string): Promise<void> {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      await this.saveAndShareFile(jsonContent, filename, 'application/json');
    } catch (error) {
      console.error('Export to JSON failed:', error);
      Alert.alert('Export Failed', 'Could not export data to JSON');
      throw error;
    }
  }

  /**
   * Export report to simplified text format (for PDF/print)
   */
  static async exportReportToText(
    reportContent: string,
    filename: string
  ): Promise<void> {
    try {
      await this.saveAndShareFile(reportContent, filename, 'text/plain');
    } catch (error) {
      console.error('Export report failed:', error);
      Alert.alert('Export Failed', 'Could not export report');
      throw error;
    }
  }

  /**
   * Export report to PDF using HTML content
   */
  static async exportReportToPDF(
    htmlContent: string,
    filename: string
  ): Promise<void> {
    try {
      const printResult = await Print.printToFileAsync({ html: htmlContent });
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(printResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Share.share({
          message: filename,
          title: filename,
          url: printResult.uri,
        });
      }
    } catch (error) {
      console.error('Export report PDF failed:', error);
      Alert.alert('Export Failed', 'Could not export report');
      throw error;
    }
  }

  /**
   * Save file and share using native share dialog
   */
  private static async saveAndShareFile(
    content: string,
    filename: string,
    mimeType: string
  ): Promise<void> {
    try {
      // Create file URI
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share file
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Export Data',
          UTI: mimeType,
        });
      } else {
        // Fallback to basic share (iOS/Android)
        await Share.share({
          message: content,
          title: filename,
        });
      }
    } catch (error) {
      console.error('Failed to save and share file:', error);
      throw error;
    }
  }

  /**
   * Format ISO timestamp safely
   */
  private static toIsoString(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }

  /**
   * Gather consistent temporal metadata for logs
   */
  private static getLogMetadata(log: DailyLog | ActivityLog, eventDate: string) {
    const evidenceStore = useEvidenceModeStore.getState();
    const createdIso = this.toIsoString(log.createdAt);
    const updatedIso = this.toIsoString((log as any).updatedAt || log.createdAt);
    const evidenceIso = this.toIsoString((log as any).evidenceTimestamp);
    const daysDelayed = calculateDaysDelayed(eventDate, log.createdAt);
    const finalized = evidenceStore.isLogFinalized(log.id) || Boolean((log as any).finalized);
    const revisionCount = getRevisionCount(log.id);
    const retrospectiveContext = (log as any).retrospectiveContext || {};

    return {
      createdIso,
      updatedIso,
      evidenceIso,
      daysDelayed,
      finalized,
      revisionCount,
      retrospectiveReason: retrospectiveContext.reason || '',
      retrospectiveNote: retrospectiveContext.note || '',
      retrospectiveFlaggedAt: retrospectiveContext.flaggedAt
        ? this.toIsoString(retrospectiveContext.flaggedAt)
        : '',
    };
  }

  /**
   * Convert daily logs to CSV
   */
  private static dailyLogsToCSV(logs: DailyLog[]): string {
    const headers = [
      'Event_Date',
      'Created_DateTime',
      'Last_Modified_DateTime',
      'Evidence_Timestamp',
      'Days_Delayed',
      'Finalized',
      'Revision_Count',
      'Retrospective_Reason',
      'Retrospective_Note',
      'Retrospective_FlaggedAt',
      'Overall_Severity',
      'Symptoms',
      'Symptom_Details',
      'Triggers',
      'Weather',
      'Stress_Level',
      'Sleep_Quality',
      'Notes',
    ];

    const rows = logs
      .sort((a, b) => a.logDate.localeCompare(b.logDate))
      .map(log => {
        const symptoms = log.symptoms
          .map(s => {
            const symptomDef = getSymptomById(s.symptomId);
            return symptomDef?.name || s.symptomId;
          })
          .join('; ');

        const symptomDetails = log.symptoms
          .map(s => {
            const symptomDef = getSymptomById(s.symptomId);
            return `${symptomDef?.name || s.symptomId} (${s.severity}/10)`;
          })
          .join('; ');

        const meta = this.getLogMetadata(log, log.logDate);

        return [
          log.logDate,
          meta.createdIso,
          meta.updatedIso,
          meta.evidenceIso,
          meta.daysDelayed,
          meta.finalized ? 'Yes' : 'No',
          meta.revisionCount,
          this.escapeCSV(meta.retrospectiveReason),
          this.escapeCSV(meta.retrospectiveNote),
          meta.retrospectiveFlaggedAt,
          log.overallSeverity,
          this.escapeCSV(symptoms),
          this.escapeCSV(symptomDetails),
          this.escapeCSV(log.triggers?.join('; ') || ''),
          log.environmentalFactors?.weather || '',
          log.environmentalFactors?.stressLevel || '',
          log.sleepQuality?.quality || '',
          this.escapeCSV(log.notes || ''),
        ];
      });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert activity logs to CSV
   */
  private static activityLogsToCSV(logs: ActivityLog[]): string {
    const headers = [
      'Event_Date',
      'Created_DateTime',
      'Last_Modified_DateTime',
      'Evidence_Timestamp',
      'Days_Delayed',
      'Finalized',
      'Revision_Count',
      'Retrospective_Reason',
      'Retrospective_Note',
      'Retrospective_FlaggedAt',
      'Activity_Name',
      'Duration_Minutes',
      'Stopped_Early',
      'Immediate_Impact',
      'Delayed_Impact',
      'Notes',
    ];

    const rows = logs
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
      .map(log => {
        const activityDef = getActivityById(log.activityId);
        const meta = this.getLogMetadata(log, log.activityDate);
        const immediateImpactScore = log.immediateImpact?.overallImpact ?? 0;
        const delayedImpactScore = log.delayedImpact ? `${log.delayedImpact.overallImpact}/10` : '';

        return [
          log.activityDate,
          meta.createdIso,
          meta.updatedIso,
          meta.evidenceIso,
          meta.daysDelayed,
          meta.finalized ? 'Yes' : 'No',
          meta.revisionCount,
          this.escapeCSV(meta.retrospectiveReason),
          this.escapeCSV(meta.retrospectiveNote),
          meta.retrospectiveFlaggedAt,
          activityDef?.name || log.activityName,
          log.duration,
          log.stoppedEarly ? 'Yes' : 'No',
          `${immediateImpactScore}/10`,
          delayedImpactScore,
          this.escapeCSV(log.notes || ''),
        ];
      });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert medications to CSV
   */
  private static medicationsToCSV(medications: Medication[]): string {
    const headers = [
      'Name',
      'Generic Name',
      'Dosage',
      'Frequency',
      'Purpose',
      'Start Date',
      'End Date',
      'Active',
      'Effectiveness',
      'Side Effects',
      'Prescriber',
      'Notes',
    ];

    const rows = medications.map(med => [
      med.name,
      med.genericName || '',
      med.dosage,
      med.frequency,
      med.purpose.join('; '),
      med.startDate || '',
      med.endDate || '',
      med.isActive ? 'Yes' : 'No',
      med.effectiveness || '',
      med.sideEffects?.join('; ') || '',
      med.prescriber || '',
      this.escapeCSV(med.notes || ''),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert limitations to CSV
   */
  private static limitationsToCSV(limitations: Limitation[]): string {
    const headers = [
      'Category',
      'Frequency',
      'Variability',
      'Active',
      'Notes',
    ];

    const rows = limitations.map(lim => [
      lim.category,
      lim.frequency,
      lim.variability,
      lim.isActive ? 'Yes' : 'No',
      this.escapeCSV(lim.notes || ''),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Escape CSV values
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Export comprehensive data package
   */
  static async exportAllData(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    medications: Medication[],
    limitations: Limitation[]
  ): Promise<void> {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        dailyLogs,
        activityLogs,
        medications,
        limitations,
      };

      const filename = this.generateFilename('symptom_tracker_backup', 'json');
      await this.exportToJSON(data, filename);
    } catch (error) {
      console.error('Export all data failed:', error);
      Alert.alert('Export Failed', 'Could not export all data');
      throw error;
    }
  }
}
