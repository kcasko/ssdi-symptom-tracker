/**
 * ReportDraft Model
 * Editable report drafts that preserve links to source evidence
 */

export interface ReportDraft {
  id: string;
  profileId: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Report metadata
  title: string;
  reportType: ReportType;
  
  // Date range covered
  dateRange: {
    start: string;
    end: string;
  };
  
  // Report sections - ordered
  sections: ReportSection[];
  
  // Source references - what data this report was generated from
  sourceReferences: SourceReference[];
  
  // Generation metadata
  generatedAt: string;
  lastRegeneratedAt?: string;
  
  // Export history
  exports: ExportRecord[];
  
  // Status
  status: ReportStatus;
  
  // Notes about this draft
  draftNotes?: string;
}

export type ReportType =
  | 'daily_summary'
  | 'activity_impact'
  | 'functional_limitations'
  | 'full_narrative';

export type ReportStatus =
  | 'draft'
  | 'in_review'
  | 'finalized'
  | 'exported';

export interface ReportSection {
  id: string;
  
  // Section type for regeneration
  sectionType: SectionType;
  
  // Display title
  title: string;
  
  // Order in report (for reordering)
  order: number;
  
  // Content blocks
  blocks: TextBlock[];
  
  // Is this section included in export?
  included: boolean;
  
  // Has user edited this section?
  userEdited: boolean;
  
  // Source data IDs for this section
  sourceIds: string[];
}

export type SectionType =
  | 'header'
  | 'summary'
  | 'daily_symptoms'
  | 'activity_impact'
  | 'functional_limitations'
  | 'medications'
  | 'appointments'
  | 'patterns'
  | 'narrative'
  | 'custom';

export interface TextBlock {
  id: string;
  
  // Block type
  type: BlockType;
  
  // The text content (editable)
  content: string;
  
  // Original generated content (for comparison/reset)
  originalContent: string;
  
  // Has this block been edited?
  edited: boolean;
  
  // Source log ID if this block came from specific log
  sourceLogId?: string;
  sourceLogType?: 'daily' | 'activity' | 'limitation';
  
  // Order within section
  order: number;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_point'
  | 'quote'
  | 'date_entry'
  | 'statistic';

export interface SourceReference {
  type: 'daily_log' | 'activity_log' | 'limitation' | 'medication' | 'appointment';
  id: string;
  date?: string;
}

export interface ExportRecord {
  exportedAt: string;
  format: 'text' | 'pdf';
  filename?: string;
}

/**
 * Create a new report draft
 */
export function createReportDraft(
  id: string,
  profileId: string,
  title: string,
  reportType: ReportType,
  dateRange: { start: string; end: string }
): ReportDraft {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    title,
    reportType,
    dateRange,
    sections: [],
    sourceReferences: [],
    generatedAt: now,
    exports: [],
    status: 'draft',
  };
}

/**
 * Create a new section
 */
export function createSection(
  id: string,
  sectionType: SectionType,
  title: string,
  order: number
): ReportSection {
  return {
    id,
    sectionType,
    title,
    order,
    blocks: [],
    included: true,
    userEdited: false,
    sourceIds: [],
  };
}

/**
 * Create a new text block
 */
export function createTextBlock(
  id: string,
  type: BlockType,
  content: string,
  order: number,
  sourceLogId?: string,
  sourceLogType?: 'daily' | 'activity' | 'limitation'
): TextBlock {
  return {
    id,
    type,
    content,
    originalContent: content,
    edited: false,
    sourceLogId,
    sourceLogType,
    order,
  };
}

/**
 * Check if draft has been edited
 */
export function isDraftEdited(draft: ReportDraft): boolean {
  return draft.sections.some((s) => s.userEdited || s.blocks.some((b) => b.edited));
}

/**
 * Get report type display label
 */
export function getReportTypeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    daily_summary: 'Daily Summary',
    activity_impact: 'Activity Impact Summary',
    functional_limitations: 'Functional Limitations Summary',
    full_narrative: 'Full SSDI Narrative',
  };
  return labels[type] || type;
}
