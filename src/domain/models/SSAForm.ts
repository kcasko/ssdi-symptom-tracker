/**
 * SSA Form Models
 * 
 * Pre-population structures for Social Security Administration disability forms.
 * Data sourced from validated RFC and WorkImpact analyses, not raw logs.
 */

/**
 * SSA-3368: Disability Report - Adult
 * The main form describing your disability and its impact
 */
export interface DisabilityReport {
  // Section 1: Your Disabling Condition(s)
  conditions: MedicalCondition[];
  dateBecomesDisabled: Date;
  stillWorking: boolean;
  
  // Section 2: Information About Your Illnesses, Injuries, or Conditions
  howConditionsLimit: string; // Generated from RFC
  
  // Section 3: Information About Your Work
  workHistory: WorkHistoryEntry[];
  didConditionsAffectWork: boolean;
  whenDidConditionsAffectWork?: Date;
  howConditionsAffectedWork?: string; // Generated from WorkImpact
  
  // Section 4: Medications
  medications: MedicationEntry[];
  
  // Section 5: Tests and Doctor Visits
  medicalTreatment: MedicalTreatmentEntry[];
  
  // Section 6: Education and Training
  education: EducationInfo;
  
  // Section 7: Vocational Rehabilitation
  vocationalRehab?: VocationalRehabInfo;
  
  // Evidence summary
  evidenceSummary: EvidenceSummary;
}

export interface MedicalCondition {
  name: string;
  dateFirstNoticedOrDiagnosed: Date;
  limitationType: 'physical' | 'mental' | 'both';
  // Auto-generated from symptoms/limitations
  sourceLogIds: string[];
  firstDocumentedDate: Date;
  documentationFrequency: number; // How many logs document this
}

export interface WorkHistoryEntry {
  jobTitle: string;
  employer: string;
  startDate: Date;
  endDate?: Date;
  hoursPerWeek: number;
  payRate: number;
  
  // Physical requirements (from WorkHistory model)
  physicalDemands: string;
  
  // Why you can't do this work anymore (from WorkImpact)
  canReturnToJob: boolean;
  impactStatement: string; // Pre-generated from WorkImpactAnalyzer
  essentialDutiesAffected: number;
  totalDuties: number;
}

export interface MedicationEntry {
  name: string;
  prescribedFor: string;
  startDate: Date;
  endDate?: Date;
  sideEffects: string[];
  // From medication tracking
  sourceLogIds: string[];
  consistentUse: boolean; // Based on log frequency
}

export interface MedicalTreatmentEntry {
  providerName: string;
  providerType: 'doctor' | 'specialist' | 'therapist' | 'hospital' | 'clinic' | 'other';
  address: string;
  phone: string;
  dateFirstVisit: Date;
  dateLastVisit: Date;
  frequencyOfVisits: string;
  treatmentFor: string;
  // From appointment tracking
  sourceLogIds: string[];
}

export interface EducationInfo {
  highestGradeCompleted: number;
  specialEducation: boolean;
  vocationalTraining?: string[];
  degrees?: string[];
}

export interface VocationalRehabInfo {
  participated: boolean;
  programName?: string;
  startDate?: Date;
  endDate?: Date;
  outcome?: string;
}

/**
 * Function Report (SSA-3373)
 * Activities of Daily Living - what you can and can't do
 */
export interface FunctionReport {
  // Daily Activities
  dailyActivities: DailyActivityDescription[];
  
  // Abilities affected by conditions
  affectedAbilities: AffectedAbility[];
  
  // Social interactions
  socialLimitations: SocialLimitation[];
  
  // Changes since disability began
  changesSinceDisability: string[];
  
  // Evidence base
  evidenceSummary: EvidenceSummary;
}

export interface DailyActivityDescription {
  activity: string;
  canDo: boolean;
  limitationDescription?: string;
  frequency: string; // "daily", "weekly", "occasionally", "rarely"
  assistanceNeeded: boolean;
  assistanceType?: string;
  // From activity logs
  sourceLogIds: string[];
  documentedOccurrences: number;
}

export interface AffectedAbility {
  ability: 
    | 'lifting' | 'squatting' | 'bending' | 'standing' | 'reaching' | 'walking'
    | 'sitting' | 'kneeling' | 'talking' | 'hearing' | 'stair_climbing'
    | 'seeing' | 'memory' | 'completing_tasks' | 'concentration' | 'understanding'
    | 'following_instructions' | 'getting_along_with_others';
  
  affected: boolean;
  description: string;
  // From RFC
  evidenceFromRFC: boolean;
  sourceLogIds: string[];
}

export interface SocialLimitation {
  area: 'family' | 'friends' | 'public' | 'authority_figures' | 'coworkers';
  hasLimitation: boolean;
  description?: string;
  sourceLogIds: string[];
}

/**
 * Work History Report
 * Detailed breakdown of past relevant work
 */
export interface WorkHistoryReport {
  jobs: DetailedJobDescription[];
  canDoAnyPastWork: boolean;
  reasonsCannotDoPastWork: string[]; // From WorkImpact
  evidenceSummary: EvidenceSummary;
}

export interface DetailedJobDescription {
  jobTitle: string;
  employer: string;
  dates: { start: Date; end?: Date };
  daysPerWeek: number;
  hoursPerDay: number;
  
  // Physical requirements
  hoursStanding: number;
  hoursWalking: number;
  hoursSitting: number;
  heaviestWeightLifted: number;
  frequentlyLiftedWeight: number;
  
  // Job duties
  mainDuties: string[];
  toolsAndEquipment: string[];
  supervision: 'supervised' | 'unsupervised' | 'supervised_others';
  
  // What prevents return (from WorkImpact)
  canReturnToJob: boolean;
  dutiesAffected: DutyImpactSummary[];
  overallImpactStatement: string;
}

export interface DutyImpactSummary {
  duty: string;
  canPerform: boolean;
  impactDescription: string;
  interferingFactors: string[];
  evidenceCount: number;
}

/**
 * RFC Summary for SSA Forms
 * Pre-formatted RFC data for form fields
 */
export interface RFCSummary {
  workCapacityLevel: 'sedentary' | 'light' | 'medium' | 'heavy' | 'very_heavy';
  canWorkFullTime: boolean;
  
  // Exertional limitations (formatted for forms)
  sittingCapacity: string;
  standingCapacity: string;
  walkingCapacity: string;
  liftingCapacity: string;
  
  // Postural limitations
  posturalLimitations: string[];
  
  // Manipulative limitations
  manipulativeLimitations: string[];
  
  // Environmental restrictions
  environmentalRestrictions: string[];
  
  // Mental limitations
  mentalLimitations: string[];
  
  // Required accommodations
  requiredAccommodations: string[];
  
  // Supporting evidence
  evidenceSummary: EvidenceSummary;
}

/**
 * Evidence Summary
 * Tracks what data supports each claim
 */
export interface EvidenceSummary {
  totalDailyLogs: number;
  totalActivityLogs: number;
  totalLimitations: number;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  
  // Evidence strength indicators
  consistentDocumentation: boolean; // >75% of days logged
  longTermTracking: boolean; // >90 days of data
  patternConsistency: boolean; // From RFC pattern detection
  
  // Key supporting data
  topDocumentedSymptoms: Array<{
    symptom: string;
    occurrences: number;
    percentage: number;
  }>;
  
  topDocumentedLimitations: Array<{
    limitation: string;
    occurrences: number;
    percentage: number;
  }>;
}

/**
 * Complete SSA Form Package
 * All forms pre-populated and ready for review
 */
export interface SSAFormPackage {
  generatedDate: Date;
  
  // Main forms
  disabilityReport: DisabilityReport;
  functionReport: FunctionReport;
  workHistoryReport: WorkHistoryReport;
  rfcSummary: RFCSummary;
  
  // Supporting narratives
  whyCannotWork: string; // From WorkImpact
  howConditionsLimit: string; // From RFC
  
  // Data quality indicators
  dataQuality: DataQualityIndicators;
  
  // Warnings
  warnings: string[];
}

export interface DataQualityIndicators {
  sufficientLoggingHistory: boolean; // >90 days
  consistentLogging: boolean; // >75% of days
  validatedRFC: boolean; // RFC has been built
  validatedWorkImpact: boolean; // WorkImpact has been analyzed
  
  missingData: string[]; // What's not documented yet
  recommendations: string[]; // What to document before filing
}

/**
 * Form validation helpers
 */
export const SSAFormValidation = {
  /**
   * Check if data is ready for SSA form generation
   */
  isReadyForFormGeneration(
    dailyLogCount: number,
    loggingPeriodDays: number,
    hasRFC: boolean,
    hasWorkImpact: boolean
  ): { ready: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    if (loggingPeriodDays < 90) {
      warnings.push(
        'Less than 90 days of logging history. SSA prefers longer documentation periods.'
      );
    }
    
    const loggingPercentage = (dailyLogCount / loggingPeriodDays) * 100;
    if (loggingPercentage < 75) {
      warnings.push(
        `Only ${loggingPercentage.toFixed(1)}% of days logged. Aim for >75% consistency.`
      );
    }
    
    if (!hasRFC) {
      warnings.push(
        'RFC analysis not completed. Generate RFC before SSA forms.'
      );
    }
    
    if (!hasWorkImpact) {
      warnings.push(
        'Work impact analysis not completed. Analyze work history before SSA forms.'
      );
    }
    
    const ready = warnings.length === 0;
    return { ready, warnings };
  },
  
  /**
   * Get minimum recommended documentation before filing
   */
  getMinimumRequirements(): string[] {
    return [
      'At least 90 days of consistent daily logging',
      'RFC analysis completed and reviewed',
      'Work history with impact analysis completed',
      'At least 3 documented medical appointments',
      'Current medication list with side effects documented',
      'Key symptoms documented in >50% of logs',
      'Evidence of pattern consistency (not sporadic claims)'
    ];
  }
};
