/**
 * Report Service
 * Coordinates report generation, drafts, and exports
 */

import { 
  ReportDraft, 
  ReportSection,
  ReportType,
  TextBlock,
  BlockType,
  createReportDraft, 
  SourceReference 
} from '../domain/models/ReportDraft';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { AnalysisService } from './AnalysisService';
import { NarrativeService } from './NarrativeService';
import { PatternDetector } from '../engine/PatternDetector';
import { getReportTemplate } from '../data/reportTemplates';
import { generateId } from '../utils/ids';

export interface ReportGenerationOptions {
  profileId: string;
  dateRange: { start: string; end: string };
  templateId: string;
  includeSections: string[];
}

/**
 * Parse narrative text into TextBlock array
 * Converts string content into structured blocks for editing
 */
function parseNarrativeToBlocks(content: string, sourceLogId?: string): TextBlock[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const blocks: TextBlock[] = [];
  const lines = content.split('\n');
  let order = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed.length === 0) continue;

    let blockType: BlockType = 'paragraph';
    let blockContent = trimmed;

    // Detect block types based on patterns
    if (trimmed.startsWith('# ')) {
      blockType = 'heading';
      blockContent = trimmed.substring(2);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      blockType = 'bullet_point';
      blockContent = trimmed.substring(2);
    } else if (trimmed.startsWith('> ')) {
      blockType = 'quote';
      blockContent = trimmed.substring(2);
    } else if (/^\d+%/.test(trimmed) || /\d+\s+(days?|times?|hours?)/.test(trimmed)) {
      blockType = 'statistic';
    } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed)) {
      blockType = 'date_entry';
    }

    blocks.push({
      id: generateId(),
      type: blockType,
      content: blockContent,
      originalContent: blockContent,
      edited: false,
      order: order++,
      sourceLogId,
    });
  }

  return blocks;
}

export interface ReportExportOptions {
  format: 'text' | 'pdf';
  includeMetadata: boolean;
  includeSourceReferences: boolean;
}

export class ReportService {
  /**
   * Generate a new report draft
   */
  static async generateReportDraft(
    options: ReportGenerationOptions,
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): Promise<ReportDraft> {
    // Run comprehensive analysis
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _analysis = await AnalysisService.runComprehensiveAnalysis(
      dailyLogs,
      activityLogs,
      limitations,
      options.dateRange
    );

    // Detect patterns
    const symptomPatterns = PatternDetector.analyzeSymptomPatterns(dailyLogs);
    const activityPatterns = PatternDetector.analyzeActivityPatterns(activityLogs);
    const triggers = PatternDetector.analyzeTriggerPatterns(dailyLogs);
    const recovery = PatternDetector.analyzeRecoveryPatterns(activityLogs);

    // Generate narrative
    const narrative = await NarrativeService.generateFullNarrative(
      dailyLogs,
      activityLogs,
      limitations,
      symptomPatterns,
      activityPatterns,
      triggers,
      recovery,
      options.dateRange
    );

    // Get template
    const template = getReportTemplate(options.templateId as ReportType);
    if (!template) {
      throw new Error(`Template not found: ${options.templateId}`);
    }

    // Create sections based on template
    const sections: ReportSection[] = template.sections.map((sectionTemplate, index) => {
      let content = '';

      // Map template sections to narrative sections
      switch (sectionTemplate.type) {
        case 'header': {
          // Generate a header with date range, profile, and log counts
          const logCount = dailyLogs.length;
          const activityCount = activityLogs.length;
          const limitationCount = limitations.length;
          content = `Report for profile: ${options.profileId}\nDate range: ${options.dateRange.start} to ${options.dateRange.end}\nEntries: ${logCount} daily logs, ${activityCount} activity logs, ${limitationCount} limitations.`;
          break;
        }
        case 'summary':
          content = narrative.sections.overview || 'No overview data available for the selected date range.';
          break;
        case 'daily_symptoms':
          content = narrative.sections.symptoms || 'No symptom data recorded during this period.';
          break;
        case 'activity_impact':
          content = narrative.sections.activities || 'No activity data recorded during this period.';
          break;
        case 'functional_limitations':
          content = narrative.sections.limitations || 'No limitation data recorded.';
          break;
        case 'patterns':
          content = narrative.sections.patterns || 'Insufficient data to determine patterns.';
          break;
        case 'day_quality':
          content = narrative.sections.dayQuality || 'Insufficient data to assess day quality ratios.';
          break;
        case 'narrative':
          content = narrative.sections.rfc || 'Unable to assess residual functional capacity without data.';
          break;
        default:
          content = 'Content not available.';
      }

      // Parse narrative content into blocks
      const blocks = parseNarrativeToBlocks(content);

      return {
        id: generateId(),
        sectionType: sectionTemplate.type,
        title: sectionTemplate.title,
        order: index,
        blocks,
        included: sectionTemplate.required,
        userEdited: false,
        sourceIds: [],
      };
    });

    // Filter to included sections (if specified)
    const filteredSections = options.includeSections.length === 0 
      ? sections 
      : sections.filter(s => options.includeSections.includes(s.sectionType));

    // Collect source references
    const sourceReferences: SourceReference[] = [
      ...dailyLogs.map(l => ({ type: 'daily_log' as const, id: l.id, date: l.logDate })),
      ...activityLogs.map(l => ({ type: 'activity_log' as const, id: l.id, date: l.activityDate })),
      ...limitations.map(l => ({ type: 'limitation' as const, id: l.id })),
    ];

    // Create draft
    const draftId = generateId();
    const draft = createReportDraft(
      draftId,
      options.profileId,
      template.title,
      template.type,
      options.dateRange
    );

    // Add sections and source references
    draft.sections = filteredSections;
    draft.sourceReferences = sourceReferences;

    return draft;
  }

  /**
   * Regenerate a section of an existing draft
   */
  static async regenerateSection(
    draft: ReportDraft,
    sectionId: string,
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): Promise<ReportDraft> {
    // Re-run analysis
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _analysis = await AnalysisService.runComprehensiveAnalysis(
      dailyLogs,
      activityLogs,
      limitations,
      draft.dateRange
    );

    // Generate fresh narrative
    const symptomPatterns = PatternDetector.analyzeSymptomPatterns(dailyLogs);
    const activityPatterns = PatternDetector.analyzeActivityPatterns(activityLogs);
    const triggers = PatternDetector.analyzeTriggerPatterns(dailyLogs);
    const recovery = PatternDetector.analyzeRecoveryPatterns(activityLogs);

    const narrative = await NarrativeService.generateFullNarrative(
      dailyLogs,
      activityLogs,
      limitations,
      symptomPatterns,
      activityPatterns,
      triggers,
      recovery,
      draft.dateRange
    );

    // Find section and update content
    const section = draft.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    // Map section type to narrative content
    let newContent = '';
    switch (section.sectionType) {
      case 'summary':
        newContent = narrative.sections.overview;
        break;
      case 'daily_symptoms':
        newContent = narrative.sections.symptoms;
        break;
      case 'activity_impact':
        newContent = narrative.sections.activities;
        break;
      case 'functional_limitations':
        newContent = narrative.sections.limitations;
        break;
      case 'patterns':
        newContent = narrative.sections.patterns;
        break;
      case 'narrative':
        newContent = narrative.sections.rfc;
        break;
      default:
        throw new Error(`Unknown section type: ${section.sectionType}`);
    }

    // Parse new content into blocks
    const newBlocks = parseNarrativeToBlocks(newContent);

    // Update section with new blocks
    section.blocks = newBlocks;
    section.userEdited = false;
    
    // Update draft metadata
    draft.updatedAt = new Date().toISOString();

    return draft;
  }

  /**
   * Update a section with manual edits
   */
  static updateSection(
    draft: ReportDraft,
    sectionId: string,
    newContent: string
  ): ReportDraft {
    const section = draft.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    // Parse manual edits into blocks
    const newBlocks = parseNarrativeToBlocks(newContent);
    
    // Mark all blocks as edited
    newBlocks.forEach(block => {
      block.edited = true;
    });

    section.blocks = newBlocks;
    section.userEdited = true;
    draft.updatedAt = new Date().toISOString();

    return draft;
  }

  /**
   * Export report as plain text
   */
  static exportAsText(
    draft: ReportDraft,
    options: ReportExportOptions
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`           ${draft.reportType.toUpperCase()}`);
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // Metadata
    if (options.includeMetadata) {
      const startDate = new Date(draft.dateRange.start).toLocaleDateString();
      const endDate = new Date(draft.dateRange.end).toLocaleDateString();
      
      lines.push(`Reporting Period: ${startDate} to ${endDate}`);
      lines.push(`Generated: ${new Date(draft.createdAt).toLocaleDateString()}`);
      lines.push(`Last Modified: ${new Date(draft.updatedAt).toLocaleDateString()}`);
      
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
    }

    // Sections
    draft.sections.forEach(section => {
      lines.push(section.title.toUpperCase());
      lines.push('');
      
      // Concatenate blocks into text
      section.blocks.forEach(block => {
        if (block.type === 'heading') {
          lines.push(`# ${block.content}`);
        } else if (block.type === 'bullet_point') {
          lines.push(`• ${block.content}`);
        } else if (block.type === 'quote') {
          lines.push(`> ${block.content}`);
        } else {
          lines.push(block.content);
        }
      });
      
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
    });

    // Source references
    if (options.includeSourceReferences && draft.sourceReferences) {
      lines.push('SOURCE DATA REFERENCES');
      lines.push('');
      const dailyLogCount = draft.sourceReferences.filter(r => r.type === 'daily_log').length;
      const activityLogCount = draft.sourceReferences.filter(r => r.type === 'activity_log').length;
      const limitationCount = draft.sourceReferences.filter(r => r.type === 'limitation').length;
      lines.push(`Daily Logs: ${dailyLogCount} entries`);
      lines.push(`Activity Logs: ${activityLogCount} entries`);
      lines.push(`Limitations: ${limitationCount} entries`);
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
    }

    // Footer
    const totalWords = draft.sections
      .flatMap(s => s.blocks)
      .map(b => b.content.split(/\s+/).filter(w => w.length > 0).length)
      .reduce((sum, count) => sum + count, 0);

    lines.push(`Total Word Count: ${totalWords}`);
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Get report statistics
   */
  static getReportStats(draft: ReportDraft): {
    totalSections: number;
    totalWords: number;
    lastModified: string;
    coverage: {
      hasDailyLogs: boolean;
      hasActivityLogs: boolean;
      hasLimitations: boolean;
    };
  } {
    // Calculate word count from blocks
    const totalWords = draft.sections
      .flatMap(s => s.blocks)
      .map(b => b.content.split(/\s+/).filter(w => w.length > 0).length)
      .reduce((sum, count) => sum + count, 0);

    const coverage = {
      hasDailyLogs: (draft.sourceReferences?.filter(r => r.type === 'daily_log').length || 0) > 0,
      hasActivityLogs: (draft.sourceReferences?.filter(r => r.type === 'activity_log').length || 0) > 0,
      hasLimitations: (draft.sourceReferences?.filter(r => r.type === 'limitation').length || 0) > 0,
    };

    return {
      totalSections: draft.sections.length,
      totalWords,
      lastModified: draft.updatedAt,
      coverage,
    };
  }

  /**
   * Validate report completeness
   */
  static validateReport(draft: ReportDraft): {
    isComplete: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for empty sections
    const emptySections = draft.sections.filter(s => s.blocks.length === 0);
    if (emptySections.length > 0) {
      warnings.push(`${emptySections.length} empty section(s): ${emptySections.map(s => s.title).join(', ')}`);
    }

    // Check for very short sections
    const shortSections = draft.sections.filter(s => {
      const wordCount = s.blocks
        .map(b => b.content.split(/\s+/).filter(w => w.length > 0).length)
        .reduce((sum, count) => sum + count, 0);
      return wordCount > 0 && wordCount < 50;
    });
    
    if (shortSections.length > 0) {
      warnings.push(`${shortSections.length} section(s) may be too brief: ${shortSections.map(s => s.title).join(', ')}`);
    }

    // Check for source data
    if (!draft.sourceReferences || draft.sourceReferences.length === 0) {
      errors.push('No source data referenced - report lacks evidence');
    }

    // Check for daily log data
    const hasDailyLogs = draft.sourceReferences?.some(r => r.type === 'daily_log');
    if (!hasDailyLogs) {
      errors.push('No daily logs referenced - report lacks symptom evidence');
    }

    // Check date range
    const daysDiff = Math.ceil(
      (new Date(draft.dateRange.end).getTime() - new Date(draft.dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 7) {
      warnings.push('Date range less than 1 week - may not establish pattern consistency');
    }

    const isComplete = errors.length === 0 && emptySections.length === 0;

    return {
      isComplete,
      warnings,
      errors,
    };
  }
}