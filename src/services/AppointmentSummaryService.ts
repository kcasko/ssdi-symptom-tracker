/**
 * Appointment Summary Service
 * Generates preparation summaries for upcoming medical appointments
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { Medication } from '../domain/models/Medication';
import { Appointment } from '../domain/models/Appointment';
import { SymptomEngine } from '../engine/SymptomEngine';
import { ActivityImpactEngine } from '../engine/ActivityImpactEngine';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';
import { getWorstImpact } from '../domain/models/ActivityLog';

export interface AppointmentPreparationSummary {
  appointment: Appointment;
  dateRange: { start: string; end: string };
  
  // Recent symptom patterns
  recentSymptoms: {
    symptomId: string;
    symptomName: string;
    frequency: number; // percentage
    averageSeverity: number;
    trend: 'improving' | 'worsening' | 'stable';
    lastOccurrence: string;
  }[];
  
  // New or worsening symptoms
  changedSymptoms: {
    symptomName: string;
    change: 'new' | 'worsening' | 'more_frequent';
    details: string;
  }[];
  
  // Activity limitations
  recentLimitations: {
    activityName: string;
    impactLevel: number;
    frequency: number;
    examples: string[];
  }[];
  
  // Medication updates
  medicationChanges: {
    medicationName: string;
    status: 'new' | 'stopped' | 'changed_dose';
    date: string;
    effectiveness?: string;
    sideEffects?: string[];
  }[];
  
  // Key discussion points
  discussionPoints: string[];
  
  // Questions to ask provider
  suggestedQuestions: string[];
  
  // Day quality summary
  dayQualitySummary: {
    goodDays: number;
    badDays: number;
    percentage: number;
    trend: string;
  };
}

export class AppointmentSummaryService {
  /**
   * Generate comprehensive appointment preparation summary
   */
  static generatePreparationSummary(
    appointment: Appointment,
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    medications: Medication[],
    lookbackDays: number = 30
  ): AppointmentPreparationSummary {
    const appointmentDate = new Date(appointment.appointmentDate);
    const endDate = new Date(appointmentDate);
    endDate.setDate(endDate.getDate() - 1); // Day before appointment
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
    
    // Filter logs within date range
    const recentLogs = dailyLogs.filter(
      log => log.logDate >= dateRange.start && log.logDate <= dateRange.end
    );
    
    const recentActivities = activityLogs.filter(
      log => log.activityDate >= dateRange.start && log.activityDate <= dateRange.end
    );
    
    return {
      appointment,
      dateRange,
      recentSymptoms: this.analyzeRecentSymptoms(recentLogs, dateRange),
      changedSymptoms: this.identifyChangedSymptoms(dailyLogs, dateRange),
      recentLimitations: this.analyzeRecentLimitations(recentActivities),
      medicationChanges: this.identifyMedicationChanges(medications, dateRange),
      discussionPoints: this.generateDiscussionPoints(
        recentLogs,
        recentActivities,
        medications,
        appointment
      ),
      suggestedQuestions: this.generateSuggestedQuestions(appointment),
      dayQualitySummary: this.analyzeDayQuality(recentLogs),
    };
  }
  
  /**
   * Analyze recent symptom patterns
   */
  private static analyzeRecentSymptoms(
    logs: DailyLog[],
    dateRange: { start: string; end: string }
  ): AppointmentPreparationSummary['recentSymptoms'] {
    if (logs.length === 0) return [];
    
    // Get all unique symptoms
    const symptomIds = Array.from(
      new Set(logs.flatMap(log => log.symptoms.map(s => s.symptomId)))
    );
    
    const summaries = symptomIds
      .map(symptomId => {
        const summary = SymptomEngine.summarizeSymptom(symptomId, logs);
        if (!summary) return null;
        
        // Find last occurrence
        const logsWithSymptom = logs
          .filter(log => log.symptoms.some(s => s.symptomId === symptomId))
          .sort((a, b) => b.logDate.localeCompare(a.logDate));
        
        const lastOccurrence = logsWithSymptom[0]?.logDate || dateRange.end;
        
        return {
          symptomId,
          symptomName: summary.symptomName,
          frequency: summary.percentage,
          averageSeverity: summary.averageSeverity,
          trend: summary.trend,
          lastOccurrence,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 symptoms
    
    return summaries;
  }
  
  /**
   * Identify new or changed symptoms
   */
  private static identifyChangedSymptoms(
    allLogs: DailyLog[],
    recentDateRange: { start: string; end: string }
  ): AppointmentPreparationSummary['changedSymptoms'] {
    const changes: AppointmentPreparationSummary['changedSymptoms'] = [];
    
    // Split logs into recent and previous periods
    const recentLogs = allLogs.filter(
      log => log.logDate >= recentDateRange.start && log.logDate <= recentDateRange.end
    );
    
    const previousStart = new Date(recentDateRange.start);
    previousStart.setDate(previousStart.getDate() - 30);
    const previousLogs = allLogs.filter(
      log => log.logDate >= previousStart.toISOString().split('T')[0] && 
             log.logDate < recentDateRange.start
    );
    
    if (recentLogs.length === 0) return changes;
    
    // Get symptoms in recent period
    const recentSymptomIds = new Set(
      recentLogs.flatMap(log => log.symptoms.map(s => s.symptomId))
    );
    
    // Get symptoms in previous period
    const previousSymptomIds = new Set(
      previousLogs.flatMap(log => log.symptoms.map(s => s.symptomId))
    );
    
    // Find new symptoms
    recentSymptomIds.forEach(symptomId => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      if (!previousSymptomIds.has(symptomId)) {
        changes.push({
          symptomName: symptom.name,
          change: 'new',
          details: 'This symptom was not reported in the previous 30 days',
        });
      } else {
        // Check if severity increased
        const recentSummary = SymptomEngine.summarizeSymptom(symptomId, recentLogs);
        const previousSummary = SymptomEngine.summarizeSymptom(symptomId, previousLogs);
        
        if (recentSummary && previousSummary) {
          if (recentSummary.averageSeverity > previousSummary.averageSeverity + 2) {
            changes.push({
              symptomName: symptom.name,
              change: 'worsening',
              details: `Average severity increased from ${previousSummary.averageSeverity}/10 to ${recentSummary.averageSeverity}/10`,
            });
          }
          
          if (recentSummary.percentage > previousSummary.percentage + 20) {
            changes.push({
              symptomName: symptom.name,
              change: 'more_frequent',
              details: `Occurrence increased from ${previousSummary.percentage}% to ${recentSummary.percentage}% of days`,
            });
          }
        }
      }
    });
    
    return changes.slice(0, 5); // Top 5 changes
  }
  
  /**
   * Analyze recent activity limitations
   */
  private static analyzeRecentLimitations(
    activityLogs: ActivityLog[]
  ): AppointmentPreparationSummary['recentLimitations'] {
    if (activityLogs.length === 0) return [];
    
    // Get unique activity IDs
    const activityIds = Array.from(new Set(activityLogs.map(log => log.activityId)));
    
    const analyses = activityIds
      .map(activityId => {
        const analysis = ActivityImpactEngine.analyzeActivity(activityId, activityLogs);
        if (!analysis || analysis.averageImpact < 5) return null;
        
        const activity = getActivityById(activityId);
        const activityName = activity?.name || analysis.activityName;
        
        // Get specific examples
        const examples = activityLogs
          .filter(log => log.activityId === activityId && getWorstImpact(log) >= 5)
          .slice(0, 3)
          .map(log => {
            const parts = [];
            if (log.stoppedEarly) parts.push('had to stop early');
            if (log.recoveryActions && log.recoveryActions.length > 0) parts.push('required recovery actions');
            if (log.delayedImpact && log.delayedImpact.overallImpact >= 7) parts.push('caused delayed impact');
            return parts.length > 0 ? parts.join(', ') : 'significant impact';
          });
        
        return {
          activityName,
          impactLevel: analysis.averageImpact,
          frequency: Math.round((activityLogs.filter(l => l.activityId === activityId).length / activityLogs.length) * 100),
          examples: examples.length > 0 ? examples : ['Activity consistently causes difficulties'],
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => b.impactLevel - a.impactLevel)
      .slice(0, 5);
    
    return analyses;
  }
  
  /**
   * Identify recent medication changes
   */
  private static identifyMedicationChanges(
    medications: Medication[],
    dateRange: { start: string; end: string }
  ): AppointmentPreparationSummary['medicationChanges'] {
    const changes: AppointmentPreparationSummary['medicationChanges'] = [];
    
    medications.forEach(med => {
      const startedInRange = med.startDate && med.startDate >= dateRange.start && med.startDate <= dateRange.end;
      const stoppedInRange = med.endDate && med.endDate >= dateRange.start && med.endDate <= dateRange.end;
      
      if (startedInRange && med.startDate) {
        changes.push({
          medicationName: med.name,
          status: 'new',
          date: med.startDate,
          effectiveness: med.effectiveness || undefined,
          sideEffects: med.sideEffects && med.sideEffects.length > 0 ? med.sideEffects : undefined,
        });
      }
      
      if (stoppedInRange && med.endDate) {
        changes.push({
          medicationName: med.name,
          status: 'stopped',
          date: med.endDate,
          effectiveness: med.effectiveness || undefined,
          sideEffects: med.sideEffects && med.sideEffects.length > 0 ? med.sideEffects : undefined,
        });
      }
      
      // Check for dose changes (if we had version history, but we don't currently)
      // This would require tracking medication history
    });
    
    return changes.sort((a, b) => b.date.localeCompare(a.date));
  }
  
  /**
   * Generate key discussion points
   */
  private static generateDiscussionPoints(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    medications: Medication[],
    appointment: Appointment
  ): string[] {
    const points: string[] = [];
    
    if (dailyLogs.length === 0) {
      points.push('No symptom data logged in the past 30 days - consider discussing current symptom status');
      return points;
    }
    
    // Day quality
    const dayRatio = SymptomEngine.calculateDayRatio(dailyLogs);
    if (dayRatio.badDayPercentage >= 50) {
      points.push(
        `Having bad days ${dayRatio.badDayPercentage}% of the time (${dayRatio.badDays} out of ${dayRatio.totalDays} days) - discuss impact on daily functioning`
      );
    }
    
    // Severe symptom days
    const severeDays = dailyLogs.filter(log => 
      log.symptoms.some(s => s.severity >= 8)
    ).length;
    if (severeDays > 0) {
      points.push(
        `Experienced severe symptoms (8+/10) on ${severeDays} days - discuss pain management options`
      );
    }
    
    // Activity limitations
    const significantImpacts = activityLogs.filter(log => getWorstImpact(log) >= 7).length;
    if (significantImpacts > 0) {
      points.push(
        `${significantImpacts} activities caused significant functional limitations - review work capacity`
      );
    }
    
    // Medication effectiveness
    const ineffectiveMeds = medications.filter(
      med => med.isActive && (med.effectiveness === 'not_effective' || med.effectiveness === 'minimally_effective')
    );
    if (ineffectiveMeds.length > 0) {
      points.push(
        `${ineffectiveMeds.length} current medication${ineffectiveMeds.length > 1 ? 's' : ''} showing limited effectiveness - discuss alternatives`
      );
    }
    
    // Side effects
    const medsWithSideEffects = medications.filter(
      med => med.isActive && med.sideEffects && med.sideEffects.length > 0
    );
    if (medsWithSideEffects.length > 0) {
      const totalSideEffects = medsWithSideEffects.reduce(
        (sum, med) => sum + (med.sideEffects?.length || 0), 0
      );
      points.push(
        `Experiencing ${totalSideEffects} medication side effect${totalSideEffects > 1 ? 's' : ''} - review medication tolerability`
      );
    }
    
    // Appointment-specific points
    if (appointment.purpose === 'ssdi_evaluation') {
      points.push('Request documentation of functional limitations for SSDI application');
      points.push('Ask provider to complete RFC (Residual Functional Capacity) forms');
    }
    
    if (appointment.purpose === 'medication_review') {
      points.push('Bring list of all current medications and supplements');
      points.push('Discuss any medication interactions or concerns');
    }
    
    return points;
  }
  
  /**
   * Generate suggested questions for the provider
   */
  private static generateSuggestedQuestions(appointment: Appointment): string[] {
    const questions: string[] = [
      'Are there any additional treatment options I should consider?',
      'How can I better manage my symptoms on bad days?',
      'Do my symptoms indicate any progression or changes in my condition?',
    ];
    
    // Appointment type specific questions
    switch (appointment.purpose) {
      case 'initial_evaluation':
        questions.push(
          'What diagnostic tests or evaluations would you recommend?',
          'What is your assessment of my functional limitations?',
          'Should I see any specialists for my symptoms?'
        );
        break;
        
      case 'ssdi_evaluation':
        questions.push(
          'Can you provide documentation of my functional limitations?',
          'Would you be willing to complete RFC forms for my disability application?',
          'How would you describe my ability to work in my current condition?'
        );
        break;
        
      case 'medication_review':
        questions.push(
          'Are there any medication interactions I should be aware of?',
          'Should I adjust dosages based on my symptom patterns?',
          'Are there newer medications that might be more effective?'
        );
        break;
        
      case 'follow_up':
        questions.push(
          'Based on my recent symptoms, is my current treatment plan still appropriate?',
          'When should I schedule my next follow-up?'
        );
        break;
        
      case 'test_results':
        questions.push(
          'What do these results mean for my treatment plan?',
          'Are additional tests needed?',
          'How do these results compare to previous tests?'
        );
        break;
    }
    
    return questions;
  }
  
  /**
   * Analyze day quality summary
   */
  private static analyzeDayQuality(logs: DailyLog[]): AppointmentPreparationSummary['dayQualitySummary'] {
    if (logs.length === 0) {
      return {
        goodDays: 0,
        badDays: 0,
        percentage: 0,
        trend: 'No data available',
      };
    }
    
    const dayRatio = SymptomEngine.calculateDayRatio(logs);
    
    // Determine trend
    let trend = 'Stable';
    if (logs.length >= 14) {
      const midpoint = Math.floor(logs.length / 2);
      const firstHalf = logs.slice(0, midpoint);
      const secondHalf = logs.slice(midpoint);
      
      const firstHalfRatio = SymptomEngine.calculateDayRatio(firstHalf);
      const secondHalfRatio = SymptomEngine.calculateDayRatio(secondHalf);
      
      if (secondHalfRatio.badDayPercentage > firstHalfRatio.badDayPercentage + 15) {
        trend = 'Worsening - more bad days in recent period';
      } else if (secondHalfRatio.badDayPercentage < firstHalfRatio.badDayPercentage - 15) {
        trend = 'Improving - fewer bad days in recent period';
      }
    }
    
    return {
      goodDays: dayRatio.goodDays,
      badDays: dayRatio.badDays,
      percentage: dayRatio.badDayPercentage,
      trend,
    };
  }
  
  /**
   * Format summary as text for printing/sharing
   */
  static formatSummaryAsText(summary: AppointmentPreparationSummary): string {
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════');
    lines.push('     APPOINTMENT PREPARATION SUMMARY');
    lines.push('═══════════════════════════════════════════════');
    lines.push('');
    
    // Appointment details
    lines.push(`Provider: ${summary.appointment.providerName}`);
    lines.push(`Date: ${new Date(summary.appointment.appointmentDate).toLocaleDateString()}`);
    if (summary.appointment.appointmentTime) {
      lines.push(`Time: ${summary.appointment.appointmentTime}`);
    }
    lines.push(`Purpose: ${summary.appointment.purposeDetails || summary.appointment.purpose}`);
    lines.push('');
    
    // Data period
    lines.push(`Summary Period: ${new Date(summary.dateRange.start).toLocaleDateString()} - ${new Date(summary.dateRange.end).toLocaleDateString()}`);
    lines.push('');
    
    // Day quality
    lines.push('─────────────────────────────────────────────');
    lines.push('FUNCTIONAL STATUS');
    lines.push('─────────────────────────────────────────────');
    lines.push(`Good Days: ${summary.dayQualitySummary.goodDays}`);
    lines.push(`Bad Days: ${summary.dayQualitySummary.badDays} (${summary.dayQualitySummary.percentage}%)`);
    lines.push(`Trend: ${summary.dayQualitySummary.trend}`);
    lines.push('');
    
    // Recent symptoms
    if (summary.recentSymptoms.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('RECENT SYMPTOMS');
      lines.push('─────────────────────────────────────────────');
      summary.recentSymptoms.slice(0, 7).forEach(symptom => {
        lines.push(
          `• ${symptom.symptomName}: ${symptom.frequency}% of days, avg severity ${symptom.averageSeverity}/10 (${symptom.trend})`
        );
      });
      lines.push('');
    }
    
    // Changed symptoms
    if (summary.changedSymptoms.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('NEW OR CHANGED SYMPTOMS');
      lines.push('─────────────────────────────────────────────');
      summary.changedSymptoms.forEach(change => {
        lines.push(`• ${change.symptomName} (${change.change})`);
        lines.push(`  ${change.details}`);
      });
      lines.push('');
    }
    
    // Activity limitations
    if (summary.recentLimitations.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('ACTIVITY LIMITATIONS');
      lines.push('─────────────────────────────────────────────');
      summary.recentLimitations.forEach(limitation => {
        lines.push(`• ${limitation.activityName} (Impact: ${limitation.impactLevel}/10, ${limitation.frequency}% of attempts)`);
        limitation.examples.slice(0, 2).forEach(example => {
          lines.push(`  - ${example}`);
        });
      });
      lines.push('');
    }
    
    // Medication changes
    if (summary.medicationChanges.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('MEDICATION UPDATES');
      lines.push('─────────────────────────────────────────────');
      summary.medicationChanges.forEach(change => {
        lines.push(`• ${change.medicationName} (${change.status}${change.date ? ` on ${new Date(change.date).toLocaleDateString()}` : ''})`);
        if (change.effectiveness) {
          lines.push(`  Effectiveness: ${change.effectiveness}`);
        }
        if (change.sideEffects && change.sideEffects.length > 0) {
          lines.push(`  Side effects: ${change.sideEffects.join(', ')}`);
        }
      });
      lines.push('');
    }
    
    // Discussion points
    if (summary.discussionPoints.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('KEY DISCUSSION POINTS');
      lines.push('─────────────────────────────────────────────');
      summary.discussionPoints.forEach((point, i) => {
        lines.push(`${i + 1}. ${point}`);
      });
      lines.push('');
    }
    
    // Questions
    if (summary.suggestedQuestions.length > 0) {
      lines.push('─────────────────────────────────────────────');
      lines.push('QUESTIONS FOR PROVIDER');
      lines.push('─────────────────────────────────────────────');
      summary.suggestedQuestions.forEach((question, i) => {
        lines.push(`${i + 1}. ${question}`);
      });
      lines.push('');
    }
    
    lines.push('═══════════════════════════════════════════════');
    
    return lines.join('\n');
  }
}
