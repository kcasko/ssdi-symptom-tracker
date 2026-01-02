/**
 * Integration tests for end-to-end workflows
 */

import { RFCBuilder } from '../services/RFCBuilder';
import { WorkImpactAnalyzer } from '../services/WorkImpactAnalyzer';
import { SSAFormBuilder } from '../services/SSAFormBuilder';
import { CredibilityScorer } from '../services/CredibilityScorer';
import { DailyLog } from '../domain/models/DailyLog';
import { Limitation } from '../domain/models/Limitation';
import { WorkHistory } from '../domain/models/WorkHistory';
import { createMockDailyLogs, createMockLimitation, createMockWorkHistory, createMockJobDuty } from './testHelpers';

describe('End-to-End Workflow Integration', () => {
  // Create comprehensive test data
  const createTestLogs = (days: number): DailyLog[] => {
    return createMockDailyLogs(days, {
      symptoms: [
        {
          symptomId: 'back_pain',
          severity: 7,
          duration: 480,
          notes: 'Sharp pain in lower back, radiating to legs. Worse with activity.'
        }
      ],
      overallSeverity: 7,
      notes: 'Pain significantly impacts daily activities. Unable to stand for long periods.'
    });
  };

  const mockLimitations: Limitation[] = [
    createMockLimitation({
      id: 'lim1',
      category: 'lifting',
      frequency: 'always',
      consequences: ['Severe pain', 'Unable to work'],
      accommodations: ['No lifting', 'Frequent breaks']
    }),
    createMockLimitation({
      id: 'lim2',
      category: 'walking',
      frequency: 'always',
      consequences: ['Fatigue', 'Pain increases'],
      accommodations: ['Sitting workspace']
    })
  ];

  const mockWorkHistory: WorkHistory = createMockWorkHistory({
    id: 'job1',
    jobTitle: 'Warehouse Worker',
    employer: 'ABC Distribution',
    startDate: '2018-01-01',
    endDate: '2023-12-31',
    hoursPerWeek: 40,
    stillEmployed: false,
    wasFullTime: true,
    duties: [
      createMockJobDuty({
        id: 'duty1',
        description: 'Lifting and moving boxes up to 50 lbs',
        frequency: 'daily',
        percentOfTime: 40,
        physicalRequirements: {
          standing: true,
          lifting: 50
        },
        isEssential: true
      }),
      createMockJobDuty({
        id: 'duty2',
        description: 'Walking warehouse floor for inventory checks',
        frequency: 'daily',
        percentOfTime: 30,
        physicalRequirements: {
          walking: true,
          standing: true
        },
        isEssential: true
      }),
      createMockJobDuty({
        id: 'duty3',
        description: 'Operating forklift',
        frequency: 'occasional',
        percentOfTime: 30,
        physicalRequirements: {
          sitting: true
        },
        isEssential: false
      })
    ],
    physicalDemands: {
      exertionLevel: 'heavy',
      liftingRequired: {
        maxWeightPounds: 50,
        frequency: 'frequent'
      },
      standingRequired: {
        hoursPerDay: 6,
        continuous: false
      },
      walkingRequired: {
        hoursPerDay: 5
      },
      sittingRequired: {
        hoursPerDay: 1,
        continuous: false
      },
      posturalRequirements: {
        stooping: 'frequent',
        kneeling: 'occasional',
        crouching: 'occasional',
        crawling: 'never',
        climbing: 'occasional',
        balancing: 'occasional'
      },
      manipulativeRequirements: {
        reaching: 'frequent',
        handling: 'frequent',
        fingering: 'frequent',
        feeling: 'occasional'
      },
      environmentalExposures: {
        outdoors: false,
        extremeTemperatures: false,
        wetness: false,
        humidity: false,
        noise: 'moderate',
        vibration: false,
        hazards: true
      }
    }
  });

  describe('Complete SSDI Evidence Generation', () => {
    it('should generate complete evidence package from logs to SSA forms', () => {
      // Step 1: Create daily logs
      const dailyLogs = createTestLogs(120);
      expect(dailyLogs.length).toBe(120);

      // Step 2: Calculate credibility score
      const credibility = CredibilityScorer.calculateCredibility(dailyLogs, [], [], mockLimitations);
      expect(credibility.overallScore).toBeGreaterThan(60);

      // Step 3: Build RFC
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-04-30',
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });
      expect(rfc.overallRating).toBeDefined();
      expect(rfc.canWorkFullTime).toBe(false);

      // Step 4: Analyze work impact
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-04-30'
      });
      expect(workImpact.canReturnToThisJob).toBe(false);

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
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });
      expect(rfc.evidenceSummary.totalDailyLogs).toBe(90);

      // All capacity claims should have supporting evidence
      expect(rfc.exertionalLimitations.sitting.evidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalLimitations.standing.evidence.length).toBeGreaterThan(0);

      // Work impact should reference logs
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

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

      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-30',
        dailyLogs: shortLogs,
        activityLogs: [],
        limitations: []
      });
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
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      const job1Impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      const job2: WorkHistory = createMockWorkHistory({
        id: 'job2',
        jobTitle: 'Office Clerk',
        duties: [
          createMockJobDuty({
            id: 'duty4',
            description: 'Data entry and filing',
            frequency: 'daily',
            percentOfTime: 80,
            physicalRequirements: {
              sitting: true,
              fineDexterity: true
            },
            isEssential: true
          })
        ],
        physicalDemands: {
          exertionLevel: 'sedentary',
          liftingRequired: { maxWeightPounds: 10, frequency: 'occasional' },
          standingRequired: { hoursPerDay: 1, continuous: false },
          walkingRequired: { hoursPerDay: 1 },
          sittingRequired: { hoursPerDay: 6, continuous: false },
          posturalRequirements: {
            stooping: 'occasional',
            kneeling: 'never',
            crouching: 'never',
            crawling: 'never',
            climbing: 'never',
            balancing: 'occasional'
          },
          manipulativeRequirements: {
            reaching: 'occasional',
            handling: 'frequent',
            fingering: 'frequent',
            feeling: 'occasional'
          },
          environmentalExposures: {
            outdoors: false,
            extremeTemperatures: false,
            wetness: false,
            humidity: false,
            noise: 'quiet',
            vibration: false,
            hazards: false
          }
        }
      });

      const job2Impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: job2,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

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
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      // Every limitation should have evidence
      expect(rfc.exertionalLimitations.sitting.evidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalLimitations.standing.evidence.length).toBeGreaterThan(0);
      expect(rfc.exertionalLimitations.walking.evidence.length).toBeGreaterThan(0);
    });

    it('should require minimum logging period for reliable RFC', () => {
      const shortLogs = createTestLogs(30);
      const longLogs = createTestLogs(120);

      const shortRFC = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-30',
        dailyLogs: shortLogs,
        activityLogs: [],
        limitations: mockLimitations
      });
      const longRFC = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-04-30',
        dailyLogs: longLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

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
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

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
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-04-10',
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });
      const workImpact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-04-10'
      });
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
      expect(formPackage.rfcSummary.workCapacityLevel).toBe(rfc.overallRating);
      expect(formPackage.rfcSummary.canWorkFullTime).toBe(rfc.canWorkFullTime);

      // Work impact should align with RFC capacity
      if (rfc.overallRating === 'sedentary' && !rfc.canWorkFullTime) {
        expect(workImpact.canReturnToThisJob).toBe(false);
      }
    });
  });
});


