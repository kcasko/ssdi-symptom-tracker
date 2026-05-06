/**
 * Health Narrative Builder
 * Generates neutral summaries from user-entered tracking data.
 */

import { SymptomPattern, ActivityPattern, TriggerPattern } from './PatternDetector';
import { Limitation } from '../domain/models/Limitation';
import { getSymptomById } from '../data/symptoms';
import { getLimitationCategoryLabel } from '../domain/models/Limitation';
import { formatDateOnly } from '../utils/dates';

function formatSeverity(severity: number): string {
  if (severity <= 2) return 'minimal';
  if (severity <= 4) return 'mild';
  if (severity <= 6) return 'moderate';
  if (severity <= 8) return 'high';
  return 'very high';
}

function formatFrequency(percentage: number): string {
  if (percentage >= 75) return 'most of the time';
  if (percentage >= 50) return 'frequently';
  if (percentage >= 25) return 'sometimes';
  if (percentage >= 10) return 'occasionally';
  return 'rarely';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} hours`;
}

export class HealthNarrativeBuilder {
  static buildSymptomSummary(
    patterns: SymptomPattern[],
    dateRange: { start: string; end: string },
    totalDays: number
  ): string {
    if (patterns.length === 0) {
      return 'Symptoms were logged, but there is not enough data yet to summarize recurring patterns.';
    }

    const lines: string[] = [
      `From ${formatDateOnly(dateRange.start)} to ${formatDateOnly(dateRange.end)}, symptoms were logged on ${totalDays} days.`,
    ];

    const frequentSymptoms = patterns.filter((p) => p.frequency >= 25);
    if (frequentSymptoms.length > 0) {
      const symptomList = frequentSymptoms
        .map((p) => {
          const symptom = getSymptomById(p.symptomId);
          return `${symptom?.name || p.symptomId} (${formatFrequency(p.frequency)}, average severity ${p.averageSeverity.toFixed(1)}/10)`;
        })
        .join('; ');
      lines.push(`Commonly logged symptoms: ${symptomList}.`);
    }

    const changingSymptoms = patterns.filter((p) => p.trend !== 'stable');
    if (changingSymptoms.length > 0) {
      const names = changingSymptoms
        .slice(0, 3)
        .map((p) => `${getSymptomById(p.symptomId)?.name || p.symptomId} ${p.trend}`)
        .join(', ');
      lines.push(`Changes noted in: ${names}.`);
    }

    return lines.join(' ');
  }

  static buildActivityImpactNarrative(patterns: ActivityPattern[]): string {
    if (patterns.length === 0) {
      return 'No recurring activity impact pattern is available yet.';
    }

    const lines: string[] = [];
    patterns
      .filter((p) => p.averageImpact > 0)
      .slice(0, 8)
      .forEach((pattern) => {
        const durationText = formatDuration(pattern.averageDuration);
        const impactText = formatSeverity(pattern.averageImpact);
        lines.push(`${pattern.activityName}: average duration ${durationText}, average impact ${pattern.averageImpact.toFixed(1)}/10 (${impactText}).`);
      });

    return lines.length > 0 ? lines.join(' ') : 'Activities were logged without a clear symptom impact pattern.';
  }

  static buildLimitationsNarrative(limitations: Limitation[]): string {
    const activeLimitations = limitations.filter((l) => l.isActive);
    if (activeLimitations.length === 0) {
      return 'No active capacity limits were logged.';
    }

    return activeLimitations
      .map((limitation) => {
        const parts = [getLimitationCategoryLabel(limitation.category)];
        if (limitation.timeThreshold) {
          parts.push(`time limit ${formatDuration(limitation.timeThreshold.durationMinutes)}`);
        }
        if (limitation.weightThreshold) {
          parts.push(`weight limit ${limitation.weightThreshold.maxPounds} lb`);
        }
        parts.push(`frequency ${limitation.frequency.replace(/_/g, ' ')}`);
        if (limitation.consequences?.length) {
          parts.push(`notes: ${limitation.consequences.join(', ')}`);
        }
        return parts.join('; ') + '.';
      })
      .join(' ');
  }

  static buildTriggerNarrative(patterns: TriggerPattern[]): string {
    const reliableTriggers = patterns.filter((p) => p.reliability >= 25);
    if (reliableTriggers.length === 0) {
      return 'No recurring triggers were identified from the logged entries.';
    }

    return reliableTriggers
      .map((trigger) => `${trigger.trigger}: associated with average severity ${trigger.averageSeverity.toFixed(1)}/10 ${formatFrequency(trigger.reliability)}.`)
      .join(' ');
  }

  static buildConsistencyNarrative(goodDays: number, badDays: number, totalDays: number): string {
    if (totalDays <= 0) return 'No daily entries were available for this range.';
    const higherImpactPercentage = Math.round((badDays / totalDays) * 100);
    return `Higher-impact symptom days were logged on ${badDays} of ${totalDays} days (${higherImpactPercentage}%). Lower-impact days were logged on ${goodDays} days.`;
  }

  static buildRecoveryNarrative(
    recoveryActions: Array<{ name: string; effectiveness: number; duration: number }>
  ): string {
    if (recoveryActions.length === 0) {
      return 'No recurring recovery actions were logged.';
    }

    return recoveryActions
      .filter((a) => a.effectiveness >= 25)
      .map((a) => `${a.name}: average recovery time ${formatDuration(a.duration)}, marked helpful ${Math.round(a.effectiveness)}% of the time.`)
      .join(' ') || 'Recovery actions were logged, but no recurring helpful pattern is available yet.';
  }

  static buildDailyFunctionSummary(limitations: Limitation[], activityPatterns: ActivityPattern[], goodDays: number, badDays: number): string {
    const lines = [
      this.buildConsistencyNarrative(goodDays, badDays, goodDays + badDays),
      this.buildLimitationsNarrative(limitations),
      this.buildActivityImpactNarrative(activityPatterns),
    ];
    return lines.join(' ');
  }
}
