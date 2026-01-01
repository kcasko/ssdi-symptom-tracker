/**
 * Integration tests for end-to-end workflows
 */

import { RFCBuilder } from '../../services/RFCBuilder';
import { WorkImpactAnalyzer } from '../../services/WorkImpactAnalyzer';
import { SSAFormBuilder } from '../../services/SSAFormBuilder';
import { CredibilityScorer } from '../../services/CredibilityScorer';
import { DailyLog } from '../../domain/models/DailyLog';
import { Limitation } from '../../domain/models/Limitation';
import { WorkHistory } from '../../domain/models/WorkHistory';

describe('End-to-End Workflow Integration', () => {
  // Create comprehensive test data
  const createTestLogs = (days: number): DailyLog[] => {
    return Array(days).fill(null).map((_, i) => ({
      id: `log${i}`,
      profileId: 'profile1',
      date: new Date(2024, 0, i + 1),
      symptoms: [
        {
          name: 'Back Pain',
          severity: 7 + (i % 3),
          duration: 480,
          notes: 'Sharp pain in lower back, radiating to legs. Worse with activity.'
        }
      ],
      overallPainLevel: 7,
      fatigueLevel: 6,
      sleepQuality: 'poor',
      sleepHours: 5,
      notes: `Day ${i + 1}: Pain significantly impacts daily activities. Unable to stand for long periods.`
    }));
  };

  const mockLimitations: Limitation[] = [
    {
      id: 'lim1',
      profileId: 'profile1',
      category: 'strength',
      description: 'Cannot lift more than 10 lbs',
      severity: 'severe',
      dateStarted: new Date('2024-01-01'),
      impacts: ['work', 'daily_activities'],
      accommodationsNeeded: ['No lifting', 'Frequent breaks']
    },
    {
      id: 'lim2',
      profileId: 'profile1',
      category: 'mobility',
      description: 'Cannot stand for more than 1 hour',
      severity: 'severe',
      dateStarted: new Date('2024-01-01'),
      impacts: ['work'],
      accommodationsNeeded: ['Sitting workspace']
    }
  ];

  const mockWorkHistory: WorkHistory = {
    id: 'job1',
    profileId: 'profile1',
    jobTitle: 'Warehouse Worker',
    employer: 'ABC Distribution',
    startDate: new Date('2018-01-01'),
    endDate: new Date('2023-12-31'),
    hoursPerWeek: 40,
    payRate: 18,
    duties: [
      {
        description: 'Lifting and moving boxes up to 50 lbs',
        frequency: 'frequent',
        physicalRequirements: {
          standing: true,
          lifting: true,
          maxWeight: 50
        },
        essential: true
      },
      {
        description: 'Walking warehouse floor for inventory checks',
        frequency: 'constant',
        physicalRequirements: {
          walking: true,
          standing: true
        },
        essential: true
      },
      {
        description: 'Operating forklift',
        frequency: 'occasional',
        physicalRequirements: {
          sitting: true
        },
        essential: false
      }
    ],
    physicalDemands: {
      exertionLevel: 'heavy',
      liftingRequirement: {
        maxWeight: 50,
        frequentWeight: 25
      },
      standingHours: 6,
      walkingHours: 5,
      sittingHours: 1
    }
  };

  describe('Complete SSDI Evidence Generation', () => {
    it('should generate complete evidence package from logs to SSA forms', () => {
      // Step 1: Create daily logs
      const dailyLogs = createTestLogs(120);
      expect(dailyLogs.length).toBe(120);

      // Step 2: Calculate credibility score
      const credibility = CredibilityScorer.calculateCredibilityScore(dailyLogs);
      expect(credibility.overallScore).toBeGreaterThan(60);

      // Step 3: Build RFC
      const rfc = RFCBuilder.buildFromLogs(dailyLogs, mockLimitations);
      expect(rfc.workCapacityLevel).toBeDefined();
      expect(rfc.canWorkFullTime).toBe(false);

      // Step 4: Analyze work impact
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        dailyLogs,
        mockLimitations
      );
      expect(workImpact.canReturnToJob).toBe(false);

      // Step 5: Generate SSA forms
      const formPackage = SSAFormBuilder.buildFormPackage(
        rfc,
        [workImpact],
        dailyLogs,
        mockLimitations,
        [],
        [],
        []
      );

      // Validate complete package
      expect(formPackage.disabilityReport).toBeDefined();
      expect(formPackage.functionReport).toBeDefined();
      expect(formPackage.workHistoryReport).toBeDefined();
      expect(formPackage.rfcSummary).toBeDefined();
      expect(formPackage.whyCannotWork.length).toBeGreaterThan(0);
      expect(formPackage.howConditionsLimit.length).toBeGreaterThan(0);
    });

    it('should maintain data traceability throughout pipeline', () => {
      const dailyLogs = createTestLogs(90);

      // Build RFC
      const rfc = RFCBuilder.buildFromLogs(dailyLogs, mockLimitations);
      expect(rfc.evidenceSummary.totalLogs).toBe(90);

      // All capacity claims should have supporting evidence
      expect(rfc.exertionalCapacity.sitting.supportingEvidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalCapacity.standing.supportingEvidence.length).toBeGreaterThan(0);

      // Work impact should reference logs
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        dailyLogs,
        mockLimitations
      );

      workImpact.dutyImpacts.forEach(impact => {
        impact.interferingFactors.forEach(factor => {
          expect(factor.occurrenceCount).toBeGreaterThanOrEqual(0);
          expect(factor.occurrencePercentage).toBeGreaterThanOrEqual(0);
        });
      });

      // SSA forms should pull from validated RFC
      const formPackage = SSAFormBuilder.buildFormPackage(
        rfc,
        [workImpact],
        dailyLogs,
        mockLimitations,
        [],
        [],
        []
      );

      expect(formPackage.dataQuality.validatedRFC).toBe(true);
      expect(formPackage.dataQuality.validatedWorkImpact).toBe(true);
    });

    it('should detect and warn about insufficient data', () => {
      // Test with insufficient data
      const shortLogs = createTestLogs(30);

      const rfc = RFCBuilder.buildFromLogs(shortLogs, []);
      const formPackage = SSAFormBuilder.buildFormPackage(
        rfc,
        [],
        shortLogs,
        [],
        [],
        [],
        []
      );

      expect(formPackage.dataQuality.sufficientLoggingHistory).toBe(false);
      expect(formPackage.warnings.length).toBeGreaterThan(0);
      expect(formPackage.dataQuality.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle multiple jobs in work history', () => {
      const dailyLogs = createTestLogs(90);
      const rfc = RFCBuilder.buildFromLogs(dailyLogs, mockLimitations);

      const job1Impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        dailyLogs,
        mockLimitations
      );

      const job2: WorkHistory = {
        ...mockWorkHistory,
        id: 'job2',
        jobTitle: 'Office Clerk',
        duties: [
          {
            description: 'Data entry and filing',
            frequency: 'constant',
            physicalRequirements: {
              sitting: true
            },
            essential: true
          }
        ],
        physicalDemands: {
          exertionLevel: 'sedentary',
          liftingRequirement: { maxWeight: 10, frequentWeight: 5 },
          standingHours: 1,
          walkingHours: 1,
          sittingHours: 6
        }
      };

      const job2Impact = WorkImpactAnalyzer.analyzeWorkImpact(
        job2,
        dailyLogs,
        mockLimitations
      );

      const formPackage = SSAFormBuilder.buildFormPackage(
        rfc,
        [job1Impact, job2Impact],
        dailyLogs,
        mockLimitations,
        [],
        [],
        []
      );

      expect(formPackage.workHistoryReport.jobs.length).toBe(2);
    });
  });

  describe('Data Quality Validation', () => {
    it('should validate RFC has sufficient backing evidence', () => {
      const dailyLogs = createTestLogs(90);
      const rfc = RFCBuilder.buildFromLogs(dailyLogs, mockLimitations);

      // Every limitation should have evidence
      expect(rfc.exertionalCapacity.sitting.supportingEvidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalCapacity.standing.supportingEvidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalCapacity.walking.supportingEvidence.length).toBeGreaterThan(0);
    });

    it('should require minimum logging period for reliable RFC', () => {
      const shortLogs = createTestLogs(30);
      const longLogs = createTestLogs(120);

      const shortRFC = RFCBuilder.buildFromLogs(shortLogs, mockLimitations);
      const longRFC = RFCBuilder.buildFromLogs(longLogs, mockLimitations);

      const shortForms = SSAFormBuilder.buildFormPackage(
        shortRFC,
        [],
        shortLogs,
        mockLimitations,
        [],
        [],
        []
      );

      const longForms = SSAFormBuilder.buildFormPackage(
        longRFC,
        [],
        longLogs,
        mockLimitations,
        [],
        [],
        []
      );

      expect(shortForms.dataQuality.sufficientLoggingHistory).toBe(false);
      expect(longForms.dataQuality.sufficientLoggingHistory).toBe(true);
    });

    it('should ensure work impact analysis uses actual log data', () => {
      const dailyLogs = createTestLogs(90);
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        dailyLogs,
        mockLimitations
      );

      // Each duty impact should have occurrence counts
      workImpact.dutyImpacts.forEach(impact => {
        impact.interferingFactors.forEach(factor => {
          expect(factor.occurrenceCount).toBeLessThanOrEqual(dailyLogs.length);
          const expectedPercentage = (factor.occurrenceCount / dailyLogs.length) * 100;
          expect(factor.occurrencePercentage).toBeCloseTo(expectedPercentage, 0);
        });
      });
    });
  });

  describe('Consistency Validation', () => {
    it('should maintain consistency across all outputs', () => {
      const dailyLogs = createTestLogs(100);
      const rfc = RFCBuilder.buildFromLogs(dailyLogs, mockLimitations);
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        dailyLogs,
        mockLimitations
      );
      const formPackage = SSAFormBuilder.buildFormPackage(
        rfc,
        [workImpact],
        dailyLogs,
        mockLimitations,
        [],
        [],
        []
      );

      // RFC work capacity should match SSA form summary
      expect(formPackage.rfcSummary.workCapacityLevel).toBe(rfc.workCapacityLevel);
      expect(formPackage.rfcSummary.canWorkFullTime).toBe(rfc.canWorkFullTime);

      // Work impact should align with RFC capacity
      if (rfc.workCapacityLevel === 'sedentary' && !rfc.canWorkFullTime) {
        expect(workImpact.canReturnToJob).toBe(false);
      }
    });
  });
});
