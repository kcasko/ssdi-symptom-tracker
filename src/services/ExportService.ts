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
import { calculateDaysDelayed, countInclusiveDays, findDateGaps } from '../utils/dates';
import { GapExplanation } from '../domain/models/GapExplanation';
import { Share, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import Constants from 'expo-constants';

const EXPORT_VERSION = 'Daymark Evidence-Hardened v1.0';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dataType: 'daily-logs' | 'activity-logs' | 'medications' | 'all';
  dateRange?: { start: string; end: string };
}

export interface ExportContextOptions {
  gapExplanations?: GapExplanation[];
  dateRange?: { start: string; end: string };
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  static async exportToCSV(
    dataType: 'daily-logs' | 'activity-logs' | 'medications' | 'limitations',
    data: any[],
    filename: string,
    context?: ExportContextOptions
  ): Promise<void> {
    try {
      let csvContent = '';

      switch (dataType) {
        case 'daily-logs':
          csvContent = this.dailyLogsToCSV(data as DailyLog[], context);
          break;
        case 'activity-logs':
          csvContent = this.activityLogsToCSV(data as ActivityLog[], context);
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

  private static buildGapSegments(
    dates: string[],
    gapExplanations?: GapExplanation[],
    dateRange?: { start: string; end: string }
  ) {
    let segments = findDateGaps(dates, 4, dateRange?.start, dateRange?.end);

    if (segments.length === 0 && dateRange?.start && dateRange?.end && dates.length === 0) {
      const lengthDays = countInclusiveDays(dateRange.start, dateRange.end);
      if (lengthDays >= 4) {
        segments = [
          {
            startDate: dateRange.start,
            endDate: dateRange.end,
            lengthDays,
          },
        ];
      }
    }

    return segments.map(segment => {
      const explanation = gapExplanations?.find(
        (g) => g.startDate === segment.startDate && g.endDate === segment.endDate
      );

      return {
        ...segment,
        explanationNote: explanation?.note || '',
        hasExplanation: Boolean(explanation && explanation.note && explanation.note.trim().length > 0),
      };
    });
  }

  private static calculateSeverityMetrics(values: number[]) {
    const valid = (values || []).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (valid.length === 0) {
      return null;
    }

    const sorted = [...valid].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;
    const median =
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;
    const variance =
      count === 0 ? 0 : sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const bandCounts = {
      '0-3': sorted.filter((v) => v >= 0 && v <= 3).length,
      '4-6': sorted.filter((v) => v >= 4 && v <= 6).length,
      '7-8': sorted.filter((v) => v >= 7 && v <= 8).length,
      '9-10': sorted.filter((v) => v >= 9 && v <= 10).length,
    };

    const digitFrequency: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) {
      digitFrequency[String(i)] = sorted.filter((v) => Math.round(v) === i).length;
    }

    return {
      count,
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      range,
      stdDev: Number(stdDev.toFixed(2)),
      min,
      max,
      bandCounts,
      digitFrequency,
    };
  }

  private static appendSeveritySummaryRows(rows: string[][], headers: string[], metrics: ReturnType<typeof this.calculateSeverityMetrics>, label: string) {
    if (!metrics) return;
    const blankRow = () => new Array(headers.length).fill('');
    const pushRow = (metricLabel: string, value: string) => {
      const row = blankRow();
      row[0] = 'SUMMARY';
      row[1] = `${label} - ${metricLabel}`;
      row[2] = value;
      rows.push(row);
    };

    pushRow('Mean', metrics.mean.toString());
    pushRow('Median', metrics.median.toString());
    pushRow('Range', metrics.range.toString());
    pushRow('Std Dev', metrics.stdDev.toString());
    pushRow('Min', metrics.min.toString());
    pushRow('Max', metrics.max.toString());
    Object.entries(metrics.bandCounts).forEach(([band, count]) => {
      pushRow(`Band ${band} count`, String(count));
    });
    Object.entries(metrics.digitFrequency).forEach(([digit, count]) => {
      pushRow(`Digit ${digit} count`, String(count));
    });
  }

  private static appendVersionRow(rows: string[][], headers: string[]) {
    const row = new Array(headers.length).fill('');
    row[0] = 'Generated_By';
    row[1] = EXPORT_VERSION;
    rows.push(row);
  }

  /**
   * Generate metadata header rows for exports
   */
  private static generateMetadataHeaders(
    dataType: 'daily-logs' | 'activity-logs' | 'medications' | 'limitations',
    data: any[],
    context?: ExportContextOptions
  ): string[][] {
    const now = new Date();
    const metadata: string[][] = [
      ['METADATA_SECTION', ''],
      ['Export_Generated', now.toISOString()],
      ['Export_Generated_Local', now.toLocaleString()],
      ['Application_Version', EXPORT_VERSION],
      ['App_Version_Number', Constants.expoConfig?.version || 'unknown'],
      ['Device_OS', Platform.OS],
      ['Device_OS_Version', Platform.Version?.toString() || 'unknown'],
      ['Device_Platform', Platform.select({ ios: 'iOS', android: 'Android', default: 'Other' })],
      ['Record_Count', data.length.toString()],
      [''],
    ];

    // Add data quality flags for daily/activity logs
    if (dataType === 'daily-logs' || dataType === 'activity-logs') {
      const logs = data as (DailyLog | ActivityLog)[];
      const backdatedCount = logs.filter(log => {
        const eventDate = (log as DailyLog).logDate || (log as ActivityLog).activityDate;
        const delayed = calculateDaysDelayed(eventDate, log.createdAt);
        return delayed > 7;
      }).length;

      const finalizedCount = logs.filter(log => {
        const evidenceStore = useEvidenceModeStore.getState();
        return evidenceStore.isLogFinalized(log.id) || Boolean((log as any).finalized);
      }).length;

      const revisedCount = logs.filter(log => getRevisionCount(log.id) > 0).length;

      // Calculate gap statistics
      const sortedDates = [...logs]
        .map(log => (log as DailyLog).logDate || (log as ActivityLog).activityDate)
        .sort();
      const gapSegments = this.buildGapSegments(
        sortedDates,
        context?.gapExplanations,
        context?.dateRange
      );
      const unexplainedGaps = gapSegments.filter(g => !g.hasExplanation).length;
      const totalGapDays = gapSegments.reduce((sum, g) => sum + g.lengthDays, 0);

      metadata.push(
        ['DATA_QUALITY_FLAGS', ''],
        ['Backdated_Entries_Over_7_Days', backdatedCount.toString()],
        ['Finalized_Entries', finalizedCount.toString()],
        ['Entries_With_Revisions', revisedCount.toString()],
        ['Unexplained_Gaps_Over_4_Days', unexplainedGaps.toString()],
        ['Total_Gap_Days', totalGapDays.toString()],
        ['Total_Gap_Segments', gapSegments.length.toString()],
        ['']
      );
    }

    if (context?.dateRange) {
      metadata.push(
        ['Date_Range_Filter', `${context.dateRange.start} to ${context.dateRange.end}`],
        ['']
      );
    }

    metadata.push(
      ['DATA_SECTION_BEGINS_BELOW', ''],
      ['']
    );

    return metadata;
  }

  /**
   * Convert daily logs to CSV
   */
  private static dailyLogsToCSV(logs: DailyLog[], context?: ExportContextOptions): string {
    const metadataRows = this.generateMetadataHeaders('daily-logs', logs, context);
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
      'Gap_Length_Days',
      'Gap_Date_Range',
      'Gap_Explanation_Provided',
      'Gap_Explanation_Note',
      'Overall_Severity',
      'Symptoms',
      'Symptom_Details',
      'Triggers',
      'Weather',
      'Stress_Level',
      'Sleep_Quality',
      'Notes',
    ];

    const sortedLogs = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate));
    const gapSegments = this.buildGapSegments(
      sortedLogs.map(l => l.logDate),
      context?.gapExplanations,
      context?.dateRange
    );
    let gapIndex = 0;
    const rows: string[][] = [];

    const pushGapRowsBefore = (currentDate: string) => {
      while (gapIndex < gapSegments.length && gapSegments[gapIndex].endDate < currentDate) {
        const gap = gapSegments[gapIndex];
        rows.push([
          'GAP',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          gap.lengthDays.toString(),
          `${gap.startDate} to ${gap.endDate}`,
          gap.hasExplanation ? 'Yes' : 'No',
          this.escapeCSV(gap.explanationNote || ''),
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ]);
        gapIndex++;
      }
    };

    sortedLogs.forEach(log => {
      pushGapRowsBefore(log.logDate);
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

      rows.push([
        log.logDate,
        meta.createdIso,
        meta.updatedIso,
        meta.evidenceIso,
        String(meta.daysDelayed),
        meta.finalized ? 'Yes' : 'No',
        String(meta.revisionCount),
        this.escapeCSV(meta.retrospectiveReason),
        this.escapeCSV(meta.retrospectiveNote),
        meta.retrospectiveFlaggedAt,
        '',
        '',
        '',
        '',
        String(log.overallSeverity),
        this.escapeCSV(symptoms),
        this.escapeCSV(symptomDetails),
        this.escapeCSV(log.triggers?.join('; ') || ''),
        String(log.environmentalFactors?.weather || ''),
        String(log.environmentalFactors?.stressLevel || ''),
        String(log.sleepQuality?.quality || ''),
        this.escapeCSV(log.notes || ''),
      ]);
    });

    pushGapRowsBefore('9999-12-31');

    const severityMetrics = this.calculateSeverityMetrics(sortedLogs.map((l) => l.overallSeverity));
    this.appendSeveritySummaryRows(rows, headers, severityMetrics, 'Overall Severity');
    this.appendVersionRow(rows, headers);

    return [...metadataRows, headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert activity logs to CSV
   */
  private static activityLogsToCSV(logs: ActivityLog[], context?: ExportContextOptions): string {
    const metadataRows = this.generateMetadataHeaders('activity-logs', logs, context);
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
      'Gap_Length_Days',
      'Gap_Date_Range',
      'Gap_Explanation_Provided',
      'Gap_Explanation_Note',
      'Activity_Name',
      'Duration_Minutes',
      'Stopped_Early',
      'Immediate_Impact',
      'Delayed_Impact',
      'Notes',
    ];

    const sortedLogs = [...logs].sort((a, b) => a.activityDate.localeCompare(b.activityDate));
    const gapSegments = this.buildGapSegments(
      sortedLogs.map(l => l.activityDate),
      context?.gapExplanations,
      context?.dateRange
    );
    let gapIndex = 0;
    const rows: string[][] = [];

    const pushGapRowsBefore = (currentDate: string) => {
      while (gapIndex < gapSegments.length && gapSegments[gapIndex].endDate < currentDate) {
        const gap = gapSegments[gapIndex];
        rows.push([
          'GAP',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          gap.lengthDays.toString(),
          `${gap.startDate} to ${gap.endDate}`,
          gap.hasExplanation ? 'Yes' : 'No',
          this.escapeCSV(gap.explanationNote || ''),
          '',
          '',
          '',
          '',
          '',
          '',
        ]);
        gapIndex++;
      }
    };

    sortedLogs.forEach(log => {
      pushGapRowsBefore(log.activityDate);
      const activityDef = getActivityById(log.activityId);
      const meta = this.getLogMetadata(log, log.activityDate);
      const immediateImpactScore = log.immediateImpact?.overallImpact;
      const immediateImpactDisplay = immediateImpactScore === undefined ? '' : `${immediateImpactScore}/10`;
      const delayedImpactScore = log.delayedImpact ? `${log.delayedImpact.overallImpact}/10` : '';

      rows.push([
        log.activityDate,
        meta.createdIso,
        meta.updatedIso,
        meta.evidenceIso,
        String(meta.daysDelayed),
        meta.finalized ? 'Yes' : 'No',
        String(meta.revisionCount),
        this.escapeCSV(meta.retrospectiveReason),
        this.escapeCSV(meta.retrospectiveNote),
        meta.retrospectiveFlaggedAt,
        '',
        '',
        '',
        '',
        activityDef?.name || log.activityName,
        String(log.duration),
        log.stoppedEarly ? 'Yes' : 'No',
        immediateImpactDisplay,
        delayedImpactScore,
        this.escapeCSV(log.notes || ''),
      ]);
    });

    pushGapRowsBefore('9999-12-31');

    const severityMetrics = this.calculateSeverityMetrics(
      sortedLogs
        .map((l) => l.immediateImpact?.overallImpact)
        .filter((v): v is number => typeof v === 'number')
    );
    this.appendSeveritySummaryRows(rows, headers, severityMetrics, 'Impact Severity');
    this.appendVersionRow(rows, headers);

    return [...metadataRows, headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert medications to CSV
   */
  private static medicationsToCSV(medications: Medication[]): string {
    const metadataRows = this.generateMetadataHeaders('medications', medications);
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

    this.appendVersionRow(rows, headers);

    return [...metadataRows, headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert limitations to CSV
   */
  private static limitationsToCSV(limitations: Limitation[]): string {
    const metadataRows = this.generateMetadataHeaders('limitations', limitations);
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

    this.appendVersionRow(rows, headers);

    return [...metadataRows, headers, ...rows].map(row => row.join(',')).join('\n');
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
