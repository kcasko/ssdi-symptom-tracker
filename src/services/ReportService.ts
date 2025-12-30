/**
 * Report Service
 * Coordinates report generation, drafts, and exports
 */

import { ReportDraft, createReportDraft } from '../domain/models/ReportDraft';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { AnalysisService, ComprehensiveAnalysis } from './AnalysisService';
import { NarrativeService, FullNarrative } from './NarrativeService';
import { PatternDetector } from '../engine/PatternDetector';
import { getReportTemplateById } from '../data/reportTemplates';

export interface ReportGenerationOptions {
  profileId: string;
  dateRange: { start: string; end: string };
  templateId: string;
  includeSections: string[];
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
    const analysis = await AnalysisService.runComprehensiveAnalysis(
      dailyLogs,
      activityLogs,
      limitations,
      options.dateRange
    );

    // Detect patterns
    const symptomPatterns = PatternDetector.detectSymptomPatterns(dailyLogs);
    const activityPatterns = PatternDetector.detectActivityImpactPatterns(activityLogs);
    const triggers = PatternDetector.identifyTriggers(dailyLogs, activityLogs);
    const recovery = PatternDetector.analyzeRecoveryPatterns(dailyLogs);

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
    const template = getReportTemplateById(options.templateId);
    if (!template) {
      throw new Error(`Template not found: ${options.templateId}`);
    }

    // Create sections based on template
    const sections = template.sections.map(sectionTemplate => {
      let content = '';

      // Map template sections to narrative sections
      switch (sectionTemplate.id) {
        case 'overview':
          content = narrative.sections.overview;
          break;
        case 'daily_summary':
          content = narrative.sections.symptoms;
          break;
        case 'symptom_summary':
          content = narrative.sections.symptoms;
          break;
        case 'activity_summary':
          content = narrative.sections.activities;
          break;
        case 'limitation_summary':
          content = narrative.sections.limitations;
          break;
        case 'pattern_analysis':
          content = narrative.sections.patterns;
          break;
        case 'rfc_assessment':
          content = narrative.sections.rfc;
          break;
        default:
          content = sectionTemplate.placeholder || '';
      }

      return {
        id: sectionTemplate.id,
        title: sectionTemplate.title,
        content,
        isEditable: true,
        lastModified: new Date().toISOString(),
      };
    });

    // Filter to included sections
    const filteredSections = sections.filter(s =>
      options.includeSections.length === 0 || options.includeSections.includes(s.id)
    );

    // Collect source references
    const sourceReferences = {
      dailyLogIds: dailyLogs.map(l => l.id),
      activityLogIds: activityLogs.map(l => l.id),
      limitationIds: limitations.map(l => l.id),
    };

    // Create draft
    const draft = createReportDraft(
      options.profileId,
      options.dateRange,
      template.name,
      filteredSections
    );

    draft.sourceReferences = sourceReferences;
    draft.metadata = {
      analysisGenerated: new Date().toISOString(),
      totalWordCount: narrative.metadata.totalWordCount,
      ...analysis.overall,
    };

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
    const analysis = await AnalysisService.runComprehensiveAnalysis(
      dailyLogs,
      activityLogs,
      limitations,
      draft.dateRange
    );

    // Generate fresh narrative
    const symptomPatterns = PatternDetector.detectSymptomPatterns(dailyLogs);
    const activityPatterns = PatternDetector.detectActivityImpactPatterns(activityLogs);
    const triggers = PatternDetector.identifyTriggers(dailyLogs, activityLogs);
    const recovery = PatternDetector.analyzeRecoveryPatterns(dailyLogs);

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

    // Map section ID to narrative content
    let newContent = '';
    switch (sectionId) {
      case 'overview':
        newContent = narrative.sections.overview;
        break;
      case 'daily_summary':
      case 'symptom_summary':
        newContent = narrative.sections.symptoms;
        break;
      case 'activity_summary':
        newContent = narrative.sections.activities;
        break;
      case 'limitation_summary':
        newContent = narrative.sections.limitations;
        break;
      case 'pattern_analysis':
        newContent = narrative.sections.patterns;
        break;
      case 'rfc_assessment':
        newContent = narrative.sections.rfc;
        break;
      default:
        throw new Error(`Unknown section: ${sectionId}`);
    }

    // Update section
    section.content = newContent;
    section.lastModified = new Date().toISOString();

    // Update draft metadata
    draft.lastModified = new Date().toISOString();

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

    if (!section.isEditable) {
      throw new Error(`Section is not editable: ${sectionId}`);
    }

    section.content = newContent;
    section.lastModified = new Date().toISOString();
    draft.lastModified = new Date().toISOString();

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
      lines.push(`Last Modified: ${new Date(draft.lastModified).toLocaleDateString()}`);
      
      if (draft.metadata) {
        lines.push('');
        lines.push(`Total Days: ${draft.metadata.totalDays || 'N/A'}`);
        lines.push(`Total Symptoms: ${draft.metadata.totalSymptoms || 'N/A'}`);
        lines.push(`Work Capacity: ${draft.metadata.workCapacity || 'N/A'}`);
      }
      
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
    }

    // Sections
    draft.sections.forEach(section => {
      lines.push(section.title.toUpperCase());
      lines.push('');
      lines.push(section.content);
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
    });

    // Source references
    if (options.includeSourceReferences && draft.sourceReferences) {
      lines.push('SOURCE DATA REFERENCES');
      lines.push('');
      lines.push(`Daily Logs: ${draft.sourceReferences.dailyLogIds.length} entries`);
      lines.push(`Activity Logs: ${draft.sourceReferences.activityLogIds.length} entries`);
      lines.push(`Limitations: ${draft.sourceReferences.limitationIds.length} entries`);
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
    }

    // Footer
    const totalWords = draft.sections
      .map(s => s.content.split(/\s+/).filter(w => w.length > 0).length)
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
    const totalWords = draft.sections
      .map(s => s.content.split(/\s+/).filter(w => w.length > 0).length)
      .reduce((sum, count) => sum + count, 0);

    const coverage = {
      hasDailyLogs: (draft.sourceReferences?.dailyLogIds.length || 0) > 0,
      hasActivityLogs: (draft.sourceReferences?.activityLogIds.length || 0) > 0,
      hasLimitations: (draft.sourceReferences?.limitationIds.length || 0) > 0,
    };

    return {
      totalSections: draft.sections.length,
      totalWords,
      lastModified: draft.lastModified,
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
    const emptySections = draft.sections.filter(s => !s.content || s.content.trim().length === 0);
    if (emptySections.length > 0) {
      warnings.push(`${emptySections.length} empty section(s): ${emptySections.map(s => s.title).join(', ')}`);
    }

    // Check for very short sections
    const shortSections = draft.sections.filter(s => {
      const wordCount = s.content.split(/\s+/).filter(w => w.length > 0).length;
      return wordCount > 0 && wordCount < 50;
    });
    
    if (shortSections.length > 0) {
      warnings.push(`${shortSections.length} section(s) may be too brief: ${shortSections.map(s => s.title).join(', ')}`);
    }

    // Check for source data
    if (!draft.sourceReferences || draft.sourceReferences.dailyLogIds.length === 0) {
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