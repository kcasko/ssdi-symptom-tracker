/**
 * Tests for RFC Builder
 */

import { RFCBuilder } from '../RFCBuilder';
import { DailyLog } from '../../domain/models/DailyLog';
import { Limitation } from '../../domain/models/Limitation';

describe('RFCBuilder', () => {
  const mockDailyLogs: DailyLog[] = [
    {
      id: 'log1',
      profileId: 'profile1',
      date: new Date('2024-01-01'),
      symptoms: [
        { name: 'Back Pain', severity: 8, duration: 480, notes: 'Constant' }
      ],
      overallPainLevel: 8,
      fatigueLevel: 7,
      sleepQuality: 'poor',
      sleepHours: 4,
      notes: 'Difficult day'
    },
    {
      id: 'log2',
      profileId: 'profile1',
      date: new Date('2024-01-02'),
      symptoms: [
        { name: 'Back Pain', severity: 9, duration: 480, notes: 'Severe' }
      ],
      overallPainLevel: 9,
      fatigueLevel: 8,
      sleepQuality: 'poor',
      sleepHours: 3,
      notes: 'Very difficult'
    }
  ];

  const mockLimitations: Limitation[] = [
    {
      id: 'lim1',
      profileId: 'profile1',
      category: 'mobility',
      description: 'Cannot stand for more than 30 minutes',
      severity: 'severe',
      dateStarted: new Date('2024-01-01'),
      impacts: ['work', 'daily_activities'],
      accommodationsNeeded: ['Frequent breaks', 'Sitting workspace']
    }
  ];

  describe('buildFromLogs', () => {
    it('should build RFC from daily logs and limitations', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc).toBeDefined();
      expect(rfc.profileId).toBe('profile1');
      expect(rfc.assessmentDate).toBeDefined();
      expect(rfc.workCapacityLevel).toBeDefined();
      expect(rfc.canWorkFullTime).toBeDefined();
    });

    it('should analyze exertional capacity', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.exertionalCapacity).toBeDefined();
      expect(rfc.exertionalCapacity.sitting).toBeDefined();
      expect(rfc.exertionalCapacity.standing).toBeDefined();
      expect(rfc.exertionalCapacity.walking).toBeDefined();
      expect(rfc.exertionalCapacity.maxLiftingCapacity).toBeDefined();
    });

    it('should determine work capacity level based on limitations', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(['sedentary', 'light', 'medium', 'heavy', 'very_heavy']).toContain(
        rfc.workCapacityLevel
      );
    });

    it('should include supporting evidence', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.exertionalCapacity.sitting.supportingEvidence.length).toBeGreaterThan(0);
      expect(rfc.evidenceSummary).toBeDefined();
      expect(rfc.evidenceSummary.totalLogs).toBe(2);
    });

    it('should detect consistent patterns', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.evidenceSummary.consistentPatterns).toBeDefined();
    });

    it('should handle empty logs gracefully', () => {
      const rfc = RFCBuilder.buildFromLogs([], []);

      expect(rfc).toBeDefined();
      expect(rfc.evidenceSummary.totalLogs).toBe(0);
    });
  });

  describe('analyzeExertionalCapacity', () => {
    it('should limit standing capacity based on pain levels', () => {
      const highPainLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${i + 1}`),
        symptoms: [{ name: 'Back Pain', severity: 9, duration: 480 }],
        overallPainLevel: 9,
        fatigueLevel: 8,
        sleepQuality: 'poor',
        sleepHours: 4,
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs(highPainLogs, mockLimitations);

      expect(rfc.exertionalCapacity.standing.hoursWithoutBreak).toBeLessThan(2);
    });

    it('should limit lifting capacity based on severity', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.exertionalCapacity.maxLiftingCapacity.occasionalWeight).toBeDefined();
      expect(rfc.exertionalCapacity.maxLiftingCapacity.frequentWeight).toBeDefined();
      expect(
        rfc.exertionalCapacity.maxLiftingCapacity.frequentWeight
      ).toBeLessThanOrEqual(
        rfc.exertionalCapacity.maxLiftingCapacity.occasionalWeight
      );
    });
  });

  describe('analyzePosturalLimitations', () => {
    it('should identify postural limitations from pain patterns', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.posturalLimitations).toBeDefined();
      expect(rfc.posturalLimitations.stooping).toBeDefined();
      expect(rfc.posturalLimitations.kneeling).toBeDefined();
      expect(rfc.posturalLimitations.crouching).toBeDefined();
    });
  });

  describe('analyzeMentalLimitations', () => {
    it('should analyze concentration based on fatigue', () => {
      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, mockLimitations);

      expect(rfc.mentalLimitations.concentration).toBeDefined();
      expect(typeof rfc.mentalLimitations.concentration.limited).toBe('boolean');
    });

    it('should identify memory limitations from sleep quality', () => {
      const poorSleepLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${i + 1}`),
        symptoms: [],
        overallPainLevel: 5,
        fatigueLevel: 8,
        sleepQuality: 'poor',
        sleepHours: 3,
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs(poorSleepLogs, []);

      expect(rfc.mentalLimitations.memory).toBeDefined();
    });
  });

  describe('work capacity determination', () => {
    it('should determine sedentary capacity for severe limitations', () => {
      const severeLimitations: Limitation[] = [
        {
          id: 'lim1',
          profileId: 'profile1',
          category: 'mobility',
          description: 'Cannot stand',
          severity: 'severe',
          dateStarted: new Date('2024-01-01'),
          impacts: ['work'],
          accommodationsNeeded: []
        },
        {
          id: 'lim2',
          profileId: 'profile1',
          category: 'strength',
          description: 'Cannot lift',
          severity: 'severe',
          dateStarted: new Date('2024-01-01'),
          impacts: ['work'],
          accommodationsNeeded: []
        }
      ];

      const rfc = RFCBuilder.buildFromLogs(mockDailyLogs, severeLimitations);

      expect(rfc.workCapacityLevel).toBe('sedentary');
      expect(rfc.canWorkFullTime).toBe(false);
    });

    it('should determine light capacity for moderate limitations', () => {
      const moderateLimitations: Limitation[] = [
        {
          id: 'lim1',
          profileId: 'profile1',
          category: 'mobility',
          description: 'Limited standing',
          severity: 'moderate',
          dateStarted: new Date('2024-01-01'),
          impacts: ['work'],
          accommodationsNeeded: []
        }
      ];

      const lightPainLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${i + 1}`),
        symptoms: [{ name: 'Pain', severity: 4, duration: 240 }],
        overallPainLevel: 4,
        fatigueLevel: 4,
        sleepQuality: 'fair',
        sleepHours: 6,
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs(lightPainLogs, moderateLimitations);

      expect(['sedentary', 'light']).toContain(rfc.workCapacityLevel);
    });
  });
});
