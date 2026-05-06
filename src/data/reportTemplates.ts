/**
 * Report Templates
 * Structured templates for health tracking reports
 */

import { ReportType, SectionType } from '../domain/models/ReportDraft';

export interface ReportTemplate {
  type: ReportType;
  title: string;
  description: string;
  sections: SectionTemplate[];
  estimatedLength: string;
  useCase: string;
}

export interface SectionTemplate {
  type: SectionType;
  title: string;
  description: string;
  required: boolean;
  order: number;
  contentHints: string[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: 'daily_summary',
    title: 'Daily Symptom Summary',
    description: 'Concise summary of daily symptom patterns for a date range',
    estimatedLength: '1-2 pages',
    useCase: 'Quick overview for medical appointments or initial documentation',
    sections: [
      {
        type: 'header',
        title: 'Report Header',
        description: 'Date range and summary information',
        required: true,
        order: 1,
        contentHints: ['Date range', 'Number of log entries', 'Reporting period'],
      },
      {
        type: 'summary',
        title: 'Executive Summary',
        description: 'High-level overview of symptom patterns',
        required: true,
        order: 2,
        contentHints: ['Average severity', 'Most common symptoms', 'Key patterns'],
      },
      {
        type: 'daily_symptoms',
        title: 'Daily Symptom Patterns',
        description: 'Day-by-day symptom breakdown',
        required: true,
        order: 3,
        contentHints: ['Severity by day', 'Symptom frequency', 'Time of day patterns'],
      },
      {
        type: 'patterns',
        title: 'Identified Patterns',
        description: 'Recurring patterns and triggers',
        required: false,
        order: 4,
        contentHints: ['Triggers', 'Weather correlations', 'Weekly patterns'],
      },
    ],
  },

  {
    type: 'activity_impact',
    title: 'Activity Impact Summary',
    description: 'Detailed analysis of how activities affect symptoms and function',
    estimatedLength: '2-3 pages',
    useCase: 'Reviewing activity tolerance and symptom changes',
    sections: [
      {
        type: 'header',
        title: 'Report Header',
        description: 'Activity logging period and scope',
        required: true,
        order: 1,
        contentHints: ['Date range', 'Number of activities logged', 'Activity categories'],
      },
      {
        type: 'activity_impact',
        title: 'Activity Impact Analysis',
        description: 'How specific activities affect symptoms',
        required: true,
        order: 2,
        contentHints: ['Duration limits', 'Severity increases', 'Recovery times'],
      },
      {
        type: 'functional_limitations',
        title: 'Activity Tolerance',
        description: 'What activities were logged and how long they lasted',
        required: true,
        order: 3,
        contentHints: ['Sitting tolerance', 'Standing limits', 'Physical exertion capacity'],
      },
      {
        type: 'patterns',
        title: 'Activity Patterns',
        description: 'Patterns in activity tolerance and recovery',
        required: true,
        order: 4,
        contentHints: ['Time of day effects', 'Cumulative impact', 'Recovery patterns'],
      },
      {
        type: 'narrative',
        title: 'Activity Notes Summary',
        description: 'Plain-language summary of activity impact',
        required: false,
        order: 5,
        contentHints: ['Daily activity impact', 'Recovery patterns', 'Helpful supports'],
      },
    ],
  },

  {
    type: 'functional_limitations',
    title: 'Capacity Limits Summary',
    description: 'Summary of logged capacity limits',
    estimatedLength: '2-4 pages',
    useCase: 'Preparing appointment notes or personal summaries',
    sections: [
      {
        type: 'header',
        title: 'Summary Overview',
        description: 'Scope of the logged capacity limits',
        required: true,
        order: 1,
        contentHints: ['Assessment period', 'Evaluation methods', 'Data sources'],
      },
      {
        type: 'functional_limitations',
        title: 'Physical Limitations',
        description: 'Sitting, standing, walking, lifting limitations',
        required: true,
        order: 2,
        contentHints: ['Sitting duration', 'Standing tolerance', 'Walking distance', 'Weight restrictions'],
      },
      {
        type: 'functional_limitations',
        title: 'Cognitive Limitations',
        description: 'Concentration, memory, and cognitive function',
        required: true,
        order: 3,
        contentHints: ['Attention span', 'Memory issues', 'Task completion ability'],
      },
      {
        type: 'functional_limitations',
        title: 'Social and Self-Care Limitations',
        description: 'Social functioning and personal care abilities',
        required: false,
        order: 4,
        contentHints: ['Social interaction capacity', 'Personal care needs', 'Independence level'],
      },
      {
        type: 'narrative',
        title: 'Limit Summary',
        description: 'Overall capacity limit summary',
        required: true,
        order: 5,
        contentHints: ['Common limits', 'Helpful supports', 'Variability'],
      },
    ],
  },

  {
    type: 'full_narrative',
    title: 'Health Summary Report',
    description: 'Comprehensive summary of symptoms, activities, medications, and appointments',
    estimatedLength: '4-8 pages',
    useCase: 'Personal review or appointment preparation',
    sections: [
      {
        type: 'header',
        title: 'Health Summary',
        description: 'Complete report header with all identifying information',
        required: true,
        order: 1,
        contentHints: ['Full date range', 'Conditions covered', 'Data sources'],
      },
      {
        type: 'summary',
        title: 'Overview',
        description: 'Summary of logged health patterns',
        required: true,
        order: 2,
        contentHints: ['Primary limitations', 'Severity overview', 'Functional impact'],
      },
      {
        type: 'daily_symptoms',
        title: 'Symptom Summary',
        description: 'Detailed symptom patterns and severity',
        required: true,
        order: 3,
        contentHints: ['Frequency', 'Severity patterns', 'Consistency', 'Variability'],
      },
      {
        type: 'activity_impact',
        title: 'Activity Impact',
        description: 'Impact of activities on symptoms',
        required: true,
        order: 4,
        contentHints: ['Sitting capacity', 'Standing limits', 'Physical exertion', 'Cognitive demands'],
      },
      {
        type: 'day_quality',
        title: 'Day Quality',
        description: 'Impact band ratios based on logged severity',
        required: true,
        order: 5,
        contentHints: ['Lower-impact day percentage', 'Higher-impact day percentage', 'Recent trends'],
      },
      {
        type: 'functional_limitations',
        title: 'Capacity Limits',
        description: 'Summary of logged capacity limits',
        required: true,
        order: 6,
        contentHints: ['Physical limits', 'Cognitive limits', 'Environmental factors'],
      },
      {
        type: 'medications',
        title: 'Treatment History',
        description: 'Medications and treatments tried',
        required: false,
        order: 7,
        contentHints: ['Current medications', 'Effectiveness', 'Side effects', 'Treatment compliance'],
      },
      {
        type: 'appointments',
        title: 'Medical Care',
        description: 'Medical appointments and professional opinions',
        required: false,
        order: 8,
        contentHints: ['Provider visits', 'Specialist consultations', 'Treatment recommendations'],
      },
      {
        type: 'narrative',
        title: 'Daily Function Summary',
        description: 'Plain-language summary of daily symptom impact',
        required: true,
        order: 9,
        contentHints: ['Symptoms', 'Activity impact', 'Capacity limits', 'Helpful supports'],
      },
    ],
  },
];

/**
 * Get template by report type
 */
export function getReportTemplate(type: ReportType): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.type === type);
}

/**
 * Get sections for a report type
 */
export function getTemplateSections(type: ReportType): SectionTemplate[] {
  const template = getReportTemplate(type);
  return template?.sections || [];
}

/**
 * Get required sections for a report type
 */
export function getRequiredSections(type: ReportType): SectionTemplate[] {
  return getTemplateSections(type).filter((s) => s.required);
}

/**
 * Get optional sections for a report type
 */
export function getOptionalSections(type: ReportType): SectionTemplate[] {
  return getTemplateSections(type).filter((s) => !s.required);
}

// Standard phrases for different report sections
export const SECTION_PHRASES = {
  header: {
    openings: [
      'This report covers the period from',
      'Documentation period:',
      'Symptom tracking report for',
      'Health summary covering',
    ],
    closings: [
      'Based on patient-reported data collected daily',
      'Information compiled from systematic symptom tracking',
      'Data represents patient self-assessment over time',
    ],
  },

  summary: {
    openings: [
      'Over the reporting period, the patient experienced',
      'Summary of symptoms and limits during',
      'Key findings from the assessment period include',
      'Primary patterns observed:',
    ],
    patterns: [
      'Consistent patterns include',
      'Notable trends observed',
      'Recurring limitations identified',
      'Primary capacity limits',
    ],
  },

  daily_symptoms: {
    frequency: [
      'Symptoms were reported on X out of Y days',
      'Daily logging compliance: X%',
      'Symptom frequency during period',
      'Days with significant symptoms',
    ],
    severity: [
      'Average symptom severity',
      'Peak severity levels reached',
      'Severity distribution over time',
      'Moderate to severe symptoms occurred',
    ],
  },

  activity_impact: {
    limitations: [
      'Activity tolerance is limited to',
      'Activity tolerance affected by',
      'Activity duration limited to approximately',
      'Physical exertion tolerance',
    ],
    consequences: [
      'Exceeding tolerance results in',
      'Activity-induced symptoms include',
      'Recovery time typically requires',
      'Activity impact includes',
    ],
  },

  functional_limitations: {
    assessments: [
      'Sitting tolerance limited to',
      'Standing capacity restricted to',
      'Walking distance limited by',
      'Lifting restricted due to',
      'Concentration span limited to',
    ],
    variability: [
      'Limitations are consistent',
      'Variability noted in capacity limits',
      'Impact bands reported',
      'Unpredictable functional variations',
    ],
  },

  narrative: {
    daily_capacity: [
      'Based on logged entries, daily activity impact includes',
      'Logged capacity limits include',
      'Symptoms were associated with',
      'Daily function notes include',
    ],
    supports: [
      'Helpful modifications include',
      'Routine adjustments include',
      'Environmental limits noted',
      'Functional supports needed',
    ],
  },
} as const;

/**
 * Get appropriate opening phrase for a section
 */
export function getSectionOpening(sectionType: SectionType): string {
  const phrases = SECTION_PHRASES[sectionType as keyof typeof SECTION_PHRASES];
  if (phrases && 'openings' in phrases) {
    return phrases.openings[0];
  }
  return 'This section covers';
}

/**
 * Get content hints for a section
 */
export function getSectionHints(sectionType: SectionType): string[] {
  const template = REPORT_TEMPLATES
    .flatMap(t => t.sections)
    .find(s => s.type === sectionType);
  
  return template?.contentHints || [];
}
