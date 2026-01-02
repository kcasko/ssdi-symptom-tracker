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
      createdAt: '2024-01-01T08:00:00Z',
      updatedAt: '2024-01-01T08:00:00Z',
      logDate: '2024-01-01',
      timeOfDay: 'morning',
      symptoms: [
        { symptomId: 'back_pain', severity: 8, duration: 480, notes: 'Constant' }
      ],
      overallSeverity: 8,
      sleepQuality: { hoursSlept: 4, quality: 3, restful: false },
      notes: 'Difficult day'
    },
    {
      id: 'log2',
      profileId: 'profile1',
      createdAt: '2024-01-02T08:00:00Z',
      updatedAt: '2024-01-02T08:00:00Z',
      logDate: '2024-01-02',
      timeOfDay: 'morning',
      symptoms: [
        { symptomId: 'back_pain', severity: 9, duration: 480, notes: 'Severe' }
      ],
      overallSeverity: 9,
      sleepQuality: { hoursSlept: 3, quality: 2, restful: false },
      notes: 'Very difficult'
    }
  ];

  const mockLimitations: Limitation[] = [
    {
      id: 'lim1',
      profileId: 'profile1',
      createdAt: '2024-01-01T08:00:00Z',
      updatedAt: '2024-01-01T08:00:00Z',
      category: 'standing',
      timeThreshold: { durationMinutes: 30, confidence: 'high' },
      frequency: 'always',
      consequences: ['Severe pain', 'Need to sit'],
      accommodations: ['Frequent breaks', 'Sitting workspace'],
      variability: 'consistent',
      notes: 'Cannot stand for more than 30 minutes',
      isActive: true
    }
  ];

  describe('buildFromLogs', () => {
    it('should build RFC from daily logs and limitations', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc).toBeDefined();
      expect(rfc.profileId).toBe('profile1');
      expect(rfc.assessmentEndDate).toBeDefined();
      expect(rfc.overallRating).toBeDefined();
      expect(rfc.canWorkFullTime).toBeDefined();
    });

    it('should analyze exertional capacity', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.exertionalLimitations).toBeDefined();
      expect(rfc.exertionalLimitations.sitting).toBeDefined();
      expect(rfc.exertionalLimitations.standing).toBeDefined();
      expect(rfc.exertionalLimitations.walking).toBeDefined();
      expect(rfc.exertionalLimitations.lifting).toBeDefined();
    });

    it('should determine work capacity level based on limitations', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(['sedentary', 'light', 'medium', 'heavy', 'very_heavy']).toContain(
        rfc.overallRating
      );
    });

    it('should include supporting evidence', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.exertionalLimitations.sitting.evidence.length).toBeGreaterThan(0);
      expect(rfc.evidenceSummary).toBeDefined();
      expect(rfc.evidenceSummary.totalDailyLogs).toBe(2);
    });

    it('should detect consistent patterns', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.evidenceSummary.consistentPatterns).toBeDefined();
    });

    it('should handle empty logs gracefully', () => {
      expect(() => RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: [],
        activityLogs: [],
        limitations: []
      })).toThrow('Insufficient data');
    });
  });

  describe('analyzeExertionalCapacity', () => {
    it('should limit standing capacity based on pain levels', () => {
      const highPainLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        createdAt: `2024-01-0${i + 1}T08:00:00Z`,
        updatedAt: `2024-01-0${i + 1}T08:00:00Z`,
        logDate: `2024-01-0${i + 1}`,
        timeOfDay: 'morning' as const,
        symptoms: [{ symptomId: 'back-pain', severity: 9, duration: 480 }],
        overallSeverity: 9,
        sleepQuality: { hoursSlept: 4, quality: 2, restful: false },
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: highPainLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.exertionalLimitations.standing.maxContinuousMinutes).toBeLessThan(30); // More realistic threshold
    });

    it('should limit lifting capacity based on severity', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional).toBeDefined();
      expect(rfc.exertionalLimitations.lifting.maxWeightPoundsFrequent).toBeDefined();
      expect(
        rfc.exertionalLimitations.lifting.maxWeightPoundsFrequent
      ).toBeLessThanOrEqual(
        rfc.exertionalLimitations.lifting.maxWeightPoundsOccasional
      );
    });
  });

  describe('analyzePosturalLimitations', () => {
    it('should identify postural limitations from pain patterns', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.posturalLimitations).toBeDefined();
      expect(rfc.posturalLimitations.stooping).toBeDefined();
      expect(rfc.posturalLimitations.kneeling).toBeDefined();
      expect(rfc.posturalLimitations.crouching).toBeDefined();
    });
  });

  describe('analyzeMentalLimitations', () => {
    it('should analyze concentration based on fatigue', () => {
      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: mockLimitations
      });

      expect(rfc.mentalLimitations.concentration).toBeDefined();
      expect(typeof rfc.mentalLimitations.concentration.requiresFrequentBreaks).toBe('boolean');
    });

    it('should identify memory limitations from sleep quality', () => {
      const poorSleepLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        createdAt: `2024-01-0${i + 1}T08:00:00Z`,
        updatedAt: `2024-01-0${i + 1}T08:00:00Z`,
        logDate: `2024-01-0${i + 1}`,
        timeOfDay: 'morning' as const,
        symptoms: [],
        overallSeverity: 5,
        sleepQuality: { hoursSlept: 3, quality: 2, restful: false },
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: poorSleepLogs,
        activityLogs: [],
        limitations: []
      });

      expect(rfc.mentalLimitations.memory).toBeDefined();
    });
  });

  describe('work capacity determination', () => {
    it('should determine sedentary capacity for severe limitations', () => {
      const severeLimitations: Limitation[] = [
        {
          id: 'lim1',
          profileId: 'profile1',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z',
          category: 'standing',
          frequency: 'always',
          consequences: ['Cannot stand'],
          variability: 'consistent',
          notes: 'Cannot stand',
          isActive: true
        },
        {
          id: 'lim2',
          profileId: 'profile1',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z',
          category: 'lifting',
          frequency: 'always',
          consequences: ['Cannot lift'],
          variability: 'consistent',
          notes: 'Cannot lift',
          isActive: true
        }
      ];

      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: mockDailyLogs,
        activityLogs: [],
        limitations: severeLimitations
      });

      expect(rfc.overallRating).toBe('sedentary');
      expect(rfc.canWorkFullTime).toBe(false);
    });

    it('should determine light capacity for moderate limitations', () => {
      const moderateLimitations: Limitation[] = [
        {
          id: 'lim1',
          profileId: 'profile1',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z',
          category: 'standing',
          timeThreshold: { durationMinutes: 120, confidence: 'moderate' },
          frequency: 'often',
          consequences: ['Pain increases'],
          variability: 'some_variability',
          notes: 'Limited standing',
          isActive: true
        }
      ];

      const lightPainLogs: DailyLog[] = Array(10).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        createdAt: `2024-01-0${i + 1}T08:00:00Z`,
        updatedAt: `2024-01-0${i + 1}T08:00:00Z`,
        logDate: `2024-01-0${i + 1}`,
        timeOfDay: 'morning' as const,
        symptoms: [{ symptomId: 'pain', severity: 4, duration: 240 }],
        overallSeverity: 4,
        sleepQuality: { hoursSlept: 6, quality: 6, restful: true },
        notes: ''
      }));

      const rfc = RFCBuilder.buildFromLogs({
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: lightPainLogs,
        activityLogs: [],
        limitations: moderateLimitations
      });

      expect(['sedentary', 'light']).toContain(rfc.overallRating);
    });
  });
});
