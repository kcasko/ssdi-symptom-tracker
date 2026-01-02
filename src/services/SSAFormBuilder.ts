/**
 * SSA Form Builder
 * 
 * Pre-populates Social Security Administration disability forms using
 * VALIDATED data from RFC and WorkImpact analyses.
 * 
 * CRITICAL: Does NOT use raw logs directly - only uses analyzed data
 * to ensure consistency and avoid premature/unvalidated claims.
 */

import {
  SSAFormPackage,
  DisabilityReport,
  FunctionReport,
  WorkHistoryReport,
  RFCSummary,
  EvidenceSummary,
  MedicalCondition,
  WorkHistoryEntry,
  MedicationEntry,
  DailyActivityDescription,
  AffectedAbility,
  DetailedJobDescription,
  DutyImpactSummary,
  SSAFormValidation,
  DataQualityIndicators
} from '../domain/models/SSAForm';
import { RFC } from '../domain/models/RFC';
import { WorkImpact } from '../domain/models/WorkHistory';
import { DailyLog } from '../domain/models/DailyLog';
import { Limitation } from '../domain/models/Limitation';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Appointment } from '../domain/models/Appointment';
import { Medication } from '../domain/models/Medication';

export class SSAFormBuilder {
  /**
   * Build complete SSA form package from validated data
   * 
   * @param rfc - REQUIRED: Validated RFC analysis
   * @param workImpacts - REQUIRED: Work impact analyses for all past jobs
   * @param dailyLogs - For date ranges and evidence tracking only
   * @param limitations - For medical conditions
   * @param activityLogs - For daily activities section
   * @param appointments - For medical treatment section
   * @param medications - For medication section
   */
  static buildFormPackage(
    rfc: RFC,
    workImpacts: WorkImpact[],
    dailyLogs: DailyLog[],
    limitations: Limitation[],
    activityLogs: ActivityLog[],
    appointments: Appointment[],
    medications: Medication[]
  ): SSAFormPackage {
    // Validate readiness
    const loggingPeriodDays = this.getLoggingPeriodDays(dailyLogs);
    const validation = SSAFormValidation.isReadyForFormGeneration(
      dailyLogs.length,
      loggingPeriodDays,
      true, // hasRFC
      workImpacts.length > 0
    );
    
    const evidenceSummary = this.buildEvidenceSummary(
      dailyLogs,
      activityLogs,
      limitations,
      rfc
    );
    
    return {
      generatedDate: new Date(),
      disabilityReport: this.buildDisabilityReport(
        rfc,
        workImpacts,
        limitations,
        medications,
        appointments,
        evidenceSummary
      ),
      functionReport: this.buildFunctionReport(rfc, activityLogs, evidenceSummary),
      workHistoryReport: this.buildWorkHistoryReport(workImpacts, evidenceSummary),
      rfcSummary: this.buildRFCSummary(rfc, evidenceSummary),
      whyCannotWork: this.buildWhyCannotWorkNarrative(workImpacts, rfc),
      howConditionsLimit: this.buildHowConditionsLimitNarrative(rfc),
      dataQuality: this.assessDataQuality(
        dailyLogs,
        loggingPeriodDays,
        rfc,
        workImpacts,
        appointments,
        medications
      ),
      warnings: validation.warnings
    };
  }
  
  /**
   * Build Disability Report (SSA-3368)
   */
  private static buildDisabilityReport(
    rfc: RFC,
    workImpacts: WorkImpact[],
    limitations: Limitation[],
    medications: Medication[],
    appointments: Appointment[],
    evidenceSummary: EvidenceSummary
  ): DisabilityReport {
    // Extract medical conditions from limitations
    const conditions = this.extractMedicalConditions(limitations, evidenceSummary);
    
    // Build work history from work impacts
    const workHistory = workImpacts.map(wi => this.buildWorkHistoryEntry(wi));
    
    // Build medication list
    const medicationEntries = medications.map(m => this.buildMedicationEntry(m));
    
    // Build medical treatment list
    const medicalTreatment = appointments.map(a => ({
      providerName: a.providerName,
      providerType: 'doctor' as const,
      address: a.facilityName || '',
      phone: '',
      dateFirstVisit: new Date(a.appointmentDate),
      dateLastVisit: new Date(a.appointmentDate),
      frequencyOfVisits: 'As documented in logs',
      treatmentFor: a.purpose,
      sourceLogIds: [a.id]
    }));
    
    return {
      conditions,
      dateBecomesDisabled: evidenceSummary.dateRangeStart,
      stillWorking: false,
      howConditionsLimit: this.buildHowConditionsLimitNarrative(rfc),
      workHistory,
      didConditionsAffectWork: workImpacts.some(wi => !wi.canReturnToThisJob),
      whenDidConditionsAffectWork: evidenceSummary.dateRangeStart,
      howConditionsAffectedWork: this.buildWorkAffectedNarrative(workImpacts),
      medications: medicationEntries,
      medicalTreatment,
      education: {
        highestGradeCompleted: 12, // Default - should be configurable
        specialEducation: false
      },
      evidenceSummary
    };
  }
  
  /**
   * Build Function Report (SSA-3373)
   * Uses RFC data to describe daily living limitations
   */
  private static buildFunctionReport(
    rfc: RFC,
    activityLogs: ActivityLog[],
    evidenceSummary: EvidenceSummary
  ): FunctionReport {
    return {
      dailyActivities: this.buildDailyActivities(activityLogs),
      affectedAbilities: this.buildAffectedAbilities(rfc),
      socialLimitations: this.buildSocialLimitations(rfc),
      changesSinceDisability: this.extractChangesSinceDisability(rfc),
      evidenceSummary
    };
  }
  
  /**
   * Build Work History Report
   * Uses WorkImpact data to show why you can't do past work
   */
  private static buildWorkHistoryReport(
    workImpacts: WorkImpact[],
    evidenceSummary: EvidenceSummary
  ): WorkHistoryReport {
    const jobs = workImpacts.map(wi => this.buildDetailedJobDescription(wi));
    const reasonsCannotDoPastWork = this.extractReasonsCannotWork(workImpacts);
    
    return {
      jobs,
      canDoAnyPastWork: workImpacts.every(wi => wi.canReturnToThisJob),
      reasonsCannotDoPastWork,
      evidenceSummary
    };
  }
  
  /**
   * Build RFC Summary for forms
   */
  private static buildRFCSummary(rfc: RFC, evidenceSummary: EvidenceSummary): RFCSummary {
    return {
      workCapacityLevel: rfc.overallRating,
      canWorkFullTime: rfc.canWorkFullTime,
      sittingCapacity: this.formatCapacity('sitting', rfc.exertionalLimitations.sitting),
      standingCapacity: this.formatCapacity('standing', rfc.exertionalLimitations.standing),
      walkingCapacity: this.formatCapacity('walking', rfc.exertionalLimitations.walking),
      liftingCapacity: this.formatCapacity('lifting', rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional),
      posturalLimitations: this.formatPosturalLimitations(rfc.posturalLimitations),
      manipulativeLimitations: this.formatManipulativeLimitations(rfc.manipulativeLimitations),
      environmentalRestrictions: this.formatEnvironmentalRestrictions(rfc.environmentalLimitations),
      mentalLimitations: this.formatMentalLimitations(rfc.mentalLimitations),
      requiredAccommodations: rfc.requiresAccommodations || [],
      evidenceSummary
    };
  }
  
  /**
   * Extract medical conditions from limitations
   */
  private static extractMedicalConditions(
    limitations: Limitation[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    evidenceSummary: EvidenceSummary
  ): MedicalCondition[] {
    // Group limitations by category
    const conditionMap = new Map<string, Limitation[]>();
    
    limitations.forEach(lim => {
      const condition = lim.category || 'General disability';
      if (!conditionMap.has(condition)) {
        conditionMap.set(condition, []);
      }
      conditionMap.get(condition)!.push(lim);
    });
    
    return Array.from(conditionMap.entries()).map(([name, lims]) => {
      const dates = lims.map(l => new Date(l.createdAt));
      const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
      
      return {
        name,
        dateFirstNoticedOrDiagnosed: firstDate,
        limitationType: this.determineLimitationType(lims),
        sourceLogIds: lims.map(l => l.id),
        firstDocumentedDate: firstDate,
        documentationFrequency: lims.length
      };
    });
  }
  
  private static determineLimitationType(
    limitations: Limitation[]
  ): 'physical' | 'mental' | 'both' {
    const hasPhysical = limitations.some(l =>
      ['mobility', 'strength', 'endurance', 'pain'].includes(l.category)
    );
    const hasMental = limitations.some(l =>
      ['cognitive', 'concentration', 'social'].includes(l.category)
    );
    
    if (hasPhysical && hasMental) return 'both';
    if (hasMental) return 'mental';
    return 'physical';
  }
  
  /**
   * Build work history entry from work impact
   */
  private static buildWorkHistoryEntry(workImpact: WorkImpact): WorkHistoryEntry {
    const affectedDuties = workImpact.dutyImpacts.filter(di => di.canPerform === 'no');
    
    return {
      jobTitle: workImpact.jobTitle,
      employer: 'See work history records',
      startDate: new Date(workImpact.analysisStartDate),
      endDate: new Date(workImpact.analysisEndDate),
      hoursPerWeek: 40, // Default - should be from WorkHistory if available
      payRate: 0, // Not available in WorkImpact
      physicalDemands: 'See job description',
      canReturnToJob: workImpact.canReturnToThisJob,
      impactStatement: workImpact.impactStatements[0] || 'Cannot perform essential duties',
      essentialDutiesAffected: affectedDuties.length,
      totalDuties: workImpact.dutyImpacts.length
    };
  }
  
  private static formatPhysicalDemands(demands: any): string {
    const parts: string[] = [];
    
    if (demands.exertionLevel) {
      parts.push(`Exertion: ${demands.exertionLevel}`);
    }
    if (demands.liftingRequirement) {
      parts.push(`Lifting: ${demands.liftingRequirement.maxWeight} lbs max, ${demands.liftingRequirement.frequentWeight} lbs frequently`);
    }
    if (demands.standingHours) {
      parts.push(`Standing: ${demands.standingHours} hours/day`);
    }
    if (demands.walkingHours) {
      parts.push(`Walking: ${demands.walkingHours} hours/day`);
    }
    if (demands.sittingHours) {
      parts.push(`Sitting: ${demands.sittingHours} hours/day`);
    }
    
    return parts.join('; ');
  }
  
  /**
   * Build medication entry
   */
  private static buildMedicationEntry(medication: Medication): MedicationEntry {
    return {
      name: medication.name,
      prescribedFor: medication.purpose.join(', ') || 'As prescribed',
      startDate: medication.startDate ? new Date(medication.startDate) : new Date(),
      endDate: medication.endDate ? new Date(medication.endDate) : undefined,
      sideEffects: medication.sideEffects || [],
      sourceLogIds: [medication.id],
      consistentUse: medication.frequency !== 'as_needed'
    };
  }
  
  /**
   * Build daily activities from activity logs
   */
  private static buildDailyActivities(activityLogs: ActivityLog[]): DailyActivityDescription[] {
    // Group by activity
    const activityMap = new Map<string, ActivityLog[]>();
    activityLogs.forEach(log => {
      if (!activityMap.has(log.activityId)) {
        activityMap.set(log.activityId, []);
      }
      activityMap.get(log.activityId)!.push(log);
    });
    
    return Array.from(activityMap.entries()).map(([activity, logs]) => {
      const totalLogs = logs.length;
      const limitedLogs = logs.filter(l => l.immediateImpact.overallImpact >= 5);
      const severelyLimited = limitedLogs.length / totalLogs > 0.5;
      
      return {
        activity,
        canDo: !severelyLimited,
        limitationDescription: severelyLimited
          ? `Limited in ${limitedLogs.length} of ${totalLogs} documented instances`
          : undefined,
        frequency: this.determineFrequency(logs.length),
        assistanceNeeded: logs.some(l => l.assistanceNeeded),
        assistanceType: logs.find(l => l.assistanceType)?.assistanceType,
        sourceLogIds: logs.map(l => l.id),
        documentedOccurrences: logs.length
      };
    });
  }
  
  private static determineFrequency(count: number): string {
    if (count > 100) return 'daily';
    if (count > 20) return 'weekly';
    if (count > 5) return 'occasionally';
    return 'rarely';
  }
  
  /**
   * Build affected abilities from RFC
   */
  private static buildAffectedAbilities(rfc: RFC): AffectedAbility[] {
    const abilities: AffectedAbility[] = [];
    
    // Exertional
    if (rfc.exertionalLimitations.sitting.maxContinuousMinutes < 2) {
      abilities.push({
        ability: 'sitting',
        affected: true,
        description: `Can sit only ${rfc.exertionalLimitations.sitting.maxContinuousMinutes} hours without break`,
        evidenceFromRFC: true,
        sourceLogIds: rfc.exertionalLimitations.sitting.evidence
      });
    }
    
    if (rfc.exertionalLimitations.standing.maxContinuousMinutes < 2) {
      abilities.push({
        ability: 'standing',
        affected: true,
        description: `Can stand only ${rfc.exertionalLimitations.standing.maxContinuousMinutes} hours without break`,
        evidenceFromRFC: true,
        sourceLogIds: rfc.exertionalLimitations.standing.evidence
      });
    }
    
    if (rfc.exertionalLimitations.walking.maxContinuousMinutes < 2) {
      abilities.push({
        ability: 'walking',
        affected: true,
        description: `Can walk only ${rfc.exertionalLimitations.walking.maxContinuousMinutes} hours without break`,
        evidenceFromRFC: true,
        sourceLogIds: rfc.exertionalLimitations.walking.evidence
      });
    }
    
    if (rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional < 25) {
      abilities.push({
        ability: 'lifting',
        affected: true,
        description: `Can lift only ${rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional} lbs occasionally, ${rfc.exertionalLimitations.lifting.maxWeightPoundsFrequent} lbs frequently`,
        evidenceFromRFC: true,
        sourceLogIds: rfc.exertionalLimitations.lifting.evidence
      });
    }
    
    // Postural
    Object.entries(rfc.posturalLimitations).forEach(([key, limitation]) => {
      if (limitation.frequency === 'never' || limitation.frequency === 'rarely') {
        const abilityMap: Record<string, any> = {
          stooping: 'bending',
          kneeling: 'kneeling',
          balancing: 'balancing'
        };
        
        if (abilityMap[key]) {
          abilities.push({
            ability: abilityMap[key],
            affected: true,
            description: limitation.reason,
            evidenceFromRFC: true,
            sourceLogIds: limitation.supportingEvidence
          });
        }
      }
    });
    
    // Mental
    if (rfc.mentalLimitations.concentration.requiresFrequentBreaks) {
      abilities.push({
        ability: 'concentration',
        affected: true,
        description: `Requires breaks every ${rfc.mentalLimitations.concentration.maxContinuousMinutes} minutes`,
        evidenceFromRFC: true,
        sourceLogIds: rfc.mentalLimitations.concentration.evidence
      });
    }
    
    if (rfc.mentalLimitations.memory.shortTermImpaired || rfc.mentalLimitations.memory.longTermImpaired) {
      abilities.push({
        ability: 'memory',
        affected: true,
        description: `Memory impairment: ${rfc.mentalLimitations.memory.shortTermImpaired ? 'short-term' : ''} ${rfc.mentalLimitations.memory.longTermImpaired ? 'long-term' : ''}`.trim(),
        evidenceFromRFC: true,
        sourceLogIds: rfc.mentalLimitations.memory.evidence
      });
    }
    
    return abilities;
  }
  
  /**
   * Build social limitations from RFC
   */
  private static buildSocialLimitations(rfc: RFC): any[] {
    const social = rfc.mentalLimitations.social;
    if (!social.limitedPublicContact && !social.limitedCoworkerContact && !social.limitedSupervisorContact) return [];
    
    return [
      {
        area: 'coworkers',
        hasLimitation: true,
        description: social.limitedPublicContact ? 'Limited public contact' : 'Limited coworker contact',
        sourceLogIds: social.evidence
      }
    ];
  }
  
  /**
   * Build detailed job description from work impact
   */
  private static buildDetailedJobDescription(workImpact: WorkImpact): DetailedJobDescription {
    // WorkImpact only has workHistoryId and jobTitle, not full workHistory object
    // This would need to be fetched separately if full details are needed
    
    return {
      jobTitle: workImpact.jobTitle,
      employer: 'See work history records',
      dates: { start: new Date(workImpact.analysisStartDate), end: new Date(workImpact.analysisEndDate) },
      daysPerWeek: 5, // Default
      hoursPerDay: 8, // Default
      hoursStanding: 0, // Would need full WorkHistory
      hoursWalking: 0, // Would need full WorkHistory
      hoursSitting: 0, // Would need full WorkHistory
      heaviestWeightLifted: 0, // Would need full WorkHistory
      frequentlyLiftedWeight: 0, // Would need full WorkHistory
      mainDuties: workImpact.dutyImpacts.map(di => di.dutyDescription),
      toolsAndEquipment: [],
      supervision: 'unsupervised',
      canReturnToJob: workImpact.canReturnToThisJob,
      dutiesAffected: workImpact.dutyImpacts.map(di => this.buildDutyImpactSummary(di)),
      overallImpactStatement: workImpact.impactStatements[0] || 'Cannot perform essential duties'
    };
  }
  
  private static buildDutyImpactSummary(dutyImpact: any): DutyImpactSummary {
    return {
      duty: dutyImpact.dutyDescription,
      canPerform: dutyImpact.canPerform,
      impactDescription: dutyImpact.impactExplanation,
      interferingFactors: dutyImpact.interferingFactors.map((f: any) => f.interferenceDescription),
      evidenceCount: dutyImpact.interferingFactors.reduce(
        (sum: number, f: any) => sum + f.occurrenceCount,
        0
      )
    };
  }
  
  /**
   * Build evidence summary
   */
  private static buildEvidenceSummary(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    rfc: RFC
  ): EvidenceSummary {
    const dates = dailyLogs.map(l => new Date(l.logDate));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const daysDiff = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      totalDailyLogs: dailyLogs.length,
      totalActivityLogs: activityLogs.length,
      totalLimitations: limitations.length,
      dateRangeStart: startDate,
      dateRangeEnd: endDate,
      consistentDocumentation: (dailyLogs.length / daysDiff) > 0.75,
      longTermTracking: daysDiff > 90,
      patternConsistency: (rfc.evidenceSummary?.consistentPatterns?.length || 0) > 0,
      topDocumentedSymptoms: [], // Would extract from dailyLogs
      topDocumentedLimitations: [] // Would extract from limitations
    };
  }
  
  /**
   * Formatting helpers
   */
  private static formatCapacity(type: string, capacity: any): string {
    if (typeof capacity === 'number') {
      return `${capacity} hours per day`;
    }
    
    return `${capacity.hoursWithoutBreak} hours without break, ${capacity.totalHoursPerDay} total hours per day`;
  }
  
  private static formatPosturalLimitations(postural: any): string[] {
    const limitations: string[] = [];
    Object.entries(postural).forEach(([key, lim]: [string, any]) => {
      if (lim.frequency === 'never' || lim.frequency === 'rarely') {
        limitations.push(`${key}: ${lim.reason}`);
      }
    });
    return limitations;
  }
  
  private static formatManipulativeLimitations(manipulative: any): string[] {
    const limitations: string[] = [];
    Object.entries(manipulative).forEach(([key, lim]: [string, any]) => {
      if (lim.limited) {
        limitations.push(`${key}: ${lim.description}`);
      }
    });
    return limitations;
  }
  
  private static formatEnvironmentalRestrictions(environmental: any): string[] {
    const restrictions: string[] = [];
    Object.entries(environmental).forEach(([key, lim]: [string, any]) => {
      if (lim.mustAvoid || lim.severity === 'severe') {
        restrictions.push(`${key}: ${lim.description}`);
      }
    });
    return restrictions;
  }
  
  private static formatMentalLimitations(mental: any): string[] {
    const limitations: string[] = [];
    Object.entries(mental).forEach(([key, lim]: [string, any]) => {
      if (lim.limited) {
        limitations.push(`${key}: ${lim.description}`);
      }
    });
    return limitations;
  }
  
  /**
   * Narrative builders
   */
  private static buildWhyCannotWorkNarrative(
    workImpacts: WorkImpact[],
    rfc: RFC
  ): string {
    const parts: string[] = [];
    
    parts.push(
      `Based on ${workImpacts.length} documented work history analyses and validated RFC assessment:`
    );
    parts.push('');
    
    workImpacts.forEach(wi => {
      if (!wi.canReturnToThisJob) {
        const affectedDuties = wi.dutyImpacts.filter(di => !di.canPerform);
        parts.push(
          `Cannot return to ${wi.jobTitle} due to inability to perform ${affectedDuties.length} essential duties:`
        );
        affectedDuties.slice(0, 3).forEach(duty => {
          parts.push(`  - ${duty.impactExplanation}`);
        });
        parts.push('');
      }
    });
    
    parts.push(`Overall work capacity: ${rfc.overallRating}`);
    parts.push(`Can work full-time: ${rfc.canWorkFullTime ? 'Yes' : 'No'}`);
    
    return parts.join('\n');
  }
  
  private static buildHowConditionsLimitNarrative(rfc: RFC): string {
    const parts: string[] = [];
    
    parts.push('Based on validated RFC analysis:');
    parts.push('');
    
    // Exertional
    const exert = rfc.exertionalLimitations;
    parts.push(`Sitting capacity: ${exert.sitting.maxContinuousMinutes} hours without break`);
    parts.push(`Standing capacity: ${exert.standing.maxContinuousMinutes} hours without break`);
    parts.push(`Walking capacity: ${exert.walking.maxContinuousMinutes} hours without break`);
    parts.push(
      `Lifting capacity: ${exert.lifting.maxWeightPoundsOccasional} lbs occasionally, ${exert.lifting.maxWeightPoundsFrequent} lbs frequently`
    );
    parts.push('');
    
    // Mental
    if (rfc.mentalLimitations.concentration.requiresFrequentBreaks) {
      parts.push(`Concentration: requires breaks every ${rfc.mentalLimitations.concentration.maxContinuousMinutes} minutes`);
    }
    if (rfc.mentalLimitations.memory.shortTermImpaired || rfc.mentalLimitations.memory.longTermImpaired) {
      parts.push(`Memory: ${rfc.mentalLimitations.memory.shortTermImpaired ? 'short-term impaired' : ''} ${rfc.mentalLimitations.memory.longTermImpaired ? 'long-term impaired' : ''}`.trim());
    }
    
    return parts.join('\n');
  }
  
  private static buildWorkAffectedNarrative(workImpacts: WorkImpact[]): string {
    const affected = workImpacts.filter(wi => !wi.canReturnToThisJob);
    if (affected.length === 0) {
      return 'No work impacts documented';
    }
    
    return affected
      .map(wi => `${wi.jobTitle}: ${wi.impactStatements[0] || 'Cannot perform essential duties'}`)
      .join('\n');
  }
  
  private static extractChangesSinceDisability(rfc: RFC): string[] {
    const changes: string[] = [];
    
    if (rfc.exertionalLimitations.sitting.maxContinuousMinutes < 6) {
      changes.push('Can no longer sit for full workday');
    }
    if (rfc.exertionalLimitations.standing.maxContinuousMinutes < 2) {
      changes.push('Can no longer stand for extended periods');
    }
    if (rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional < 25) {
      changes.push('Can no longer lift moderate weights');
    }
    
    return changes;
  }
  
  private static extractReasonsCannotWork(workImpacts: WorkImpact[]): string[] {
    const reasons = new Set<string>();
    
    workImpacts.forEach(wi => {
      wi.dutyImpacts.forEach(di => {
        if (!di.canPerform) {
          di.interferingFactors.forEach(factor => {
            reasons.add(factor.interferenceDescription);
          });
        }
      });
    });
    
    return Array.from(reasons);
  }
  
  /**
   * Data quality assessment
   */
  private static assessDataQuality(
    dailyLogs: DailyLog[],
    loggingPeriodDays: number,
    rfc: RFC,
    workImpacts: WorkImpact[],
    appointments: Appointment[],
    medications: Medication[]
  ): DataQualityIndicators {
    const loggingPercentage = (dailyLogs.length / loggingPeriodDays) * 100;
    
    const missingData: string[] = [];
    const recommendations: string[] = [];
    
    if (appointments.length < 3) {
      missingData.push('Medical appointments');
      recommendations.push('Document at least 3 medical appointments');
    }
    
    if (medications.length === 0) {
      missingData.push('Medications');
      recommendations.push('Document current medications and side effects');
    }
    
    if (workImpacts.length === 0) {
      missingData.push('Work history impact analysis');
      recommendations.push('Complete work impact analysis for all past jobs');
    }
    
    return {
      sufficientLoggingHistory: loggingPeriodDays >= 90,
      consistentLogging: loggingPercentage >= 75,
      validatedRFC: true,
      validatedWorkImpact: workImpacts.length > 0,
      missingData,
      recommendations
    };
  }
  
  private static getLoggingPeriodDays(dailyLogs: DailyLog[]): number {
    if (dailyLogs.length === 0) return 0;
    
    const dates = dailyLogs.map(l => new Date(l.logDate));
    const minDate = Math.min(...dates.map(d => d.getTime()));
    const maxDate = Math.max(...dates.map(d => d.getTime()));
    
    return Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  }
}
