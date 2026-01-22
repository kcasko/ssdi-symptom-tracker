/**
 * Evidence PDF Export Service
 * Generates clean, lawyer-ready PDF reports with no styling, icons, or branding
 */

import { EvidenceReport } from './EvidenceReportBuilder';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Medication } from '../domain/models/Medication';
import { Appointment } from '../domain/models/Appointment';
import { useEvidenceModeStore } from '../state/evidenceModeStore';
import { getRevisionCount } from './EvidenceLogService';
import { calculateDaysDelayed, countInclusiveDays, findDateGaps } from '../utils/dates';
import { GapExplanation } from '../domain/models/GapExplanation';

/**
 * PDF export configuration
 */
export interface PDFExportConfig {
  appName: string;
  appVersion: string;
  includePageNumbers: boolean;
  fontSize: number;
  lineHeight: number;
}

const DEFAULT_CONFIG: PDFExportConfig = {
  appName: 'SSDI Symptom Tracker',
  appVersion: '1.0.0',
  includePageNumbers: true,
  fontSize: 11,
  lineHeight: 1.5,
};

/**
 * Generate plain text content for PDF
 * This is structured for clean PDF rendering with minimal formatting
 */
export function generatePlainTextReport(
  report: EvidenceReport,
  config: PDFExportConfig = DEFAULT_CONFIG
): string {
  const lines: string[] = [];

  // Header
  lines.push(config.appName);
  lines.push('Evidence Report');
  lines.push('');
  
  // Metadata
  lines.push('Report Information');
  lines.push('-'.repeat(80));
  lines.push(`Title: ${report.title}`);
  lines.push(`Generated: ${formatTimestamp(report.generatedAt)}`);
  lines.push(`Date Range: ${report.dateRange}`);
  lines.push(`Application Version: ${config.appVersion}`);
  lines.push('');
  lines.push('');

  // Executive Summary
  lines.push('Data Summary');
  lines.push('-'.repeat(80));
  lines.push(report.executiveSummary);
  lines.push('');
  lines.push(report.dataQualitySummary);
  lines.push('');
  lines.push('');

  // Symptom Narratives
  if (report.symptomNarratives.length > 0) {
    lines.push('Symptom Documentation');
    lines.push('-'.repeat(80));
    report.symptomNarratives.forEach((narrative, index) => {
      lines.push(`${index + 1}. ${narrative.symptomName}`);
      lines.push(`   ${narrative.frequencyStatement}`);
      lines.push(`   ${narrative.severityStatement}`);
      lines.push('');
    });
    lines.push('');
  }

  // Activity Narratives
  if (report.activityNarratives.length > 0) {
    lines.push('Activity Impact Documentation');
    lines.push('-'.repeat(80));
    report.activityNarratives.forEach((narrative, index) => {
      lines.push(`${index + 1}. ${narrative.activityName}`);
      lines.push(`   ${narrative.attemptStatement}`);
      lines.push(`   ${narrative.impactStatement}`);
      if (narrative.assistanceStatement) {
        lines.push(`   ${narrative.assistanceStatement}`);
      }
      lines.push('');
    });
    lines.push('');
  }

  // Functional Limitations
  if (report.functionalLimitations.length > 0) {
    lines.push('Functional Limitations by Domain');
    lines.push('-'.repeat(80));
    report.functionalLimitations.forEach((limitation, index) => {
      lines.push(`${index + 1}. ${limitation.domainLabel}`);
      lines.push(`   ${limitation.limitationStatement}`);
      if (limitation.affectedActivities.length > 0) {
        lines.push(`   Affected activities: ${limitation.affectedActivities.join(', ')}`);
      }
      lines.push('');
    });
    lines.push('');
  }

  // Revision Summary
  if (report.revisionSummary.hasRevisions) {
    lines.push('Revision History');
    lines.push('-'.repeat(80));
    lines.push(`Total revisions: ${report.revisionSummary.totalRevisions}`);
    lines.push('');
    report.revisionSummary.revisionStatements.forEach((statement, index) => {
      lines.push(`${index + 1}. ${statement}`);
    });
    lines.push('');
    lines.push('');
  }

  // Disclaimer
  lines.push('Disclaimer');
  lines.push('-'.repeat(80));
  lines.push(report.disclaimer);
  lines.push('');

  return lines.join('\n');
}

export interface StrictPDFPayload {
  title: string;
  profileName: string;
  dateRange: { start: string; end: string };
  exportDate: string;
  disclaimer: string;
  rawDailyLogs: DailyLog[];
  rawActivityLogs: ActivityLog[];
  medications: Medication[];
  appointments: Appointment[];
  gapExplanations?: GapExplanation[];
  summaries: {
    frequency?: string;
    activity?: string;
    limitations?: string;
  };
  analyses: {
    rfc?: string[];
    workImpact?: string[];
    consistency?: string[];
  };
  narratives: Array<{
    heading: string;
    paragraphs: string[];
    sourceDates: string[];
  }>;
}

/**
 * Generate structured data for PDF libraries
 * This returns a structured format that can be consumed by PDF generation libraries
 * like react-native-pdf, expo-print, or similar
 */
export interface PDFSection {
  type: 'heading' | 'subheading' | 'paragraph' | 'list' | 'divider';
  content: string | string[];
  level?: number;
}

export function generateStructuredPDFContent(report: EvidenceReport): PDFSection[] {
  const sections: PDFSection[] = [];

  // Header
  sections.push({ type: 'heading', content: 'Evidence Report', level: 1 });
  sections.push({ type: 'divider', content: '' });

  // Metadata
  sections.push({ type: 'subheading', content: 'Report Information', level: 2 });
  sections.push({ type: 'list', content: [
    `Title: ${report.title}`,
    `Generated: ${formatTimestamp(report.generatedAt)}`,
    `Date Range: ${report.dateRange}`,
  ]});

  // Executive Summary
  sections.push({ type: 'subheading', content: 'Data Summary', level: 2 });
  sections.push({ type: 'paragraph', content: report.executiveSummary });
  sections.push({ type: 'paragraph', content: report.dataQualitySummary });

  // Symptoms
  if (report.symptomNarratives.length > 0) {
    sections.push({ type: 'subheading', content: 'Symptom Documentation', level: 2 });
    report.symptomNarratives.forEach((narrative) => {
      sections.push({ type: 'subheading', content: narrative.symptomName, level: 3 });
      sections.push({ type: 'paragraph', content: narrative.frequencyStatement });
      sections.push({ type: 'paragraph', content: narrative.severityStatement });
    });
  }

  // Activities
  if (report.activityNarratives.length > 0) {
    sections.push({ type: 'subheading', content: 'Activity Impact Documentation', level: 2 });
    report.activityNarratives.forEach((narrative) => {
      sections.push({ type: 'subheading', content: narrative.activityName, level: 3 });
      sections.push({ type: 'paragraph', content: narrative.attemptStatement });
      sections.push({ type: 'paragraph', content: narrative.impactStatement });
      if (narrative.assistanceStatement) {
        sections.push({ type: 'paragraph', content: narrative.assistanceStatement });
      }
    });
  }

  // Functional Limitations
  if (report.functionalLimitations.length > 0) {
    sections.push({ type: 'subheading', content: 'Functional Limitations by Domain', level: 2 });
    report.functionalLimitations.forEach((limitation) => {
      sections.push({ type: 'subheading', content: limitation.domainLabel, level: 3 });
      sections.push({ type: 'paragraph', content: limitation.limitationStatement });
      if (limitation.affectedActivities.length > 0) {
        sections.push({ 
          type: 'paragraph', 
          content: `Affected activities: ${limitation.affectedActivities.join(', ')}` 
        });
      }
    });
  }

  // Revisions
  if (report.revisionSummary.hasRevisions) {
    sections.push({ type: 'subheading', content: 'Revision History', level: 2 });
    sections.push({ 
      type: 'paragraph', 
      content: `Total revisions: ${report.revisionSummary.totalRevisions}` 
    });
    sections.push({ type: 'list', content: report.revisionSummary.revisionStatements });
  }

  // Disclaimer
  sections.push({ type: 'subheading', content: 'Disclaimer', level: 2 });
  sections.push({ type: 'paragraph', content: report.disclaimer });

  return sections;
}

/**
 * Legacy PDF generator is intentionally disabled to prevent unsafe exports.
 * Use generateStrictPDFHtml instead.
 */
export function generateHTMLForPDF(): string {
  throw new Error('generateHTMLForPDF is deprecated. Use generateStrictPDFHtml.');
}

/**
 * Generate strict, ordered HTML for PDF rendering with clear separation of raw logs, summaries, analysis, and narrative.
 */
export function generateStrictPDFHtml(payload: StrictPDFPayload): string {
  const { title, profileName, dateRange, exportDate, disclaimer } = payload;

  const styles = `
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; margin: 1in; color: #000; }
    h1, h2, h3 { font-weight: bold; margin: 0 0 8pt 0; }
    h1 { font-size: 20pt; }
    h2 { font-size: 14pt; margin-top: 14pt; }
    h3 { font-size: 12pt; margin-top: 10pt; }
    p { margin: 6pt 0; }
    ul { margin: 4pt 0 8pt 16pt; }
    li { margin: 2pt 0; }
    .section-divider { border-top: 1px solid #000; margin: 12pt 0; }
    .footnote { font-size: 9pt; color: #333; }
  `;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const evidenceStore = useEvidenceModeStore.getState();
  const uniqueDates = (dates: string[]) => Array.from(new Set(dates)).sort();
  const listDates = (dates: string[]) => uniqueDates(dates).join(', ') || 'Not specified';

  const buildGapSegments = (dates: string[]) => {
    let segments = findDateGaps(dates, 4, payload.dateRange?.start, payload.dateRange?.end);

    if (segments.length === 0 && payload.dateRange && dates.length === 0) {
      const lengthDays = countInclusiveDays(payload.dateRange.start, payload.dateRange.end);
      if (lengthDays >= 4) {
        segments = [
          {
            startDate: payload.dateRange.start,
            endDate: payload.dateRange.end,
            lengthDays,
          },
        ];
      }
    }

    return segments.map(segment => {
      const explanation = payload.gapExplanations?.find(
        (g) => g.startDate === segment.startDate && g.endDate === segment.endDate
      );
      return {
        ...segment,
        hasExplanation: Boolean(explanation && explanation.note && explanation.note.trim().length > 0),
        note: explanation?.note || '',
      };
    });
  };

  const getLogMeta = (log: DailyLog | ActivityLog, eventDate: string) => {
    const created = log.createdAt ? new Date(log.createdAt).toISOString() : '';
    const updated = (log as any).updatedAt ? new Date((log as any).updatedAt).toISOString() : created;
    const evidenceTimestamp = (log as any).evidenceTimestamp
      ? new Date((log as any).evidenceTimestamp).toISOString()
      : '';
    const daysDelayed = calculateDaysDelayed(eventDate, log.createdAt || created);
    const finalized = evidenceStore.isLogFinalized(log.id) || Boolean((log as any).finalized);
    const revisionCount = getRevisionCount(log.id);
    const retrospectiveContext = (log as any).retrospectiveContext || {};
    const reason = retrospectiveContext.reason ? escapeHTML(retrospectiveContext.reason) : '';
    const note = retrospectiveContext.note ? escapeHTML(retrospectiveContext.note) : '';
    const flaggedAt = retrospectiveContext.flaggedAt
      ? new Date(retrospectiveContext.flaggedAt).toISOString()
      : '';
    const delayLabel =
      daysDelayed > 0
        ? `Logged ${daysDelayed} ${daysDelayed === 1 ? 'day' : 'days'} after event`
        : 'Logged same-day';
    const retrospectiveSummary =
      reason || note
        ? `Reason: ${reason || 'None'}; Note: ${note || 'None'}`
        : 'None provided';

    return {
      created,
      updated,
      evidenceTimestamp,
      daysDelayed,
      delayLabel,
      finalized,
      revisionCount,
      retrospectiveSummary,
      retrospectiveFlaggedAt: flaggedAt,
    };
  };

  const renderDailyLogs = () => {
    if (payload.rawDailyLogs.length === 0) return '<p>No daily symptom entries in this range.</p>';
    const sorted = [...payload.rawDailyLogs].sort((a, b) => a.logDate.localeCompare(b.logDate));
    const gaps = buildGapSegments(sorted.map((l) => l.logDate));
    let gapIndex = 0;
    const items: string[] = [];

    const pushGap = (gap: { startDate: string; endDate: string; lengthDays: number; hasExplanation: boolean; note: string }) => {
      items.push(
        `<li>[GAP] ${gap.startDate} to ${gap.endDate} (${gap.lengthDays} days); Explanation: ${
          gap.hasExplanation ? escapeHTML(gap.note || 'Provided') : 'None recorded'
        }</li>`
      );
    };

    sorted.forEach((log) => {
      while (gapIndex < gaps.length && gaps[gapIndex].endDate < log.logDate) {
        pushGap(gaps[gapIndex]);
        gapIndex++;
      }

      const symptoms = log.symptoms.map((s) => `${s.symptomId} (sev ${s.severity}${s.duration ? `, ${s.duration}m` : ''})`).join('; ');
      const meta = getLogMeta(log, log.logDate);
      const retrospectiveText = meta.retrospectiveFlaggedAt
        ? `${meta.retrospectiveSummary}; Flagged at: ${meta.retrospectiveFlaggedAt}`
        : meta.retrospectiveSummary;

      items.push(
        `<li>Event date (user-selected): ${escapeHTML(log.logDate)}; Record created timestamp (system): ${escapeHTML(meta.created || 'N/A')}; Last modified timestamp (system): ${escapeHTML(meta.updated || 'N/A')}; Evidence timestamp (system, immutable): ${escapeHTML(meta.evidenceTimestamp || 'None')}; Days delayed: ${meta.daysDelayed}; ${escapeHTML(meta.delayLabel)}; Finalized: ${meta.finalized ? 'Yes' : 'No'}; Revision count: ${meta.revisionCount}; Retrospective context: ${retrospectiveText}; Severity: ${log.overallSeverity}/10; Symptoms: ${escapeHTML(symptoms)}; Notes: ${escapeHTML(log.notes || 'None')}</li>`
      );
    });

    while (gapIndex < gaps.length) {
      pushGap(gaps[gapIndex]);
      gapIndex++;
    }

    return `<ul>${items.join('')}</ul>`;
  };

  const renderActivityLogs = () => {
    if (payload.rawActivityLogs.length === 0) return '<p>No activity logs in this range.</p>';
    const sorted = [...payload.rawActivityLogs].sort((a, b) => a.activityDate.localeCompare(b.activityDate));
    const gaps = buildGapSegments(sorted.map((l) => l.activityDate));
    let gapIndex = 0;
    const items: string[] = [];

    const pushGap = (gap: { startDate: string; endDate: string; lengthDays: number; hasExplanation: boolean; note: string }) => {
      items.push(
        `<li>[GAP] ${gap.startDate} to ${gap.endDate} (${gap.lengthDays} days); Explanation: ${
          gap.hasExplanation ? escapeHTML(gap.note || 'Provided') : 'None recorded'
        }</li>`
      );
    };

    sorted.forEach((log) => {
      while (gapIndex < gaps.length && gaps[gapIndex].endDate < log.activityDate) {
        pushGap(gaps[gapIndex]);
        gapIndex++;
      }

      const impact = log.immediateImpact?.overallImpact ?? 0;
      const recovery = log.recoveryDuration || 0;
      const meta = getLogMeta(log, log.activityDate);
      const retrospectiveText = meta.retrospectiveFlaggedAt
        ? `${meta.retrospectiveSummary}; Flagged at: ${meta.retrospectiveFlaggedAt}`
        : meta.retrospectiveSummary;

      items.push(
        `<li>Event date (user-selected): ${escapeHTML(log.activityDate)}; Record created timestamp (system): ${escapeHTML(meta.created || 'N/A')}; Last modified timestamp (system): ${escapeHTML(meta.updated || 'N/A')}; Evidence timestamp (system, immutable): ${escapeHTML(meta.evidenceTimestamp || 'None')}; Days delayed: ${meta.daysDelayed}; ${escapeHTML(meta.delayLabel)}; Finalized: ${meta.finalized ? 'Yes' : 'No'}; Revision count: ${meta.revisionCount}; Retrospective context: ${retrospectiveText}; Activity: ${escapeHTML(log.activityName)}; Duration (min): ${log.duration}; Impact ${impact}/10; Stopped early: ${log.stoppedEarly ? 'Yes' : 'No'}; Recovery (min): ${recovery}; Notes: ${escapeHTML(log.notes || 'None')}</li>`
      );
    });

    while (gapIndex < gaps.length) {
      pushGap(gaps[gapIndex]);
      gapIndex++;
    }

    return `<ul>${items.join('')}</ul>`;
  };

  const renderMeds = () => {
    if (!payload.medications || payload.medications.length === 0) return '<p>No medications recorded in this range.</p>';
    return `<ul>${payload.medications
      .map((med) => `<li>${escapeHTML(med.name || med.id || 'Medication')} — ${escapeHTML(med.dosage || '')} ${escapeHTML(med.frequency || '')}; Last modified: ${formatDate((med as any).updatedAt || (med as any).createdAt || exportDate)}</li>`)
      .join('')}</ul>`;
  };

  const renderAppointments = () => {
    if (!payload.appointments || payload.appointments.length === 0) return '<p>No appointments recorded in this range.</p>';
    const sorted = [...payload.appointments].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return `<ul>${sorted
      .map((appt) => `<li>${formatDate(appt.date)} — ${escapeHTML(appt.providerName || 'Provider')} (${escapeHTML(appt.purpose || 'Purpose not specified')}); Status: ${escapeHTML((appt as any).status || 'unknown')}; Last modified: ${formatDate((appt as any).updatedAt || (appt as any).createdAt || exportDate)}</li>`)
      .join('')}</ul>`;
  };

  const renderNarratives = () =>
    payload.narratives
      .map((narr) => {
        const footnote = `<p class="footnote">Draft narrative prepared from recorded entries; editable by user. Derived from entries dated ${escapeHTML(listDates(narr.sourceDates))}.</p>`;
        const paragraphs = narr.paragraphs.map((p) => `<p>${escapeHTML(p)}</p>`).join('');
        return `<h3>${escapeHTML(narr.heading)}</h3>${paragraphs}${footnote}`;
      })
      .join('');

  const renderStringArraySection = (label: string, items?: string[]) => {
    if (!items || items.length === 0) return `<p>${label}: Not provided.</p>`;
    return `<h3>${escapeHTML(label)}</h3><ul>${items.map((i) => `<li>${escapeHTML(i)}</li>`).join('')}</ul>`;
  };

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHTML(title)}</title>
    <style>${styles}</style>
  </head>
  <body>
    <h1>${escapeHTML(title)}</h1>
    <p><strong>Profile:</strong> ${escapeHTML(profileName || 'Not specified')}</p>
    <p><strong>Date Range:</strong> ${escapeHTML(formatDate(dateRange.start))} to ${escapeHTML(formatDate(dateRange.end))}</p>
    <p><strong>Exported:</strong> ${escapeHTML(formatDate(exportDate))}</p>
    <p><strong>Context:</strong> This document contains user-recorded symptom and activity information collected over time and organized for review.</p>
    <div class="section-divider"></div>

    <h2>Raw Logs</h2>
    <h3>Daily Symptom Entries</h3>
    ${renderDailyLogs()}
    <h3>Activity Logs</h3>
    ${renderActivityLogs()}
    <h3>Medications & Appointments</h3>
    ${renderMeds()}
    ${renderAppointments()}

    <div class="section-divider"></div>
    <h2>Summaries</h2>
    <p>${escapeHTML(payload.summaries.frequency || 'Frequency and pattern summaries: Not provided.')}</p>
    <p>${escapeHTML(payload.summaries.activity || 'Activity tolerance summaries: Not provided.')}</p>
    <p>${escapeHTML(payload.summaries.limitations || 'Functional limitations summaries: Not provided.')}</p>

    <div class="section-divider"></div>
    <h2>Analysis</h2>
    ${renderStringArraySection('RFC-style sections', payload.analyses.rfc)}
    ${renderStringArraySection('Work-impact analysis', payload.analyses.workImpact)}
    ${renderStringArraySection('Consistency indicators', payload.analyses.consistency)}

    <div class="section-divider"></div>
    <h2>Narrative Drafts</h2>
    ${renderNarratives()}

    <div class="section-divider"></div>
    <h2>Disclaimer</h2>
    <p>${escapeHTML(disclaimer || 'Draft narrative prepared from recorded entries; editable by user. This document assists review and does not make legal or medical determinations.')}</p>
  </body>
  </html>
  `;

  return html;
}

/**
 * Helper: Format timestamp
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper: Escape HTML
 */
function escapeHTML(text: string): string {
  const textarea = document?.createElement?.('textarea');
  if (textarea) {
    textarea.textContent = text;
    return textarea.innerHTML;
  }
  // Fallback for environments without DOM
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
