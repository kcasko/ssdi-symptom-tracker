/**
 * Tests for Work Impact Analyzer
 */

import { WorkImpactAnalyzer } from '../WorkImpactAnalyzer';
import { WorkHistory, JobDuty } from '../../domain/models/WorkHistory';
import { DailyLog } from '../../domain/models/DailyLog';
import { Limitation } from '../../domain/models/Limitation';

describe('WorkImpactAnalyzer', () => {
  const mockJobDuties: JobDuty[] = [
    {
      id: 'duty1',
      description: 'Lifting boxes up to 50 lbs',
      frequency: 'daily',
      percentOfTime: 50,
      physicalRequirements: {
        standing: true,
        lifting: 50
      },
      isEssential: true
    },
    {
      id: 'duty2',
      description: 'Walking warehouse floor',
      frequency: 'daily',
      percentOfTime: 40,
      physicalRequirements: {
        walking: true,
        standing: true
      },
      isEssential: true
    }
  ];

  const mockWorkHistory: WorkHistory = {
    id: 'job1',
    profileId: 'profile1',
    jobTitle: 'Warehouse Worker',
    employer: 'ABC Warehouse',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    stillEmployed: false,
    hoursPerWeek: 40,
    wasFullTime: true,
    salary: 18,
    duties: mockJobDuties,
    skillsRequired: [],
    disabilityRelated: false,
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
        stooping: 'occasional',
        kneeling: 'occasional',
        crouching: 'never',
        crawling: 'never',
        climbing: 'occasional',
        balancing: 'occasional'
      },
      manipulativeRequirements: {
        reaching: 'frequent',
        handling: 'frequent',
        fingering: 'occasional',
        feeling: 'occasional'
      },
      environmentalExposures: {
        outdoors: true,
        extremeTemperatures: true,
        wetness: false,
        humidity: false,
        noise: 'loud',
        vibration: false,
        hazards: true
      }
    }
  };

  const mockDailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
    id: `log${i}`,
    profileId: 'profile1',
    createdAt: new Date(`2024-01-${(i % 30) + 1}`).toISOString(),
    updatedAt: new Date(`2024-01-${(i % 30) + 1}`).toISOString(),
    logDate: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
    timeOfDay: 'evening' as const,
    symptoms: [
      { symptomId: 'back_pain', severity: 8, duration: 480, notes: 'Severe' }
    ],
    overallSeverity: 8
  }));

  const mockLimitations: Limitation[] = [
    {
      id: 'lim1',
      profileId: 'profile1',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
      category: 'lifting',
      weightThreshold: {
        maxPounds: 10,
        frequency: 'never',
        notes: 'Cannot lift more than 10 lbs'
      },
      frequency: 'always',
      consequences: ['severe back pain', 'inability to continue work'],
      variability: 'consistent',
      isActive: true
    }
  ];

  describe('analyzeWorkImpact', () => {
    it('should analyze work impact for a job', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact).toBeDefined();
      expect(impact.workHistoryId).toBe(mockWorkHistory.id);
      expect(impact.dutyImpacts.length).toBe(mockJobDuties.length);
      expect(impact.canReturnToThisJob).toBeDefined();
    });

    it('should determine cannot return to job for severe impacts', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact.canReturnToThisJob).toBe(false);
      expect(impact.impactStatements.length).toBeGreaterThan(0);
    });

    it('should analyze each job duty individually', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      impact.dutyImpacts.forEach(dutyImpact => {
        expect(dutyImpact.dutyDescription).toBeDefined();
        expect(typeof dutyImpact.canPerform).toBe('string');
        expect(dutyImpact.impactExplanation).toBeDefined();
        expect(Array.isArray(dutyImpact.interferingFactors)).toBe(true);
      });
    });

    it('should identify interfering factors', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.dutyDescription.includes('Lifting')
      );

      expect(liftingDuty).toBeDefined();
      expect(liftingDuty!.interferingFactors.length).toBeGreaterThan(0);
    });

    it('should include occurrence counts in interfering factors', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      impact.dutyImpacts.forEach(dutyImpact => {
        dutyImpact.interferingFactors.forEach(factor => {
          expect(factor.occurrenceCount).toBeGreaterThanOrEqual(0);
          expect(factor.occurrencePercentage).toBeGreaterThanOrEqual(0);
          expect(factor.occurrencePercentage).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should calculate severity scores', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      impact.dutyImpacts.forEach(dutyImpact => {
        expect(dutyImpact.severityScore).toBeGreaterThanOrEqual(0);
        expect(dutyImpact.severityScore).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('analyzeDutyImpact', () => {
    it('should determine cannot perform for conflicting duties', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.dutyDescription.includes('Lifting')
      );

      expect(liftingDuty!.canPerform).toBe('no');
    });

    it('should generate descriptive impact statements', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      impact.dutyImpacts.forEach(dutyImpact => {
        if (dutyImpact.canPerform === 'no') {
          expect(dutyImpact.impactExplanation).toContain('Cannot');
          expect(dutyImpact.impactExplanation).toContain(dutyImpact.dutyDescription);
        }
      });
    });
  });

  describe('interference detection', () => {
    it('should detect lifting interference', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.dutyDescription.includes('Lifting')
      );

      const liftingInterference = liftingDuty!.interferingFactors.find(f =>
        f.interferenceDescription.toLowerCase().includes('lift')
      );

      expect(liftingInterference).toBeDefined();
    });

    it('should detect standing/walking interference', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const walkingDuty = impact.dutyImpacts.find(d =>
        d.dutyDescription.includes('Walking')
      );

      expect(walkingDuty!.interferingFactors.length).toBeGreaterThan(0);
    });

    it('should calculate occurrence percentages correctly', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      impact.dutyImpacts.forEach(dutyImpact => {
        dutyImpact.interferingFactors.forEach(factor => {
          const percentage = (factor.occurrenceCount / mockDailyLogs.length) * 100;
          expect(factor.occurrencePercentage).toBeCloseTo(percentage, 0);
        });
      });
    });
  });

  describe('can return to job determination', () => {
    it('should return false if essential duties cannot be performed', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const hasUnperformableEssentialDuty = impact.dutyImpacts.some(
        d => {
          const duty = mockJobDuties.find(jd => jd.description === d.dutyDescription);
          return duty?.isEssential && d.canPerform === 'no';
        }
      );

      if (hasUnperformableEssentialDuty) {
        expect(impact.canReturnToThisJob).toBe(false);
      }
    });

    it('should handle jobs with no essential duties', () => {
      const nonEssentialWorkHistory: WorkHistory = {
        ...mockWorkHistory,
        duties: mockJobDuties.map(d => ({ ...d, isEssential: false }))
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: nonEssentialWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact.canReturnToThisJob).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty daily logs', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: [],
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact).toBeDefined();
      expect(impact.dutyImpacts.length).toBe(mockJobDuties.length);
    });

    it('should handle empty limitations', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: mockWorkHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: [],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact).toBeDefined();
    });

    it('should handle job with no duties', () => {
      const emptyJobHistory: WorkHistory = {
        ...mockWorkHistory,
        duties: []
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact({
        workHistory: emptyJobHistory,
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(impact.dutyImpacts.length).toBe(0);
    });
  });
});
