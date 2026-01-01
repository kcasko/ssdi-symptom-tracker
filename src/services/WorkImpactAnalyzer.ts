/**
 * Work Impact Analyzer
 * Maps documented symptoms/limitations to specific job duties
 * 
 * This is high leverage for SSDI because:
 * - Shows you can't do YOUR past work (not just "work in general")
 * - Provides concrete duty-by-duty evidence
 * - Feeds directly into RFC and SSA forms
 * - Reuses existing symptom data
 */

import {
  WorkHistory,
  WorkImpact,
  DutyImpact,
  InterferingFactor,
  JobDuty,
} from '../domain/models/WorkHistory';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';

interface AnalysisOptions {
  workHistory: WorkHistory;
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
  photos?: PhotoAttachment[];
  startDate: string;
  endDate: string;
}

export class WorkImpactAnalyzer {
  /**
   * Analyze how symptoms prevent you from performing past job duties
   */
  static analyzeWorkImpact(options: AnalysisOptions): WorkImpact {
    const { workHistory, dailyLogs, activityLogs, limitations, photos = [], startDate, endDate } = options;
    
    // Filter logs to date range
    const filteredDailyLogs = this.filterByDateRange(dailyLogs, startDate, endDate);
    const filteredActivityLogs = this.filterByDateRange(activityLogs, startDate, endDate);
    
    // Analyze each job duty
    const dutyImpacts: DutyImpact[] = workHistory.duties.map(duty => 
      this.analyzeDutyImpact(duty, filteredDailyLogs, filteredActivityLogs, limitations)
    );
    
    // Calculate overall impact score
    const impactScore = this.calculateOverallImpact(dutyImpacts, workHistory.duties);
    
    // Determine if can return to this job
    const canReturnToThisJob = this.canReturnToThisJob(dutyImpacts, workHistory.duties);
    
    // Generate impact statements
    const impactStatements = this.generateImpactStatements(
      dutyImpacts,
      workHistory,
      filteredDailyLogs,
      limitations
    );
    
    // Collect evidence
    const evidenceBase = {
      dailyLogIds: filteredDailyLogs.map(l => l.id),
      activityLogIds: filteredActivityLogs.map(l => l.id),
      limitationIds: limitations.map(l => l.id),
      photoIds: photos.map(p => p.id),
    };
    
    return {
      workHistoryId: workHistory.id,
      jobTitle: workHistory.jobTitle,
      canReturnToThisJob,
      impactScore,
      dutyImpacts,
      evidenceBase,
      impactStatements,
      analysisStartDate: startDate,
      analysisEndDate: endDate,
      generatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Analyze impact on a specific job duty
   */
  private static analyzeDutyImpact(
    duty: JobDuty,
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): DutyImpact {
    const interferingFactors: InterferingFactor[] = [];
    
    // Check symptoms that interfere with this duty's requirements
    if (duty.physicalRequirements) {
      // Standing requirements
      if (duty.physicalRequirements.standing) {
        const standingFactors = this.findStandingInterference(dailyLogs, limitations);
        interferingFactors.push(...standingFactors);
      }
      
      // Sitting requirements
      if (duty.physicalRequirements.sitting) {
        const sittingFactors = this.findSittingInterference(dailyLogs, limitations);
        interferingFactors.push(...sittingFactors);
      }
      
      // Walking requirements
      if (duty.physicalRequirements.walking) {
        const walkingFactors = this.findWalkingInterference(dailyLogs, activityLogs, limitations);
        interferingFactors.push(...walkingFactors);
      }
      
      // Lifting requirements
      if (duty.physicalRequirements.lifting) {
        const liftingFactors = this.findLiftingInterference(
          activityLogs,
          limitations,
          duty.physicalRequirements.lifting
        );
        interferingFactors.push(...liftingFactors);
      }
      
      // Fine dexterity requirements
      if (duty.physicalRequirements.fineDexterity) {
        const dexterityFactors = this.findDexterityInterference(dailyLogs, limitations);
        interferingFactors.push(...dexterityFactors);
      }
      
      // Concentration requirements
      if (duty.physicalRequirements.concentration) {
        const concentrationFactors = this.findConcentrationInterference(dailyLogs);
        interferingFactors.push(...concentrationFactors);
      }
      
      // Memory requirements
      if (duty.physicalRequirements.memory) {
        const memoryFactors = this.findMemoryInterference(dailyLogs, limitations);
        interferingFactors.push(...memoryFactors);
      }
    }
    
    // Calculate severity score
    const severityScore = this.calculateDutySeverity(interferingFactors);
    
    // Determine if can perform
    const canPerform = this.determineCanPerform(severityScore, duty.isEssential);
    
    // Generate explanation
    const impactExplanation = this.generateDutyExplanation(
      duty,
      interferingFactors,
      canPerform
    );
    
    // Collect supporting log IDs
    const supportingLogIds = interferingFactors.flatMap(f => f.logIds);
    
    return {
      dutyId: duty.id,
      dutyDescription: duty.description,
      canPerform,
      interferingFactors,
      severityScore,
      supportingLogIds,
      impactExplanation,
    };
  }
  
  /**
   * Find symptoms/limitations that interfere with standing
   */
  private static findStandingInterference(
    dailyLogs: DailyLog[],
    limitations: Limitation[]
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // Check for leg/knee/hip/back pain symptoms
    const standingSymptoms = dailyLogs.flatMap(log =>
      log.symptoms.filter(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('leg') ||
          symptom.name.toLowerCase().includes('knee') ||
          symptom.name.toLowerCase().includes('hip') ||
          symptom.name.toLowerCase().includes('back') ||
          symptom.name.toLowerCase().includes('ankle') ||
          symptom.name.toLowerCase().includes('balance')
        ) && s.severity >= 5;
      }).map(s => ({ ...s, logId: log.id }))
    );
    
    // Group by symptom ID
    const symptomGroups = this.groupBySymptomId(standingSymptoms);
    
    Object.entries(symptomGroups).forEach(([symptomId, occurrences]) => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      const severities = occurrences.map(o => o.severity);
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      const maxSeverity = Math.max(...severities);
      const percentage = (occurrences.length / dailyLogs.length) * 100;
      
      factors.push({
        type: 'symptom',
        id: symptomId,
        name: symptom.name,
        interferenceDescription: `${symptom.name} prevents prolonged standing`,
        occurrenceCount: occurrences.length,
        occurrencePercentage: percentage,
        averageSeverity: avgSeverity,
        maxSeverity,
        logIds: occurrences.map(o => o.logId),
      });
    });
    
    // Check for standing limitations
    const standingLimitations = limitations.filter(l =>
      l.isActive && l.category === 'standing'
    );
    
    standingLimitations.forEach(limitation => {
      factors.push({
        type: 'limitation',
        id: limitation.id,
        name: limitation.category,
        interferenceDescription: `Documented ${limitation.category} limitation`,
        occurrenceCount: 1,
        occurrencePercentage: 100,
        averageSeverity: 7,
        maxSeverity: 8,
        logIds: [limitation.id],
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms/limitations that interfere with sitting
   */
  private static findSittingInterference(
    dailyLogs: DailyLog[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limitations: Limitation[]
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // Check for back/neck pain
    const sittingSymptoms = dailyLogs.flatMap(log =>
      log.symptoms.filter(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('back') ||
          symptom.name.toLowerCase().includes('neck') ||
          symptom.name.toLowerCase().includes('spine')
        ) && s.severity >= 5;
      }).map(s => ({ ...s, logId: log.id }))
    );
    
    const symptomGroups = this.groupBySymptomId(sittingSymptoms);
    
    Object.entries(symptomGroups).forEach(([symptomId, occurrences]) => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      const severities = occurrences.map(o => o.severity);
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      const maxSeverity = Math.max(...severities);
      const percentage = (occurrences.length / dailyLogs.length) * 100;
      
      factors.push({
        type: 'symptom',
        id: symptomId,
        name: symptom.name,
        interferenceDescription: `${symptom.name} prevents prolonged sitting`,
        occurrenceCount: occurrences.length,
        occurrencePercentage: percentage,
        averageSeverity: avgSeverity,
        maxSeverity,
        logIds: occurrences.map(o => o.logId),
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms/limitations that interfere with walking
   */
  private static findWalkingInterference(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // Check for walking activities that were problematic
    const walkingActivities = activityLogs.filter(log => {
      const activity = getActivityById(log.activityId);
      return activity && (
        activity.name.toLowerCase().includes('walk') ||
        activity.name.toLowerCase().includes('stairs')
      ) && (log.stoppedEarly || log.immediateImpact.overallImpact >= 7);
    });
    
    if (walkingActivities.length > 0) {
      const avgImpact = walkingActivities.reduce((sum, log) => {
        return sum + log.immediateImpact.overallImpact;
      }, 0) / walkingActivities.length;
      
      factors.push({
        type: 'limitation',
        id: 'walking_activity',
        name: 'Walking difficulty',
        interferenceDescription: `Walking activities stopped early or caused severe symptoms in ${walkingActivities.length} documented instances`,
        occurrenceCount: walkingActivities.length,
        occurrencePercentage: (walkingActivities.length / activityLogs.length) * 100,
        averageSeverity: avgImpact,
        maxSeverity: 10,
        logIds: walkingActivities.map(a => a.id),
      });
    }
    
    // Check walking limitations
    const walkingLimitations = limitations.filter(l =>
      l.isActive && l.category === 'walking'
    );
    
    walkingLimitations.forEach(limitation => {
      factors.push({
        type: 'limitation',
        id: limitation.id,
        name: limitation.category,
        interferenceDescription: `Documented ${limitation.category} limitation`,
        occurrenceCount: 1,
        occurrencePercentage: 100,
        averageSeverity: 7,
        maxSeverity: 8,
        logIds: [limitation.id],
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms/limitations that interfere with lifting
   */
  private static findLiftingInterference(
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    requiredWeight: number
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // Check for lifting activities
    const liftingActivities = activityLogs.filter(log => {
      const activity = getActivityById(log.activityId);
      return activity && (
        activity.name.toLowerCase().includes('lift') ||
        activity.name.toLowerCase().includes('carry') ||
        activity.name.toLowerCase().includes('groceries')
      ) && (log.stoppedEarly || log.immediateImpact.overallImpact >= 7);
    });
    
    if (liftingActivities.length > 0) {
      factors.push({
        type: 'limitation',
        id: 'lifting_activity',
        name: 'Lifting difficulty',
        interferenceDescription: `Cannot safely lift ${requiredWeight} lbs - lifting activities caused severe symptoms in ${liftingActivities.length} documented instances`,
        occurrenceCount: liftingActivities.length,
        occurrencePercentage: 100,
        averageSeverity: 8,
        maxSeverity: 10,
        logIds: liftingActivities.map(a => a.id),
      });
    }
    
    // Check lifting limitations
    const liftingLimitations = limitations.filter(l =>
      l.isActive && (l.category === 'lifting' || l.category === 'carrying')
    );
    
    liftingLimitations.forEach(limitation => {
      factors.push({
        type: 'limitation',
        id: limitation.id,
        name: limitation.category,
        interferenceDescription: `${limitation.category} limitation - cannot meet ${requiredWeight} lb requirement`,
        occurrenceCount: 1,
        occurrencePercentage: 100,
        averageSeverity: 7,
        maxSeverity: 8,
        logIds: [limitation.id],
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms/limitations that interfere with fine dexterity
   */
  private static findDexterityInterference(
    dailyLogs: DailyLog[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limitations: Limitation[]
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // Check for hand/finger/wrist symptoms
    const dexteritySymptoms = dailyLogs.flatMap(log =>
      log.symptoms.filter(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('hand') ||
          symptom.name.toLowerCase().includes('finger') ||
          symptom.name.toLowerCase().includes('wrist') ||
          symptom.name.toLowerCase().includes('numb') ||
          symptom.name.toLowerCase().includes('tingling')
        ) && s.severity >= 5;
      }).map(s => ({ ...s, logId: log.id }))
    );
    
    const symptomGroups = this.groupBySymptomId(dexteritySymptoms);
    
    Object.entries(symptomGroups).forEach(([symptomId, occurrences]) => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      const severities = occurrences.map(o => o.severity);
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      const percentage = (occurrences.length / dailyLogs.length) * 100;
      
      factors.push({
        type: 'symptom',
        id: symptomId,
        name: symptom.name,
        interferenceDescription: `${symptom.name} impairs fine motor tasks (typing, gripping, manipulating objects)`,
        occurrenceCount: occurrences.length,
        occurrencePercentage: percentage,
        averageSeverity: avgSeverity,
        maxSeverity: Math.max(...severities),
        logIds: occurrences.map(o => o.logId),
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms that interfere with concentration
   */
  private static findConcentrationInterference(dailyLogs: DailyLog[]): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    // High pain days = concentration issues
    const highPainDays = dailyLogs.filter(log => (log.overallSeverity || 0) >= 7);
    
    if (highPainDays.length > dailyLogs.length * 0.2) {
      factors.push({
        type: 'symptom',
        id: 'pain_distraction',
        name: 'Pain-related concentration difficulty',
        interferenceDescription: `Severe pain (7+/10) prevents sustained concentration in ${highPainDays.length} of ${dailyLogs.length} days`,
        occurrenceCount: highPainDays.length,
        occurrencePercentage: (highPainDays.length / dailyLogs.length) * 100,
        averageSeverity: 8,
        maxSeverity: 10,
        logIds: highPainDays.map(d => d.id),
      });
    }
    
    // Brain fog / cognitive symptoms
    const cognitiveSymptoms = dailyLogs.flatMap(log =>
      log.symptoms.filter(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('fog') ||
          symptom.name.toLowerCase().includes('concentration') ||
          symptom.name.toLowerCase().includes('focus')
        );
      }).map(s => ({ ...s, logId: log.id }))
    );
    
    const symptomGroups = this.groupBySymptomId(cognitiveSymptoms);
    
    Object.entries(symptomGroups).forEach(([symptomId, occurrences]) => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      const percentage = (occurrences.length / dailyLogs.length) * 100;
      
      factors.push({
        type: 'symptom',
        id: symptomId,
        name: symptom.name,
        interferenceDescription: `${symptom.name} prevents sustained attention and focus`,
        occurrenceCount: occurrences.length,
        occurrencePercentage: percentage,
        averageSeverity: 7,
        maxSeverity: 10,
        logIds: occurrences.map(o => o.logId),
      });
    });
    
    return factors;
  }
  
  /**
   * Find symptoms that interfere with memory
   */
  private static findMemoryInterference(
    dailyLogs: DailyLog[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limitations: Limitation[]
  ): InterferingFactor[] {
    const factors: InterferingFactor[] = [];
    
    const memorySymptoms = dailyLogs.flatMap(log =>
      log.symptoms.filter(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && symptom.name.toLowerCase().includes('memory');
      }).map(s => ({ ...s, logId: log.id }))
    );
    
    const symptomGroups = this.groupBySymptomId(memorySymptoms);
    
    Object.entries(symptomGroups).forEach(([symptomId, occurrences]) => {
      const symptom = getSymptomById(symptomId);
      if (!symptom) return;
      
      factors.push({
        type: 'symptom',
        id: symptomId,
        name: symptom.name,
        interferenceDescription: `${symptom.name} impairs ability to remember instructions and procedures`,
        occurrenceCount: occurrences.length,
        occurrencePercentage: (occurrences.length / dailyLogs.length) * 100,
        averageSeverity: 7,
        maxSeverity: 10,
        logIds: occurrences.map(o => o.logId),
      });
    });
    
    return factors;
  }
  
  /**
   * Group symptoms by ID for frequency analysis
   */
  private static groupBySymptomId(symptoms: Array<{ symptomId: string; severity: number; logId: string }>): Record<string, typeof symptoms> {
    return symptoms.reduce((groups, symptom) => {
      if (!groups[symptom.symptomId]) {
        groups[symptom.symptomId] = [];
      }
      groups[symptom.symptomId].push(symptom);
      return groups;
    }, {} as Record<string, typeof symptoms>);
  }
  
  /**
   * Calculate severity score for a duty based on interfering factors
   */
  private static calculateDutySeverity(factors: InterferingFactor[]): number {
    if (factors.length === 0) return 0;
    
    // Weight by occurrence percentage and average severity
    const weightedScores = factors.map(f => 
      (f.occurrencePercentage / 100) * f.averageSeverity
    );
    
    const avgScore = weightedScores.reduce((a, b) => a + b, 0) / weightedScores.length;
    return Math.min(10, avgScore);
  }
  
  /**
   * Determine if can perform duty
   */
  private static determineCanPerform(
    severityScore: number,
    isEssential: boolean
  ): DutyImpact['canPerform'] {
    if (severityScore >= 8) return 'no';
    if (severityScore >= 6) return isEssential ? 'no' : 'with_difficulty';
    if (severityScore >= 4) return 'with_difficulty';
    return 'yes';
  }
  
  /**
   * Generate explanation for duty impact
   */
  private static generateDutyExplanation(
    duty: JobDuty,
    factors: InterferingFactor[],
    canPerform: DutyImpact['canPerform']
  ): string {
    if (factors.length === 0) {
      return `Can perform ${duty.description} without documented limitations.`;
    }
    
    const factorList = factors.map(f => 
      `${f.name} (present ${Math.round(f.occurrencePercentage)}% of time, avg severity ${f.averageSeverity.toFixed(1)}/10)`
    ).join('; ');
    
    if (canPerform === 'no') {
      return `Cannot perform ${duty.description} due to: ${factorList}. This duty is ${duty.percentOfTime}% of job responsibilities.`;
    }
    
    if (canPerform === 'with_difficulty') {
      return `Can perform ${duty.description} only with difficulty and reduced efficiency due to: ${factorList}.`;
    }
    
    return `Can perform ${duty.description} with some interference from: ${factorList}.`;
  }
  
  /**
   * Calculate overall impact score
   */
  private static calculateOverallImpact(dutyImpacts: DutyImpact[], duties: JobDuty[]): number {
    // Weight by percentage of time spent on each duty
    const weightedScores = dutyImpacts.map((impact, index) => {
      const duty = duties[index];
      return impact.severityScore * (duty.percentOfTime / 100);
    });
    
    return weightedScores.reduce((a, b) => a + b, 0);
  }
  
  /**
   * Determine if can return to this job
   */
  private static canReturnToJob(dutyImpacts: DutyImpact[], duties: JobDuty[]): boolean {
    // Cannot return if any ESSENTIAL duty cannot be performed
    for (let i = 0; i < dutyImpacts.length; i++) {
      const impact = dutyImpacts[i];
      const duty = duties[i];
      
      if (duty.isEssential && impact.canPerform === 'no') {
        return false;
      }
    }
    
    // Cannot return if >50% of duties have significant impairment
    const significantImpairments = dutyImpacts.filter(i => 
      i.canPerform === 'no' || i.canPerform === 'with_difficulty'
    );
    
    if (significantImpairments.length > duties.length * 0.5) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Generate impact statements for SSDI forms
   */
  private static generateImpactStatements(
    dutyImpacts: DutyImpact[],
    workHistory: WorkHistory,
    dailyLogs: DailyLog[],
    limitations: Limitation[]
  ): string[] {
    const statements: string[] = [];
    
    // Overall statement
    const cannotPerformCount = dutyImpacts.filter(d => d.canPerform === 'no').length;
    if (cannotPerformCount > 0) {
      statements.push(
        `Cannot perform ${cannotPerformCount} of ${dutyImpacts.length} essential job duties for ${workHistory.jobTitle} position.`
      );
    }
    
    // Essential duty failures
    const essentialFailures = dutyImpacts.filter(d => 
      d.canPerform === 'no' && 
      workHistory.duties.find(duty => duty.id === d.dutyId)?.isEssential
    );
    
    essentialFailures.forEach(impact => {
      const topFactor = impact.interferingFactors[0];
      if (topFactor) {
        statements.push(
          `Cannot perform essential duty "${impact.dutyDescription}" due to ${topFactor.name} documented in ${topFactor.occurrenceCount} instances over ${dailyLogs.length} days.`
        );
      }
    });
    
    // Physical demand mismatches
    const exertionLevel = workHistory.physicalDemands.exertionLevel;
    const hasLiftingLimitation = limitations.some(l => 
      (l.category === 'lifting' || l.category === 'carrying') && l.isActive
    );
    
    if (hasLiftingLimitation && (exertionLevel === 'medium' || exertionLevel === 'heavy')) {
      statements.push(
        `Job requires ${exertionLevel} exertion level. Documented lifting limitations prevent meeting this requirement.`
      );
    }
    
    return statements;
  }
  
  /**
   * Filter logs by date range
   */
  private static filterByDateRange<T extends { logDate?: string; date?: string; activityDate?: string }>(
    logs: T[],
    startDate: string,
    endDate: string
  ): T[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return logs.filter(log => {
      const logDate = new Date(log.logDate || log.activityDate || log.logDate || '');
      return logDate >= start && logDate <= end;
    });
  }
}
