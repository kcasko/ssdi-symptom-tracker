/**
 * Evidence Report Builder
 * Generates lawyer-ready reports with standardized narratives and revision tracking
 */

import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { RevisionRecord } from '../domain/models/EvidenceMode';
import { FunctionalDomain } from '../domain/rules/functionalDomains';
import {
  getSymptomFunctionalDomains,
  getActivityFunctionalDomains,
  FUNCTIONAL_DOMAIN_INFO,
} from '../domain/rules/functionalDomains';
import {
  generateOpeningStatement,
  generateSymptomSummary,
  generateActivityImpactStatement,
  generateFunctionalLimitationStatement,
  generateDataQualityStatement,
  generateClosingStatement,
  generateRevisionSummary,
  formatDateRange,
  NarrativeConfig,
} from './StandardizedNarrativeService';

export interface EvidenceReportData {
  // Metadata
  reportTitle: string;
  generatedAt: string;
  appVersion: string;
  
  // Date range
  startDate: string;
  endDate: string;
  
  // Data sources
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  revisions: RevisionRecord[];
  
  // Finalization status
  finalizedDailyLogs: number;
  finalizedActivityLogs: number;
  
  // Profile
  profileId: string;
}

export interface EvidenceReport {
  // Report metadata
  title: string;
  generatedAt: string;
  dateRange: string;
  
  // Summary sections
  executiveSummary: string;
  dataQualitySummary: string;
  
  // Narrative sections
  symptomNarratives: SymptomNarrative[];
  activityNarratives: ActivityNarrative[];
  functionalLimitations: FunctionalLimitationNarrative[];
  
  // Revision section
  revisionSummary: RevisionSummarySection;
  
  // Legal disclaimer
  disclaimer: string;
}

export interface SymptomNarrative {
  symptomName: string;
  frequencyStatement: string;
  severityStatement: string;
}

export interface ActivityNarrative {
  activityName: string;
  attemptStatement: string;
  impactStatement: string;
  assistanceStatement?: string;
}

export interface FunctionalLimitationNarrative {
  domain: FunctionalDomain;
  domainLabel: string;
  limitationStatement: string;
  affectedActivities: string[];
}

export interface RevisionSummarySection {
  hasRevisions: boolean;
  totalRevisions: number;
  revisionStatements: string[];
}

/**
 * Build a complete evidence report
 */
export function buildEvidenceReport(data: EvidenceReportData): EvidenceReport {
  const {
    reportTitle,
    generatedAt,
    startDate,
    endDate,
    dailyLogs,
    activityLogs,
    revisions,
    finalizedDailyLogs,
    finalizedActivityLogs,
  } = data;

  // Calculate date range stats
  const totalDays = calculateDaysBetween(startDate, endDate);
  const loggedDays = getUniqueDates(dailyLogs.map((log) => log.logDate)).length;

  const config: NarrativeConfig = {
    dateRange: { start: startDate, end: endDate },
    totalDays,
    loggedDays,
  };

  // Generate each section
  const executiveSummary = generateOpeningStatement(config);
  const dataQualitySummary = generateDataQualityStatement(
    totalDays,
    loggedDays,
    finalizedDailyLogs + finalizedActivityLogs,
    revisions.length
  );

  const symptomNarratives = buildSymptomNarratives(dailyLogs, loggedDays);
  const activityNarratives = buildActivityNarratives(activityLogs);
  const functionalLimitations = buildFunctionalLimitations(dailyLogs, activityLogs, loggedDays);
  const revisionSummary = buildRevisionSummary(revisions, dailyLogs, activityLogs);

  return {
    title: reportTitle,
    generatedAt,
    dateRange: formatDateRange(startDate, endDate),
    executiveSummary,
    dataQualitySummary,
    symptomNarratives,
    activityNarratives,
    functionalLimitations,
    revisionSummary,
    disclaimer: generateClosingStatement(),
  };
}

/**
 * Build symptom narratives
 */
function buildSymptomNarratives(dailyLogs: DailyLog[], totalDays: number): SymptomNarrative[] {
  const symptomStats = new Map<string, { count: number; totalSeverity: number }>();

  // Aggregate symptom data
  dailyLogs.forEach((log) => {
    log.symptoms.forEach((symptom) => {
      const current = symptomStats.get(symptom.symptomId) || { count: 0, totalSeverity: 0 };
      current.count++;
      current.totalSeverity += symptom.severity;
      symptomStats.set(symptom.symptomId, current);
    });
  });

  // Generate narratives
  const narratives: SymptomNarrative[] = [];
  symptomStats.forEach((stats, symptomId) => {
    const avgSeverity = stats.totalSeverity / stats.count;
    const statement = generateSymptomSummary(symptomId, stats.count, totalDays, avgSeverity);

    narratives.push({
      symptomName: symptomId,
      frequencyStatement: statement,
      severityStatement: `Average severity: ${avgSeverity.toFixed(1)} of 10.`,
    });
  });

  return narratives.sort((a, b) => a.symptomName.localeCompare(b.symptomName));
}

/**
 * Build activity narratives
 */
function buildActivityNarratives(activityLogs: ActivityLog[]): ActivityNarrative[] {
  const activityStats = new Map<
    string,
    { attempts: number; stoppedEarly: number; totalImpact: number; assistanceCount: number }
  >();

  // Aggregate activity data
  activityLogs.forEach((log) => {
    const current = activityStats.get(log.activityId) || {
      attempts: 0,
      stoppedEarly: 0,
      totalImpact: 0,
      assistanceCount: 0,
    };

    current.attempts++;
    if (log.stoppedEarly) current.stoppedEarly++;
    current.totalImpact += log.immediateImpact.overallImpact;
    if (log.assistanceNeeded) current.assistanceCount++;

    activityStats.set(log.activityId, current);
  });

  // Generate narratives
  const narratives: ActivityNarrative[] = [];
  activityStats.forEach((stats, activityId) => {
    const avgImpact = stats.totalImpact / stats.attempts;
    const impactStatement = generateActivityImpactStatement(
      activityId,
      stats.attempts,
      stats.stoppedEarly,
      avgImpact
    );

    const narrative: ActivityNarrative = {
      activityName: activityId,
      attemptStatement: `Attempted ${stats.attempts} times.`,
      impactStatement,
    };

    if (stats.assistanceCount > 0) {
      const assistancePercentage = Math.round((stats.assistanceCount / stats.attempts) * 100);
      narrative.assistanceStatement = `Assistance required on ${stats.assistanceCount} occasions (${assistancePercentage} percent).`;
    }

    narratives.push(narrative);
  });

  return narratives.sort((a, b) => a.activityName.localeCompare(b.activityName));
}

/**
 * Build functional limitation narratives
 */
function buildFunctionalLimitations(
  dailyLogs: DailyLog[],
  activityLogs: ActivityLog[],
  totalDays: number
): FunctionalLimitationNarrative[] {
  const domainImpacts = new Map<
    FunctionalDomain,
    { days: Set<string>; totalSeverity: number; activities: Set<string> }
  >();

  // Track daily log impacts
  dailyLogs.forEach((log) => {
    log.symptoms.forEach((symptom) => {
      const domains = getSymptomFunctionalDomains(symptom.symptomId);
      domains.forEach((domain) => {
        const current = domainImpacts.get(domain) || {
          days: new Set<string>(),
          totalSeverity: 0,
          activities: new Set<string>(),
        };
        current.days.add(log.logDate);
        current.totalSeverity += symptom.severity;
        domainImpacts.set(domain, current);
      });
    });
  });

  // Track activity log impacts
  activityLogs.forEach((log) => {
    const domains = getActivityFunctionalDomains(log.activityId);
    domains.forEach((domain) => {
      const current = domainImpacts.get(domain) || {
        days: new Set<string>(),
        totalSeverity: 0,
        activities: new Set<string>(),
      };
      current.days.add(log.activityDate);
      current.totalSeverity += log.immediateImpact.overallImpact;
      current.activities.add(log.activityName);
      domainImpacts.set(domain, current);
    });
  });

  // Generate narratives
  const narratives: FunctionalLimitationNarrative[] = [];
  domainImpacts.forEach((impact, domain) => {
    const impactedDays = impact.days.size;
    const avgSeverity = impact.totalSeverity / impactedDays;
    const statement = generateFunctionalLimitationStatement(domain, impactedDays, totalDays, avgSeverity);

    narratives.push({
      domain,
      domainLabel: FUNCTIONAL_DOMAIN_INFO[domain].label,
      limitationStatement: statement,
      affectedActivities: Array.from(impact.activities).sort(),
    });
  });

  return narratives.sort((a, b) => a.domainLabel.localeCompare(b.domainLabel));
}

/**
 * Build revision summary
 */
function buildRevisionSummary(
  revisions: RevisionRecord[],
  dailyLogs: DailyLog[],
  activityLogs: ActivityLog[]
): RevisionSummarySection {
  if (revisions.length === 0) {
    return {
      hasRevisions: false,
      totalRevisions: 0,
      revisionStatements: [],
    };
  }

  // Create log lookup maps
  const dailyLogMap = new Map(dailyLogs.map((log) => [log.id, log]));
  const activityLogMap = new Map(activityLogs.map((log) => [log.id, log]));

  const statements = revisions.map((revision) => {
    let logDate = 'Unknown date';
    
    if (revision.logType === 'daily') {
      const log = dailyLogMap.get(revision.logId);
      logDate = log?.logDate || 'Unknown date';
    } else {
      const log = activityLogMap.get(revision.logId);
      logDate = log?.activityDate || 'Unknown date';
    }

    const revisionDate = new Date(revision.revisionTimestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return generateRevisionSummary(logDate, revision.fieldPath, revisionDate);
  });

  return {
    hasRevisions: true,
    totalRevisions: revisions.length,
    revisionStatements: statements,
  };
}

/**
 * Helper: Calculate days between two dates
 */
function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Helper: Get unique dates from array
 */
function getUniqueDates(dates: string[]): string[] {
  return Array.from(new Set(dates)).sort();
}
