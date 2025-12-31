/**
 * SSDI Narrative Builder
 * Generates SSDI-appropriate narrative text from analyzed data
 */

import { SymptomPattern, ActivityPattern, TriggerPattern } from './PatternDetector';
import { Limitation } from '../domain/models/Limitation';
import { 
  formatSeverityForNarrative,
  formatFrequencyForNarrative,
  formatDurationForNarrative,
  generateFunctionalStatement,
  generateRecoveryStatement,
  generateConsistencyStatement,
  ensureProfessionalTone,
} from '../domain/rules/SSDILanguageRules';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';
import { getLimitationCategoryLabel } from '../domain/models/Limitation';

export class SSDINarrativeBuilder {
  /**
   * Build symptom summary narrative
   */
  static buildSymptomSummary(
    patterns: SymptomPattern[],
    dateRange: { start: string; end: string },
    totalDays: number
  ): string {
    if (patterns.length === 0) {
      return 'No symptoms were documented during this period.';
    }

    const lines: string[] = [];
    
    // Opening statement
    lines.push(`During the period from ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}, the patient documented symptoms on ${totalDays} days.`);
    
    // Most frequent symptoms
    const frequentSymptoms = patterns.filter(p => p.frequency >= 50);
    if (frequentSymptoms.length > 0) {
      const symptomList = frequentSymptoms
        .map(p => {
          const symptom = getSymptomById(p.symptomId);
          const freqText = formatFrequencyForNarrative(p.frequency);
          const sevText = formatSeverityForNarrative(p.averageSeverity);
          return `${symptom?.name || p.symptomId} occurring ${freqText} with ${sevText}`;
        })
        .join('; ');
      
      lines.push(`Primary symptoms include: ${symptomList}.`);
    }

    // Worsening patterns
    const worseningSymptoms = patterns.filter(p => p.trend === 'worsening');
    if (worseningSymptoms.length > 0) {
      const symptomNames = worseningSymptoms
        .slice(0, 3)
        .map(p => getSymptomById(p.symptomId)?.name || p.symptomId)
        .join(', ');
      
      lines.push(`Symptom progression noted in: ${symptomNames}.`);
    }

    // Consistent symptoms
    const consistentSymptoms = patterns.filter(p => p.consistency === 'consistent');
    if (consistentSymptoms.length > 0) {
      const symptomNames = consistentSymptoms
        .slice(0, 3)
        .map(p => getSymptomById(p.symptomId)?.name || p.symptomId)
        .join(', ');
      
      lines.push(`Consistently present symptoms: ${symptomNames}.`);
    }

    return lines.join(' ');
  }

  /**
   * Build activity impact narrative
   */
  static buildActivityImpactNarrative(
    patterns: ActivityPattern[]
  ): string {
    if (patterns.length === 0) {
      return 'No activity logs were documented during this period.';
    }

    const lines: string[] = [];

    // Activities with significant impact
    const significantImpact = patterns.filter(p => p.averageImpact >= 5);
    if (significantImpact.length > 0) {
      lines.push('Activities resulting in significant functional impact:');
      
      significantImpact.forEach(pattern => {
        const durationText = formatDurationForNarrative(pattern.averageDuration);
        const impactText = formatSeverityForNarrative(pattern.averageImpact);
        
        if (pattern.durationThreshold) {
          const thresholdText = formatDurationForNarrative(pattern.durationThreshold);
          lines.push(`${pattern.activityName}: symptoms develop after ${thresholdText}, average duration ${durationText}, resulting in ${impactText}.`);
        } else {
          lines.push(`${pattern.activityName}: average duration ${durationText}, resulting in ${impactText}.`);
        }
      });
    }

    // Activities frequently stopped early
    const stoppedEarly = patterns.filter(p => p.completionRate < 50);
    if (stoppedEarly.length > 0) {
      const activityNames = stoppedEarly
        .slice(0, 3)
        .map(p => p.activityName)
        .join(', ');
      
      lines.push(`Activities frequently discontinued due to symptoms: ${activityNames}.`);
    }

    // Duration thresholds
    const withThresholds = patterns.filter(p => p.durationThreshold);
    if (withThresholds.length > 0) {
      const thresholds = withThresholds
        .map(p => {
          const duration = formatDurationForNarrative(p.durationThreshold!);
          return `${p.activityName} (${duration})`;
        })
        .join('; ');
      
      lines.push(`Activity tolerance thresholds identified: ${thresholds}.`);
    }

    return lines.join(' ');
  }

  /**
   * Build functional limitations narrative
   */
  static buildLimitationsNarrative(
    limitations: Limitation[]
  ): string {
    if (limitations.length === 0) {
      return 'No functional limitations were documented.';
    }

    const lines: string[] = [];
    const activeLimitations = limitations.filter(l => l.isActive);

    // Group by category type
    const physical = activeLimitations.filter(l => 
      ['sitting', 'standing', 'walking', 'lifting', 'carrying', 'reaching', 'bending', 'climbing'].includes(l.category)
    );

    const cognitive = activeLimitations.filter(l =>
      ['concentration', 'memory'].includes(l.category)
    );

    const other = activeLimitations.filter(l =>
      ['social', 'self_care', 'fine_motor', 'gross_motor'].includes(l.category)
    );

    // Physical limitations
    if (physical.length > 0) {
      lines.push('Physical functional limitations:');
      
      physical.forEach(limitation => {
        const category = getLimitationCategoryLabel(limitation.category);
        const frequency = formatFrequencyForNarrative(this.frequencyToPercentage(limitation.frequency));
        
        let statement = `${category}`;
        
        if (limitation.timeThreshold) {
          const duration = formatDurationForNarrative(limitation.timeThreshold.durationMinutes);
          statement += ` limited to ${duration}`;
        }
        
        if (limitation.weightThreshold) {
          statement += ` restricted to ${limitation.weightThreshold.maxPounds} pounds ${limitation.weightThreshold.frequency}`;
        }
        
        if (limitation.consequences && limitation.consequences.length > 0) {
          statement += `, resulting in ${limitation.consequences[0].toLowerCase()}`;
        }
        
        statement += ` occurring ${frequency}.`;
        
        lines.push(ensureProfessionalTone(statement));
      });
    }

    // Cognitive limitations
    if (cognitive.length > 0) {
      lines.push('Cognitive functional limitations:');
      
      cognitive.forEach(limitation => {
        const category = getLimitationCategoryLabel(limitation.category);
        const frequency = formatFrequencyForNarrative(this.frequencyToPercentage(limitation.frequency));
        
        let statement = `${category}`;
        
        if (limitation.timeThreshold) {
          const duration = formatDurationForNarrative(limitation.timeThreshold.durationMinutes);
          statement += ` limited to ${duration}`;
        }
        
        if (limitation.consequences && limitation.consequences.length > 0) {
          statement += `, with ${limitation.consequences.join(', ').toLowerCase()}`;
        }
        
        statement += ` ${frequency}.`;
        
        lines.push(ensureProfessionalTone(statement));
      });
    }

    // Other limitations
    if (other.length > 0) {
      other.forEach(limitation => {
        const category = getLimitationCategoryLabel(limitation.category);
        const frequency = formatFrequencyForNarrative(this.frequencyToPercentage(limitation.frequency));
        
        let statement = `${category} affected ${frequency}`;
        
        if (limitation.consequences && limitation.consequences.length > 0) {
          statement += `, resulting in ${limitation.consequences[0].toLowerCase()}`;
        }
        
        statement += '.';
        
        lines.push(ensureProfessionalTone(statement));
      });
    }

    return lines.join(' ');
  }

  /**
   * Build trigger analysis narrative
   */
  static buildTriggerNarrative(patterns: TriggerPattern[]): string {
    if (patterns.length === 0) {
      return 'No consistent triggers were identified.';
    }

    const reliableTriggers = patterns.filter(p => p.reliability >= 50);
    
    if (reliableTriggers.length === 0) {
      return 'No consistent triggers were identified with sufficient reliability.';
    }

    const lines: string[] = [];
    lines.push('Identified symptom triggers:');

    reliableTriggers.forEach(trigger => {
      const reliabilityText = formatFrequencyForNarrative(trigger.reliability);
      const severityText = formatSeverityForNarrative(trigger.averageSeverity);
      
      lines.push(`${trigger.trigger} associated with ${severityText} ${reliabilityText}.`);
    });

    return lines.join(' ');
  }

  /**
   * Build pattern consistency narrative
   */
  static buildConsistencyNarrative(
    goodDays: number,
    badDays: number,
    totalDays: number
  ): string {
    const badDayPercentage = totalDays > 0 ? Math.round((badDays / totalDays) * 100) : 0;
    const consistency = generateConsistencyStatement(badDayPercentage);

    return `Symptoms interfering with function ${consistency}, affecting ${badDays} of ${totalDays} documented days (${badDayPercentage}%).`;
  }

  /**
   * Build recovery narrative
   */
  static buildRecoveryNarrative(
    recoveryActions: Array<{ name: string; effectiveness: number; duration: number }>
  ): string {
    if (recoveryActions.length === 0) {
      return 'No specific recovery measures were documented.';
    }

    const effective = recoveryActions.filter(a => a.effectiveness >= 50);
    
    if (effective.length === 0) {
      return 'Documented recovery measures showed limited effectiveness.';
    }

    const actionsList = effective
      .map(a => {
        if (a.duration > 0) {
          const durationText = formatDurationForNarrative(a.duration);
          return `${a.name.toLowerCase()} (requiring ${durationText})`;
        }
        return a.name.toLowerCase();
      })
      .join(', ');

    return `Relief typically obtained through: ${actionsList}.`;
  }

  /**
   * Build complete RFC (Residual Functional Capacity) narrative
   */
  static buildRFCNarrative(
    limitations: Limitation[],
    activityPatterns: ActivityPattern[],
    goodDays: number,
    badDays: number
  ): string {
    const lines: string[] = [];

    lines.push('RESIDUAL FUNCTIONAL CAPACITY ASSESSMENT:');
    lines.push('');

    // Physical RFC
    const sitting = limitations.find(l => l.category === 'sitting');
    const standing = limitations.find(l => l.category === 'standing');
    const walking = limitations.find(l => l.category === 'walking');
    const lifting = limitations.find(l => l.category === 'lifting');

    if (sitting || standing || walking || lifting) {
      lines.push('Physical Capacity:');
      
      if (sitting?.timeThreshold) {
        const duration = formatDurationForNarrative(sitting.timeThreshold.durationMinutes);
        lines.push(`- Sitting tolerance: ${duration} before requiring position change`);
      }
      
      if (standing?.timeThreshold) {
        const duration = formatDurationForNarrative(standing.timeThreshold.durationMinutes);
        lines.push(`- Standing tolerance: ${duration} before requiring rest`);
      }
      
      if (walking?.distanceThreshold) {
        lines.push(`- Walking capacity: limited to approximately ${walking.distanceThreshold.maxBlocks} blocks`);
      }
      
      if (lifting?.weightThreshold) {
        lines.push(`- Lifting restriction: maximum ${lifting.weightThreshold.maxPounds} pounds ${lifting.weightThreshold.frequency}`);
      }

      lines.push('');
    }

    // Mental RFC
    const concentration = limitations.find(l => l.category === 'concentration');
    const memory = limitations.find(l => l.category === 'memory');

    if (concentration || memory) {
      lines.push('Mental Capacity:');
      
      if (concentration?.timeThreshold) {
        const duration = formatDurationForNarrative(concentration.timeThreshold.durationMinutes);
        lines.push(`- Sustained concentration: limited to ${duration}`);
      }
      
      if (memory) {
        const frequency = formatFrequencyForNarrative(this.frequencyToPercentage(memory.frequency));
        lines.push(`- Memory difficulties occur ${frequency}`);
      }

      lines.push('');
    }

    // Reliability assessment
    const totalDays = goodDays + badDays;
    const badDayPercentage = totalDays > 0 ? Math.round((badDays / totalDays) * 100) : 0;
    
    lines.push('Work Reliability:');
    lines.push(`Based on documented data, significant symptoms interfere with function ${badDayPercentage}% of the time. This level of unreliability would preclude sustained competitive employment.`);

    return lines.join('\n');
  }

  /**
   * Helper: Convert limitation frequency to percentage
   */
  private static frequencyToPercentage(frequency: string): number {
    switch (frequency) {
      case 'always': return 100;
      case 'usually': return 85;
      case 'often': return 65;
      case 'sometimes': return 40;
      case 'occasionally': return 20;
      case 'rarely': return 5;
      default: return 50;
    }
  }
}