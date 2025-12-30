/**
 * Narrative Service
 * Generates SSDI-optimized narrative text from analyzed data
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { SymptomPattern, ActivityPattern, TriggerPattern, RecoveryPattern } from '../engine/PatternDetector';
import { SSDINarrativeBuilder } from '../engine/SSDINarrativeBuilder';
import { SymptomEngine } from '../engine/SymptomEngine';
import { LimitationAnalyzer } from '../engine/LimitationAnalyzer';

export interface DailyNarrative {
  date: string;
  narrative: string;
  wordCount: number;
}

export interface ActivityNarrative {
  activityId: string;
  activityName: string;
  narrative: string;
  wordCount: number;
}

export interface LimitationNarrative {
  category: string;
  narrative: string;
  wordCount: number;
}

export interface FullNarrative {
  // Section narratives
  sections: {
    overview: string;
    symptoms: string;
    activities: string;
    limitations: string;
    patterns: string;
    rfc: string;
  };
  
  // Metadata
  metadata: {
    dateRange: { start: string; end: string };
    totalWordCount: number;
    generatedAt: string;
  };
  
  // Full combined text
  fullText: string;
}

export class NarrativeService {
  /**
   * Generate daily symptom narrative
   */
  static generateDailyNarrative(
    date: string,
    dailyLog: DailyLog
  ): DailyNarrative {
    const lines: string[] = [];
    
    // Date header
    lines.push(`Date: ${new Date(date).toLocaleDateString()}`);
    lines.push('');

    // Overall severity
    if (dailyLog.overallSeverity >= 7) {
      lines.push('Significant symptoms interfering with function throughout the day.');
    } else if (dailyLog.overallSeverity >= 5) {
      lines.push('Moderate symptoms affecting daily activities.');
    } else if (dailyLog.overallSeverity >= 3) {
      lines.push('Mild to moderate symptoms present.');
    } else {
      lines.push('Minimal symptoms documented.');
    }

    lines.push('');

    // Symptoms
    if (dailyLog.symptoms.length > 0) {
      lines.push('Documented symptoms:');
      
      // Sort by severity
      const sortedSymptoms = [...dailyLog.symptoms].sort((a, b) => b.severity - a.severity);
      
      sortedSymptoms.forEach(symptom => {
        const severity = symptom.severity >= 7 ? 'severe' 
          : symptom.severity >= 5 ? 'moderate to severe'
          : symptom.severity >= 3 ? 'moderate'
          : 'mild';
        
        lines.push(`- ${symptom.symptomName}: ${severity} (${symptom.severity}/10)`);
        
        if (symptom.notes) {
          lines.push(`  Context: ${symptom.notes}`);
        }
      });
    }

    lines.push('');

    // Notes
    if (dailyLog.notes) {
      lines.push('Additional context:');
      lines.push(dailyLog.notes);
    }

    const narrative = lines.join('\n');
    const wordCount = narrative.split(/\s+/).filter(w => w.length > 0).length;

    return {
      date,
      narrative,
      wordCount,
    };
  }

  /**
   * Generate activity impact narrative
   */
  static generateActivityNarrative(
    activityLog: ActivityLog
  ): ActivityNarrative {
    const lines: string[] = [];

    // Activity header
    lines.push(`Activity: ${activityLog.activityName}`);
    lines.push(`Date: ${new Date(activityLog.activityDate).toLocaleDateString()}`);
    lines.push(`Duration: ${activityLog.duration} minutes`);
    lines.push('');

    // Impact
    if (activityLog.impacts.length > 0) {
      const maxImpact = Math.max(...activityLog.impacts.map(i => i.severity));
      
      if (maxImpact >= 7) {
        lines.push('Activity resulted in severe symptom exacerbation:');
      } else if (maxImpact >= 5) {
        lines.push('Activity caused significant symptom increase:');
      } else {
        lines.push('Activity impact:');
      }

      activityLog.impacts.forEach(impact => {
        lines.push(`- ${impact.symptomName}: severity ${impact.severity}/10`);
      });

      lines.push('');
    }

    // Stopped early
    if (activityLog.stoppedEarly) {
      lines.push('Activity discontinued early due to symptom severity.');
      lines.push('');
    }

    // Recovery
    if (activityLog.recovery) {
      const totalRecovery = activityLog.recovery.reduce((sum, r) => sum + r.durationMinutes, 0);
      
      lines.push(`Recovery required: ${totalRecovery} minutes`);
      
      activityLog.recovery.forEach(r => {
        lines.push(`- ${r.actionName}: ${r.durationMinutes} minutes`);
      });

      lines.push('');
    }

    // Notes
    if (activityLog.notes) {
      lines.push('Additional context:');
      lines.push(activityLog.notes);
    }

    const narrative = lines.join('\n');
    const wordCount = narrative.split(/\s+/).filter(w => w.length > 0).length;

    return {
      activityId: activityLog.activityId,
      activityName: activityLog.activityName,
      narrative,
      wordCount,
    };
  }

  /**
   * Generate full SSDI narrative report
   */
  static async generateFullNarrative(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    symptomPatterns: SymptomPattern[],
    activityPatterns: ActivityPattern[],
    triggers: TriggerPattern[],
    recovery: RecoveryPattern[],
    dateRange: { start: string; end: string }
  ): Promise<FullNarrative> {
    const sections = {
      overview: '',
      symptoms: '',
      activities: '',
      limitations: '',
      patterns: '',
      rfc: '',
    };

    // Overview section
    const dayRatio = SymptomEngine.calculateDayRatio(dailyLogs);
    sections.overview = this.buildOverviewSection(dailyLogs, dateRange, dayRatio);

    // Symptom section
    sections.symptoms = SSDINarrativeBuilder.buildSymptomSummary(
      symptomPatterns,
      dateRange,
      dailyLogs.length
    );

    // Activity section
    sections.activities = SSDINarrativeBuilder.buildActivityImpactNarrative(activityPatterns);

    // Limitations section
    sections.limitations = SSDINarrativeBuilder.buildLimitationsNarrative(limitations);

    // Patterns section
    sections.patterns = this.buildPatternsSection(triggers, recovery, dayRatio);

    // RFC section
    sections.rfc = SSDINarrativeBuilder.buildRFCNarrative(
      limitations,
      activityPatterns,
      dayRatio.goodDays,
      dayRatio.badDays
    );

    // Combine all sections
    const fullText = [
      'FUNCTIONAL CAPACITY DOCUMENTATION',
      '',
      'OVERVIEW',
      sections.overview,
      '',
      'SYMPTOM ANALYSIS',
      sections.symptoms,
      '',
      'ACTIVITY IMPACT',
      sections.activities,
      '',
      'FUNCTIONAL LIMITATIONS',
      sections.limitations,
      '',
      'PATTERN ANALYSIS',
      sections.patterns,
      '',
      sections.rfc,
    ].join('\n');

    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;

    return {
      sections,
      metadata: {
        dateRange,
        totalWordCount: wordCount,
        generatedAt: new Date().toISOString(),
      },
      fullText,
    };
  }

  /**
   * Build overview section
   */
  private static buildOverviewSection(
    dailyLogs: DailyLog[],
    dateRange: { start: string; end: string },
    dayRatio: { goodDays: number; badDays: number; badDayPercentage: number }
  ): string {
    const lines: string[] = [];

    const startDate = new Date(dateRange.start).toLocaleDateString();
    const endDate = new Date(dateRange.end).toLocaleDateString();
    const totalDays = dailyLogs.length;

    lines.push(`This report documents functional limitations based on symptoms logged from ${startDate} to ${endDate}, covering ${totalDays} days.`);
    lines.push('');
    
    lines.push(SSDINarrativeBuilder.buildConsistencyNarrative(
      dayRatio.goodDays,
      dayRatio.badDays,
      totalDays
    ));

    return lines.join('\n');
  }

  /**
   * Build patterns section
   */
  private static buildPatternsSection(
    triggers: TriggerPattern[],
    recovery: RecoveryPattern[],
    dayRatio: { badDayPercentage: number }
  ): string {
    const lines: string[] = [];

    // Triggers
    const triggerNarrative = SSDINarrativeBuilder.buildTriggerNarrative(triggers);
    if (triggerNarrative) {
      lines.push(triggerNarrative);
      lines.push('');
    }

    // Recovery
    if (recovery.length > 0) {
      const recoveryActions = recovery.map(r => ({
        name: r.actionName,
        effectiveness: r.effectivenessRate,
        duration: r.averageDuration,
      }));

      const recoveryNarrative = SSDINarrativeBuilder.buildRecoveryNarrative(recoveryActions);
      lines.push(recoveryNarrative);
      lines.push('');
    }

    // Consistency
    if (dayRatio.badDayPercentage >= 20) {
      lines.push(`The frequency and consistency of symptoms (affecting ${dayRatio.badDayPercentage}% of documented days) demonstrates a persistent pattern that would interfere with the reliability required for sustained competitive employment.`);
    }

    return lines.join('\n');
  }

  /**
   * Generate editable narrative sections
   */
  static generateEditableSections(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    symptomPatterns: SymptomPattern[],
    activityPatterns: ActivityPattern[],
    dateRange: { start: string; end: string }
  ): Record<string, string> {
    const dayRatio = SymptomEngine.calculateDayRatio(dailyLogs);

    return {
      'Symptom Summary': SSDINarrativeBuilder.buildSymptomSummary(
        symptomPatterns,
        dateRange,
        dailyLogs.length
      ),
      'Activity Impact': SSDINarrativeBuilder.buildActivityImpactNarrative(activityPatterns),
      'Functional Limitations': SSDINarrativeBuilder.buildLimitationsNarrative(limitations),
      'RFC Assessment': SSDINarrativeBuilder.buildRFCNarrative(
        limitations,
        activityPatterns,
        dayRatio.goodDays,
        dayRatio.badDays
      ),
    };
  }

  /**
   * Format narrative for export (plain text)
   */
  static formatForTextExport(narrative: FullNarrative): string {
    const lines: string[] = [];

    // Header
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('           FUNCTIONAL CAPACITY DOCUMENTATION');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // Date range
    const startDate = new Date(narrative.metadata.dateRange.start).toLocaleDateString();
    const endDate = new Date(narrative.metadata.dateRange.end).toLocaleDateString();
    lines.push(`Reporting Period: ${startDate} to ${endDate}`);
    lines.push(`Generated: ${new Date(narrative.metadata.generatedAt).toLocaleDateString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('');

    // Full text
    lines.push(narrative.fullText);

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`Total Word Count: ${narrative.metadata.totalWordCount}`);
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}