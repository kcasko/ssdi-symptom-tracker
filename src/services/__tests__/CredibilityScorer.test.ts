/**
 * Tests for Credibility Scorer
 */

import { CredibilityScorer } from '../CredibilityScorer';
import { DailyLog } from '../../domain/models/DailyLog';

describe('CredibilityScorer', () => {
  describe('calculateCredibilityScore', () => {
    const createConsistentLogs = (count: number): DailyLog[] => {
      return Array(count).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [
          { name: 'Back Pain', severity: 7, duration: 480, notes: 'Detailed notes about pain' }
        ],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: 'Comprehensive daily notes'
      }));
    };

    it('should return credibility score with all components', () => {
      const logs = createConsistentLogs(90);
      const score = CredibilityScorer.calculateCredibilityScore(logs);

      expect(score).toBeDefined();
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.consistencyScore).toBeDefined();
      expect(score.detailScore).toBeDefined();
      expect(score.timeRangeScore).toBeDefined();
      expect(score.improvementSuggestions).toBeDefined();
    });

    it('should give high score for consistent, detailed long-term logs', () => {
      const logs = createConsistentLogs(120);
      const score = CredibilityScorer.calculateCredibilityScore(logs);

      expect(score.overallScore).toBeGreaterThan(70);
      expect(score.consistencyScore).toBeGreaterThan(80);
      expect(score.timeRangeScore).toBeGreaterThan(80);
    });

    it('should give low score for sparse logs', () => {
      const logs = createConsistentLogs(10);
      const score = CredibilityScorer.calculateCredibilityScore(logs);

      expect(score.timeRangeScore).toBeLessThan(50);
    });

    it('should give low score for missing details', () => {
      const minimalLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [],
        overallPainLevel: 5,
        fatigueLevel: 5,
        sleepQuality: 'fair',
        sleepHours: 6,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(minimalLogs);
      expect(score.detailScore).toBeLessThan(50);
    });

    it('should penalize inconsistent severity reports', () => {
      const inconsistentLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [
          { name: 'Pain', severity: i % 2 === 0 ? 2 : 9, duration: 480 }
        ],
        overallPainLevel: i % 2 === 0 ? 2 : 9,
        fatigueLevel: i % 2 === 0 ? 1 : 8,
        sleepQuality: 'fair',
        sleepHours: 6,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(inconsistentLogs);
      expect(score.consistencyScore).toBeLessThan(70);
    });

    it('should provide improvement suggestions', () => {
      const logs = createConsistentLogs(20);
      const score = CredibilityScorer.calculateCredibilityScore(logs);

      expect(score.improvementSuggestions.length).toBeGreaterThan(0);
      score.improvementSuggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty logs gracefully', () => {
      const score = CredibilityScorer.calculateCredibilityScore([]);

      expect(score.overallScore).toBe(0);
      expect(score.improvementSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('consistency scoring', () => {
    it('should detect symptom pattern consistency', () => {
      const consistentLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [
          { name: 'Back Pain', severity: 7 + (i % 3), duration: 480 }
        ],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(consistentLogs);
      expect(score.consistencyScore).toBeGreaterThan(60);
    });

    it('should reward frequency consistency', () => {
      const dailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(2024, 0, i + 1),
        symptoms: [{ name: 'Pain', severity: 7, duration: 480 }],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(dailyLogs);
      expect(score.consistencyScore).toBeGreaterThan(70);
    });
  });

  describe('detail scoring', () => {
    it('should reward detailed symptom descriptions', () => {
      const detailedLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [
          {
            name: 'Back Pain',
            severity: 7,
            duration: 480,
            notes: 'Sharp pain in lower back, radiating down left leg. Worse when standing.'
          }
        ],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: 'Difficult day. Pain prevented normal activities. Used heating pad.'
      }));

      const score = CredibilityScorer.calculateCredibilityScore(detailedLogs);
      expect(score.detailScore).toBeGreaterThan(70);
    });

    it('should penalize missing notes', () => {
      const noNotesLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(`2024-01-${(i % 30) + 1}`),
        symptoms: [{ name: 'Pain', severity: 7, duration: 480 }],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(noNotesLogs);
      expect(score.detailScore).toBeLessThan(60);
    });
  });

  describe('time range scoring', () => {
    it('should reward 90+ days of logs', () => {
      const longTermLogs: DailyLog[] = Array(100).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(2024, 0, i + 1),
        symptoms: [{ name: 'Pain', severity: 7, duration: 480 }],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: 'Daily tracking'
      }));

      const score = CredibilityScorer.calculateCredibilityScore(longTermLogs);
      expect(score.timeRangeScore).toBeGreaterThan(80);
    });

    it('should penalize short tracking periods', () => {
      const shortTermLogs: DailyLog[] = Array(15).fill(null).map((_, i) => ({
        id: `log${i}`,
        profileId: 'profile1',
        date: new Date(2024, 0, i + 1),
        symptoms: [{ name: 'Pain', severity: 7, duration: 480 }],
        overallPainLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 'poor',
        sleepHours: 5,
        notes: ''
      }));

      const score = CredibilityScorer.calculateCredibilityScore(shortTermLogs);
      expect(score.timeRangeScore).toBeLessThan(40);
    });
  });
});
