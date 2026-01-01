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
      description: 'Lifting boxes up to 50 lbs',
      frequency: 'frequent',
      physicalRequirements: {
        standing: true,
        lifting: true,
        maxWeight: 50
      },
      essential: true
    },
    {
      description: 'Walking warehouse floor',
      frequency: 'constant',
      physicalRequirements: {
        walking: true,
        standing: true
      },
      essential: true
    }
  ];

  const mockWorkHistory: WorkHistory = {
    id: 'job1',
    profileId: 'profile1',
    jobTitle: 'Warehouse Worker',
    employer: 'ABC Warehouse',
    startDate: new Date('2020-01-01'),
    endDate: new Date('2023-12-31'),
    hoursPerWeek: 40,
    payRate: 18,
    duties: mockJobDuties,
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

  const mockDailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
    id: `log${i}`,
    profileId: 'profile1',
    date: new Date(`2024-01-${(i % 30) + 1}`),
    symptoms: [
      { name: 'Back Pain', severity: 8, duration: 480, notes: 'Severe' }
    ],
    overallPainLevel: 8,
    fatigueLevel: 7,
    sleepQuality: 'poor',
    sleepHours: 5,
    notes: ''
  }));

  const mockLimitations: Limitation[] = [
    {
      id: 'lim1',
      profileId: 'profile1',
      category: 'strength',
      description: 'Cannot lift more than 10 lbs',
      severity: 'severe',
      dateStarted: new Date('2024-01-01'),
      impacts: ['work'],
      accommodationsNeeded: []
    }
  ];

  describe('analyzeWorkImpact', () => {
    it('should analyze work impact for a job', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      expect(impact).toBeDefined();
      expect(impact.workHistory).toBe(mockWorkHistory);
      expect(impact.dutyImpacts.length).toBe(mockJobDuties.length);
      expect(impact.canReturnToThisJob).toBeDefined();
    });

    it('should determine cannot return to job for severe impacts', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      expect(impact.canReturnToThisJob).toBe(false);
      expect(impact.overallImpactStatement).toContain('cannot');
    });

    it('should analyze each job duty individually', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      impact.dutyImpacts.forEach(dutyImpact => {
        expect(dutyImpact.duty).toBeDefined();
        expect(typeof dutyImpact.canPerform).toBe('boolean');
        expect(dutyImpact.impactStatement).toBeDefined();
        expect(Array.isArray(dutyImpact.interferingFactors)).toBe(true);
      });
    });

    it('should identify interfering factors', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.duty.description.includes('Lifting')
      );

      expect(liftingDuty).toBeDefined();
      expect(liftingDuty!.interferingFactors.length).toBeGreaterThan(0);
    });

    it('should include occurrence counts in interfering factors', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      impact.dutyImpacts.forEach(dutyImpact => {
        dutyImpact.interferingFactors.forEach(factor => {
          expect(factor.occurrenceCount).toBeGreaterThanOrEqual(0);
          expect(factor.occurrencePercentage).toBeGreaterThanOrEqual(0);
          expect(factor.occurrencePercentage).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should calculate severity scores', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      impact.dutyImpacts.forEach(dutyImpact => {
        expect(dutyImpact.severityScore).toBeGreaterThanOrEqual(0);
        expect(dutyImpact.severityScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('analyzeDutyImpact', () => {
    it('should determine cannot perform for conflicting duties', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.duty.description.includes('Lifting')
      );

      expect(liftingDuty!.canPerform).toBe(false);
    });

    it('should generate descriptive impact statements', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      impact.dutyImpacts.forEach(dutyImpact => {
        if (!dutyImpact.canPerform) {
          expect(dutyImpact.impactStatement).toContain('Cannot');
          expect(dutyImpact.impactStatement).toContain(dutyImpact.duty.description);
        }
      });
    });
  });

  describe('interference detection', () => {
    it('should detect lifting interference', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      const liftingDuty = impact.dutyImpacts.find(d =>
        d.duty.description.includes('Lifting')
      );

      const liftingInterference = liftingDuty!.interferingFactors.find(f =>
        f.description.toLowerCase().includes('lift')
      );

      expect(liftingInterference).toBeDefined();
    });

    it('should detect standing/walking interference', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      const walkingDuty = impact.dutyImpacts.find(d =>
        d.duty.description.includes('Walking')
      );

      expect(walkingDuty!.interferingFactors.length).toBeGreaterThan(0);
    });

    it('should calculate occurrence percentages correctly', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

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
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      const hasUnperformableEssentialDuty = impact.dutyImpacts.some(
        d => d.duty.essential && !d.canPerform
      );

      if (hasUnperformableEssentialDuty) {
        expect(impact.canReturnToThisJob).toBe(false);
      }
    });

    it('should handle jobs with no essential duties', () => {
      const nonEssentialWorkHistory: WorkHistory = {
        ...mockWorkHistory,
        duties: mockJobDuties.map(d => ({ ...d, essential: false }))
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        nonEssentialWorkHistory,
        mockDailyLogs,
        mockLimitations
      );

      expect(impact.canReturnToThisJob).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty daily logs', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        [],
        mockLimitations
      );

      expect(impact).toBeDefined();
      expect(impact.dutyImpacts.length).toBe(mockJobDuties.length);
    });

    it('should handle empty limitations', () => {
      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        mockWorkHistory,
        mockDailyLogs,
        []
      );

      expect(impact).toBeDefined();
    });

    it('should handle job with no duties', () => {
      const emptyJobHistory: WorkHistory = {
        ...mockWorkHistory,
        duties: []
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(
        emptyJobHistory,
        mockDailyLogs,
        mockLimitations
      );

      expect(impact.dutyImpacts.length).toBe(0);
    });
  });
});
