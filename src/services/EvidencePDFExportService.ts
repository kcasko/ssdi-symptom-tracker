/**
 * Evidence PDF Export Service
 * Generates clean, lawyer-ready PDF reports with no styling, icons, or branding
 */

import { EvidenceReport, FunctionalLimitationNarrative } from './EvidenceReportBuilder';

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
 * Generate HTML for PDF rendering
 * Clean HTML with minimal styling for consistent PDF output
 */
export function generateHTMLForPDF(
  report: EvidenceReport,
  config: PDFExportConfig = DEFAULT_CONFIG
): string {
  const sections = generateStructuredPDFContent(report);
  
  const styles = `
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: ${config.fontSize}pt;
      line-height: ${config.lineHeight};
      margin: 1in;
      color: #000000;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 12pt;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 6pt;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    p {
      margin: 6pt 0;
      text-align: justify;
    }
    ul {
      margin: 6pt 0;
      padding-left: 24pt;
    }
    li {
      margin: 3pt 0;
    }
    hr {
      border: none;
      border-top: 1px solid #000000;
      margin: 12pt 0;
    }
  `;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>${styles}</style>
</head>
<body>
`;

  sections.forEach((section) => {
    switch (section.type) {
      case 'heading':
        html += `<h${section.level || 1}>${escapeHTML(section.content as string)}</h${section.level || 1}>\n`;
        break;
      case 'subheading':
        html += `<h${section.level || 2}>${escapeHTML(section.content as string)}</h${section.level || 2}>\n`;
        break;
      case 'paragraph':
        html += `<p>${escapeHTML(section.content as string)}</p>\n`;
        break;
      case 'list':
        html += '<ul>\n';
        (section.content as string[]).forEach((item) => {
          html += `  <li>${escapeHTML(item)}</li>\n`;
        });
        html += '</ul>\n';
        break;
      case 'divider':
        html += '<hr>\n';
        break;
    }
  });

  html += `
</body>
</html>`;

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
  const div = { textContent: text } as any;
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
