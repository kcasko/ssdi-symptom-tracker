/**
 * Report Templates
 * Structured templates for different types of SSDI reports
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
    useCase: 'Work capacity evaluation and functional assessment',
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
        title: 'Functional Capacity',
        description: 'What activities can be performed and for how long',
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
        title: 'Functional Narrative',
        description: 'SSDI-appropriate functional capacity narrative',
        required: false,
        order: 5,
        contentHints: ['Work capacity implications', 'ADL impacts', 'Accommodation needs'],
      },
    ],
  },

  {
    type: 'functional_limitations',
    title: 'Functional Limitations Assessment',
    description: 'Comprehensive assessment of baseline functional limitations',
    estimatedLength: '2-4 pages',
    useCase: 'RFC (Residual Functional Capacity) documentation',
    sections: [
      {
        type: 'header',
        title: 'Assessment Overview',
        description: 'Scope and methodology of limitation assessment',
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
        title: 'Limitation Summary',
        description: 'Overall functional capacity assessment',
        required: true,
        order: 5,
        contentHints: ['Work capacity category', 'Accommodation needs', 'Prognosis'],
      },
    ],
  },

  {
    type: 'full_narrative',
    title: 'Complete SSDI Documentation',
    description: 'Comprehensive report including all aspects for SSDI application',
    estimatedLength: '4-8 pages',
    useCase: 'Complete SSDI disability application documentation',
    sections: [
      {
        type: 'header',
        title: 'Medical and Functional Report',
        description: 'Complete report header with all identifying information',
        required: true,
        order: 1,
        contentHints: ['Full date range', 'Conditions covered', 'Data sources'],
      },
      {
        type: 'summary',
        title: 'Disability Summary',
        description: 'Executive summary of disability impact',
        required: true,
        order: 2,
        contentHints: ['Primary limitations', 'Severity overview', 'Functional impact'],
      },
      {
        type: 'daily_symptoms',
        title: 'Symptom Documentation',
        description: 'Detailed symptom patterns and severity',
        required: true,
        order: 3,
        contentHints: ['Frequency', 'Severity patterns', 'Consistency', 'Variability'],
      },
      {
        type: 'activity_impact',
        title: 'Activity and Work Capacity',
        description: 'Impact of symptoms on work-related activities',
        required: true,
        order: 4,
        contentHints: ['Sitting capacity', 'Standing limits', 'Physical exertion', 'Cognitive demands'],
      },
      {
        type: 'day_quality',
        title: 'Day Quality and Functional Capacity Analysis',
        description: 'Good/bad day ratios showing consistent functional limitations',
        required: true,
        order: 5,
        contentHints: ['Good day percentage', 'Bad day percentage', 'Functional capacity trends', 'SSDI implications'],
      },
      {
        type: 'functional_limitations',
        title: 'Residual Functional Capacity',
        description: 'Comprehensive RFC assessment',
        required: true,
        order: 6,
        contentHints: ['Physical RFC', 'Mental RFC', 'Environmental limitations'],
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
        title: 'Disability Determination Narrative',
        description: 'Complete narrative for disability determination',
        required: true,
        order: 9,
        contentHints: ['Meets listing criteria', 'RFC limitations', 'Work capacity', 'Accommodations'],
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
      'Functional assessment covering',
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
      'Summary of functional limitations during',
      'Key findings from the assessment period include',
      'Primary functional impacts observed:',
    ],
    patterns: [
      'Consistent patterns include',
      'Notable trends observed',
      'Recurring limitations identified',
      'Primary functional restrictions',
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
      'Functional capacity restricted by',
      'Activity duration limited to approximately',
      'Physical exertion tolerance',
    ],
    consequences: [
      'Exceeding tolerance results in',
      'Activity-induced symptoms include',
      'Recovery time typically requires',
      'Functional impact includes',
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
      'Variability noted in functional capacity',
      'Good days and bad days reported',
      'Unpredictable functional variations',
    ],
  },

  narrative: {
    work_capacity: [
      'Based on functional limitations, work capacity is',
      'Residual functional capacity assessment indicates',
      'Ability to perform sustained work activity is',
      'Work-related functional limitations include',
    ],
    accommodations: [
      'Reasonable accommodations would need to include',
      'Workplace modifications required',
      'Environmental restrictions necessary',
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