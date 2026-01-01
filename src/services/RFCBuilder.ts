/**
 * RFC Builder Service
 * Generates Residual Functional Capacity assessments FROM actual log data
 * 
 * This is the key differentiator:
 * - RFC from logs = authoritative, evidence-based
 * - RFC from self-assessment = speculative, subjective
 */

import { RFC, createRFC, LimitationLevel } from '../domain/models/RFC';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';
import { Appointment } from '../domain/models/Appointment';
import { ids } from '../utils/ids';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';

interface RFCBuildOptions {
  profileId: string;
  startDate: string;
  endDate: string;
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
  photos?: PhotoAttachment[];
  appointments?: Appointment[];
}

export class RFCBuilder {
  /**
   * Build RFC from actual log data
   * This is authoritative because it's based on documented evidence
   */
  static buildFromLogs(options: RFCBuildOptions): RFC {
    const { profileId, startDate, endDate, dailyLogs, activityLogs, limitations, photos = [], appointments = [] } = options;
    
    // Filter logs to date range
    const filteredDailyLogs = this.filterByDateRange(dailyLogs, startDate, endDate);
    const filteredActivityLogs = this.filterByDateRange(activityLogs, startDate, endDate);
    
    if (filteredDailyLogs.length === 0 && filteredActivityLogs.length === 0) {
      throw new Error('Insufficient data: No logs found in specified date range');
    }
    
    // Create base RFC
    const rfc = createRFC(ids.report(), profileId, startDate, endDate);
    
    // Build evidence summary first
    rfc.evidenceSummary = this.buildEvidenceSummary(
      filteredDailyLogs,
      filteredActivityLogs,
      limitations,
      photos,
      appointments,
      startDate,
      endDate
    );
    
    // Analyze exertional capacity from activity logs
    rfc.exertionalLimitations = this.analyzeExertionalCapacity(
      filteredActivityLogs,
      limitations,
      filteredDailyLogs
    );
    
    // Analyze postural limitations from symptoms and activities
    rfc.posturalLimitations = this.analyzePosturalLimitations(
      filteredDailyLogs,
      filteredActivityLogs,
      limitations
    );
    
    // Analyze manipulative limitations
    rfc.manipulativeLimitations = this.analyzeManipulativeLimitations(
      filteredDailyLogs,
      limitations
    );
    
    // Analyze environmental limitations
    rfc.environmentalLimitations = this.analyzeEnvironmentalLimitations(
      filteredDailyLogs
    );
    
    // Analyze mental/cognitive limitations
    rfc.mentalLimitations = this.analyzeMentalLimitations(
      filteredDailyLogs
    );
    
    // Determine overall work capacity rating
    rfc.overallRating = this.determineWorkCapacityRating(rfc);
    
    // Determine if can work full time
    rfc.canWorkFullTime = this.canWorkFullTime(rfc);
    
    // List required accommodations
    rfc.requiresAccommodations = this.determineAccommodations(rfc);
    
    return rfc;
  }
  
  /**
   * Build evidence summary - shows data quality
   */
  private static buildEvidenceSummary(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    photos: PhotoAttachment[],
    appointments: Appointment[],
    startDate: string,
    endDate: string
  ): RFC['evidenceSummary'] {
    const dateRangeDays = this.calculateDaysBetween(startDate, endDate);
    const averageLogsPerWeek = (dailyLogs.length / dateRangeDays) * 7;
    
    // Find most severe symptom days
    const sortedByOverallSeverity = [...dailyLogs]
      .filter(log => log.overallSeverity !== undefined)
      .sort((a, b) => (b.overallSeverity || 0) - (a.overallSeverity || 0));
    const mostSevereSymptomDays = sortedByOverallSeverity.slice(0, 10).map(log => log.id);
    
    // Find activity limitations (stopped early or high impact)
    const activityLimitations = activityLogs
      .filter(log => {
        return log.stoppedEarly || log.immediateImpact.overallImpact >= 7;
      })
      .map(log => log.id);
    
    // Find functional declines
    const activeLimitations = limitations.filter(l => l.isActive);
    const functionalDeclines = activeLimitations.map(l => l.id);
    
    // Detect patterns
    const consistentPatterns = this.detectConsistentPatterns(dailyLogs);
    const worseningTrends = this.detectWorseningTrends(dailyLogs);
    
    return {
      totalDailyLogs: dailyLogs.length,
      totalActivityLogs: activityLogs.length,
      totalLimitations: limitations.length,
      totalPhotos: photos.length,
      consistentPatterns,
      worseningTrends,
      medicationEffects: [],
      mostSevereSymptomDays,
      activityLimitations,
      functionalDeclines,
      dateRangeDays,
      averageLogsPerWeek,
      hasPhotographicEvidence: photos.length > 0,
      hasMedicalCorroboration: appointments.length > 0,
    };
  }
  
  /**
   * Analyze exertional capacity - sitting, standing, walking, lifting
   */
  private static analyzeExertionalCapacity(
    activityLogs: ActivityLog[],
    limitations: Limitation[],
    dailyLogs: DailyLog[]
  ): RFC['exertionalLimitations'] {
    const result = createRFC('', '', '', '').exertionalLimitations;
    
    // Analyze sitting capacity from pain levels and activity impacts
    const sittingAnalysis = this.analyzeSittingCapacity(activityLogs, dailyLogs, limitations);
    result.sitting = sittingAnalysis;
    
    // Analyze standing/walking capacity
    const standingAnalysis = this.analyzeStandingCapacity(activityLogs, dailyLogs, limitations);
    result.standing = standingAnalysis;
    
    const walkingAnalysis = this.analyzeWalkingCapacity(activityLogs, limitations);
    result.walking = walkingAnalysis;
    
    // Analyze lifting capacity from activity logs
    const liftingAnalysis = this.analyzeLiftingCapacity(activityLogs, limitations);
    result.lifting = liftingAnalysis;
    
    // Analyze push/pull
    const pushPullAnalysis = this.analyzePushPullCapacity(limitations);
    result.pushPull = pushPullAnalysis;
    
    return result;
  }
  
  private static analyzeSittingCapacity(
    activityLogs: ActivityLog[],
    dailyLogs: DailyLog[],
    limitations: Limitation[]
  ): RFC['exertionalLimitations']['sitting'] {
    // Check for back pain, neck pain symptoms that limit sitting
    const backPainDays = dailyLogs.filter(log => 
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('back') ||
          symptom.name.toLowerCase().includes('neck') ||
          symptom.name.toLowerCase().includes('spine')
        ) && s.severity >= 6;
      })
    );
    
    // Check for sitting limitations
    const sittingLimitations = limitations.filter(l => 
      l.isActive && l.category === 'sitting'
    );
    
    if (sittingLimitations.length > 0 || backPainDays.length > dailyLogs.length * 0.5) {
      return {
        maxContinuousMinutes: 30,
        maxTotalHours: 4,
        requiresBreaks: true,
        breakFrequencyMinutes: 30,
        evidence: [
          ...sittingLimitations.map(l => l.id),
          ...backPainDays.slice(0, 5).map(d => d.id),
        ],
      };
    }
    
    return {
      maxContinuousMinutes: 120,
      maxTotalHours: 6,
      requiresBreaks: false,
      evidence: [],
    };
  }
  
  private static analyzeStandingCapacity(
    activityLogs: ActivityLog[],
    dailyLogs: DailyLog[],
    limitations: Limitation[]
  ): RFC['exertionalLimitations']['standing'] {
    // Check for leg pain, joint pain, balance issues
    const standingSymptoms = dailyLogs.filter(log =>
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('leg') ||
          symptom.name.toLowerCase().includes('knee') ||
          symptom.name.toLowerCase().includes('hip') ||
          symptom.name.toLowerCase().includes('ankle') ||
          symptom.name.toLowerCase().includes('balance')
        ) && s.severity >= 6;
      })
    );
    
    const standingLimitations = limitations.filter(l =>
      l.isActive && l.category === 'standing'
    );
    
    if (standingLimitations.length > 0 || standingSymptoms.length > dailyLogs.length * 0.4) {
      return {
        maxContinuousMinutes: 20,
        maxTotalHours: 2,
        requiresBreaks: true,
        breakFrequencyMinutes: 20,
        evidence: [
          ...standingLimitations.map(l => l.id),
          ...standingSymptoms.slice(0, 5).map(d => d.id),
        ],
      };
    }
    
    return {
      maxContinuousMinutes: 120,
      maxTotalHours: 6,
      requiresBreaks: false,
      evidence: [],
    };
  }
  
  private static analyzeWalkingCapacity(
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): RFC['exertionalLimitations']['walking'] {
    // Check for walking activities that were stopped early or caused high impact
    const walkingActivities = activityLogs.filter(log => {
      const activity = getActivityById(log.activityId);
      return activity && (
        activity.name.toLowerCase().includes('walk') ||
        activity.name.toLowerCase().includes('stairs')
      );
    });
    
    const problemWalking = walkingActivities.filter(log => {
      return log.stoppedEarly || log.immediateImpact.overallImpact >= 7;
    });
    
    const walkingLimitations = limitations.filter(l =>
      l.isActive && l.category === 'walking'
    );
    
    if (problemWalking.length > walkingActivities.length * 0.5 || walkingLimitations.length > 0) {
      return {
        maxContinuousMinutes: 15,
        maxTotalHours: 2,
        maxDistanceFeet: 500,
        requiresAssistiveDevice: false,
        assistiveDeviceType: undefined,
        evidence: [
          ...walkingLimitations.map(l => l.id),
          ...problemWalking.map(a => a.id),
        ],
      };
    }
    
    return {
      maxContinuousMinutes: 120,
      maxTotalHours: 6,
      requiresAssistiveDevice: false,
      evidence: [],
    };
  }
  
  private static analyzeLiftingCapacity(
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): RFC['exertionalLimitations']['lifting'] {
    // Check for lifting activities
    const liftingActivities = activityLogs.filter(log => {
      const activity = getActivityById(log.activityId);
      return activity && (
        activity.name.toLowerCase().includes('lift') ||
        activity.name.toLowerCase().includes('carry') ||
        activity.name.toLowerCase().includes('groceries')
      );
    });
    
    const problemLifting = liftingActivities.filter(log => {
      const impactScore = (log.immediateImpact?.pain || 0) + (log.immediateImpact?.fatigue || 0);
      return log.stoppedEarly || log.immediateImpact.overallImpact >= 7
    
    const liftingLimitations = limitations.filter(l =>
      l.isActive && (l.category === 'lifting' || l.category === 'carrying')
    );
    
    if (liftingLimitations.length > 0 || problemLifting.length > 0) {
      // Severe limitation - sedentary work level
      return {
        maxWeightPoundsOccasional: 10,
        maxWeightPoundsFrequent: 5,
        maxWeightPoundsConstant: 0,
        evidence: [
          ...liftingLimitations.map(l => l.id),
          ...problemLifting.map(a => a.id),
        ],
      };
    }
    
    // Light work level
    return {
      maxWeightPoundsOccasional: 20,
      maxWeightPoundsFrequent: 10,
      maxWeightPoundsConstant: 5,
      evidence: [],
    };
  }
  
  private static analyzePushPullCapacity(
    limitations: Limitation[]
  ): RFC['exertionalLimitations']['pushPull'] {
    const pushPullLimitations = limitations.filter(l =>
      l.isActive && (l.notes?.toLowerCase().includes('push') || l.notes?.toLowerCase().includes('pull'))
    );
    
    if (pushPullLimitations.length > 0) {
      return {
        limitedBeyondLifting: true,
        maxForcePounds: 10,
        evidence: pushPullLimitations.map(l => l.id),
      };
    }
    
    return {
      limitedBeyondLifting: false,
      evidence: [],
    };
  }
  
  /**
   * Analyze postural limitations
   */
  private static analyzePosturalLimitations(
    dailyLogs: DailyLog[],
    activityLogs: ActivityLog[],
    limitations: Limitation[]
  ): RFC['posturalLimitations'] {
    const result = createRFC('', '', '', '').posturalLimitations;
    
    // Map limitation types to postural categories
    const posturalMap: Record<string, keyof RFC['posturalLimitations']> = {
      'stooping': 'stooping',
      'kneeling': 'kneeling',
      'crouching': 'crouching',
      'crawling': 'crawling',
      'balancing': 'balancing',
    };
    
    limitations.filter(l => l.isActive).forEach(limitation => {
      const category = limitation.category;
      
      if (category in posturalMap) {
        const resultCategory = posturalMap[category] as keyof typeof result;
        if (resultCategory !== 'climbing' && resultCategory !== 'evidence') {
          result[resultCategory] = this.getLimitationLevel(limitation);
          if (!result.evidence[resultCategory]) result.evidence[resultCategory] = [];
          result.evidence[resultCategory].push(limitation.id);
        }
      }
      
      // Check for climbing limitations
      if (category === 'climbing') {
        result.climbing.stairs = this.getLimitationLevel(limitation);
        result.climbing.ladders = 'never';
        if (!result.evidence['climbing']) result.evidence['climbing'] = [];
        result.evidence['climbing'].push(limitation.id);
      }
    });
    
    return result;
  }
  
  /**
   * Analyze manipulative limitations
   */
  private static analyzeManipulativeLimitations(
    dailyLogs: DailyLog[],
    limitations: Limitation[]
  ): RFC['manipulativeLimitations'] {
    const result = createRFC('', '', '', '').manipulativeLimitations;
    
    // Check for hand, arm, shoulder symptoms
    const handSymptoms = dailyLogs.filter(log =>
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('hand') ||
          symptom.name.toLowerCase().includes('finger') ||
          symptom.name.toLowerCase().includes('wrist') ||
          symptom.name.toLowerCase().includes('arm') ||
          symptom.name.toLowerCase().includes('shoulder')
        ) && s.severity >= 6;
      })
    );
    
    const manipLimitations = limitations.filter(l =>
      l.isActive && (l.category === 'reaching' || l.category === 'fine_motor')
    );
    
    if (manipLimitations.length > 0 || handSymptoms.length > 0) {
      result.reaching.overhead = 'occasional';
      result.handling = 'frequent';
      result.fingering = 'frequent';
      result.evidence['reaching'] = manipLimitations.map(l => l.id);
      result.evidence['handling'] = manipLimitations.map(l => l.id);
    }
    
    return result;
  }
  
  /**
   * Analyze environmental limitations
   */
  private static analyzeEnvironmentalLimitations(
    dailyLogs: DailyLog[]
  ): RFC['environmentalLimitations'] {
    const result = createRFC('', '', '', '').environmentalLimitations;
    
    // Check for balance issues = heights limitation
    // (would need limitations parameter to check this)
    
    // Check for respiratory issues = environmental sensitivities
    const respiratorySymptoms = dailyLogs.filter(log =>
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('breath') ||
          symptom.name.toLowerCase().includes('asthma') ||
          symptom.name.toLowerCase().includes('lung')
        );
      })
    );
    
    if (respiratorySymptoms.length > dailyLogs.length * 0.3) {
      result.dust = 'never';
      result.odors = 'never';
      result.fumes = 'never';
      result.evidence['dust'] = respiratorySymptoms.slice(0, 5).map(d => d.id);
    }
    
    return result;
  }
  
  /**
   * Analyze mental/cognitive limitations
   */
  private static analyzeMentalLimitations(
    dailyLogs: DailyLog[]
  ): RFC['mentalLimitations'] {
    const result = createRFC('', '', '', '').mentalLimitations;
    
    // Check for concentration issues from pain
    const highPainDays = dailyLogs.filter(log => (log.overallSeverity || 0) >= 7);
    if (highPainDays.length > dailyLogs.length * 0.3) {
      result.concentration.maxContinuousMinutes = 20;
      result.concentration.requiresFrequentBreaks = true;
      result.concentration.distractedByPain = true;
      result.concentration.evidence = highPainDays.slice(0, 5).map(d => d.id);
    }
    
    // Check for cognitive symptoms
    const cognitiveSymptoms = dailyLogs.filter(log =>
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && (
          symptom.name.toLowerCase().includes('fog') ||
          symptom.name.toLowerCase().includes('memory') ||
          symptom.name.toLowerCase().includes('concentration')
        );
      })
    );
    
    if (cognitiveSymptoms.length > dailyLogs.length * 0.3) {
      result.memory.shortTermImpaired = true;
      result.concentration.maxContinuousMinutes = 20;
      result.memory.evidence = cognitiveSymptoms.slice(0, 5).map(d => d.id);
    }
    
    // Check for fatigue = pace issues
    const fatigueSymptoms = dailyLogs.filter(log =>
      log.symptoms.some(s => {
        const symptom = getSymptomById(s.symptomId);
        return symptom && symptom.name.toLowerCase().includes('fatigue');
      })
    );
    
    if (fatigueSymptoms.length > dailyLogs.length * 0.4) {
      result.pace.belowNormalPace = true;
      result.pace.requiresFlexibleSchedule = true;
      result.pace.evidence = fatigueSymptoms.slice(0, 5).map(d => d.id);
    }
    
    return result;
  }
  
  /**
   * Determine overall work capacity rating based on RFC
   */
  private static determineWorkCapacityRating(rfc: RFC): RFC['overallRating'] {
    const { lifting, standing, walking } = rfc.exertionalLimitations;
    
    // Sedentary: Lift max 10 lbs, sitting most of day
    if (lifting.maxWeightPoundsOccasional <= 10 &&
        lifting.maxWeightPoundsFrequent <= 5) {
      return 'sedentary';
    }
    
    // Light: Lift max 20 lbs occasionally, 10 frequently, standing/walking up to 6 hours
    if (lifting.maxWeightPoundsOccasional <= 20 &&
        lifting.maxWeightPoundsFrequent <= 10 &&
        (standing.maxTotalHours <= 6 || walking.maxTotalHours <= 6)) {
      return 'light';
    }
    
    // Medium: Lift max 50 lbs occasionally, 25 frequently
    if (lifting.maxWeightPoundsOccasional <= 50 &&
        lifting.maxWeightPoundsFrequent <= 25) {
      return 'medium';
    }
    
    // Heavy: Lift max 100 lbs occasionally, 50 frequently
    if (lifting.maxWeightPoundsOccasional <= 100 &&
        lifting.maxWeightPoundsFrequent <= 50) {
      return 'heavy';
    }
    
    return 'very_heavy';
  }
  
  /**
   * Determine if can work full time based on RFC
   */
  private static canWorkFullTime(rfc: RFC): boolean {
    const sitting = rfc.exertionalLimitations?.sitting;
    const standing = rfc.exertionalLimitations?.standing;
    const walking = rfc.exertionalLimitations?.walking;
    const { concentration, pace } = rfc.mentalLimitations || {};
    
    // Cannot work full time if:
    // 1. Cannot sit/stand/walk enough hours
    const totalPositionHours = Math.max(
      sitting?.maxTotalHours || 0,
      standing?.maxTotalHours || 0,
      walking?.maxTotalHours || 0
    );
    
    if (totalPositionHours < 6) {
      return false;
    }
    
    // 2. Severe concentration issues
    if (concentration && concentration.maxContinuousMinutes < 30) {
      return false;
    }
    
    // 3. Cannot meet production pace
    if (pace && (pace.cannotMeetQuotas || pace.unpredictableAbsences)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Determine required accommodations
   */
  private static determineAccommodations(rfc: RFC): string[] {
    const accommodations: string[] = [];
    
    const sitting = rfc.exertionalLimitations?.sitting;
    const standing = rfc.exertionalLimitations?.standing;
    const walking = rfc.exertionalLimitations?.walking;
    const { concentration, pace, social } = rfc.mentalLimitations || {};
    
    if (sitting?.requiresBreaks) {
      accommodations.push('Frequent position changes required');
    }
    
    if (standing && standing.maxTotalHours) {
      accommodations.push(`Standing limited to ${standing.maxTotalHours} hours total`);
    }
    
    if (walking?.requiresAssistiveDevice) {
      accommodations.push(`Requires ${walking.assistiveDeviceType || 'assistive device'}`);
    }
    
    if (concentration.requiresFrequentBreaks) {
      accommodations.?.requiresFrequentBreaks) {
      accommodations.push('Frequent rest breaks needed');
    }
    
    if (pace?.requiresFlexibleSchedule) {
      accommodations.push('Flexible schedule required');
    }
    
    if (social?ations.push('Limited public interaction');
    }
    
    return accommodations;
  }
  
  /**
   * Get limitation level from limitation object
   */
  private static getLimitationLevel(limitation: Limitation): LimitationLevel {
    const freq = limitation.frequency;
    if (freq === 'always' || freq === 'usually') return 'never';
    if (freq === 'often') return 'occasional';
    if (freq === 'sometimes' || freq === 'occasionally') return 'frequent';
    return 'unlimited';
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
      const logDate = new Date(log.logDate || log.activityDate || log.date || '');
      return logDate >= start && logDate <= end;
    });
  }
  
  /**
   * Calculate days between dates
   */
  private static calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Detect consistent symptom patterns
   */
  private static detectConsistentPatterns(dailyLogs: DailyLog[]): string[] {
    const patterns: string[] = [];
    
    // Group by symptom ID
    const symptomFrequency: Record<string, number> = {};
    dailyLogs.forEach(log => {
      log.symptoms.forEach(s => {
        symptomFrequency[s.symptomId] = (symptomFrequency[s.symptomId] || 0) + 1;
      });
    });
    
    // Find symptoms that appear in >50% of logs
    Object.entries(symptomFrequency).forEach(([symptomId, count]) => {
      if (count > dailyLogs.length * 0.5) {
        const symptom = getSymptomById(symptomId);
        if (symptom) {
          patterns.push(`${symptom.name} present in ${Math.round(count / dailyLogs.length * 100)}% of logs`);
        }
      }
    });
    
    return patterns;
  }
  
  /**
   * Detect worsening trends
   */
  private static detectWorseningTrends(dailyLogs: DailyLog[]): string[] {
    const trends: string[] = [];
    
    if (dailyLogs.length < 10) return trends;
    
    // Sort by date
    const sorted = [...dailyLogs].sort((a, b) => 
      new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
    );
    
    // Compare first third vs last third overall severity
    const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
    const lastThird = sorted.slice(-Math.floor(sorted.length / 3));
    
    const firstAvg = firstThird.reduce((sum, log) => sum + (log.overallSeverity || 0), 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, log) => sum + (log.overallSeverity || 0), 0) / lastThird.length;
    
    if (lastAvg > firstAvg + 1) {
      trends.push(`Overall symptom severity increased ${Math.round((lastAvg - firstAvg) / firstAvg * 100)}%`);
    }
    
    return trends;
  }
}
