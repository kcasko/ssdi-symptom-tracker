/**
 * Tests for Credibility Scorer
 */

import { CredibilityScorer } from '../CredibilityScorer';
import { DailyLog } from '../../domain/models/DailyLog';
import { createMockDailyLog } from '../../__tests__/testHelpers';

describe('CredibilityScorer', () => {
  describe('calculateCredibility', () => {
    const createConsistentLogs = (count: number): DailyLog[] => {
      return Array(count).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [
            { symptomId: 'backpain', severity: 7, duration: 480, notes: 'Detailed notes about pain' }
          ],
          overallSeverity: 7,
        });
      });
    };

    it('should return credibility score with all components', () => {
      const logs = createConsistentLogs(90);
      const score = CredibilityScorer.calculateCredibility(logs, [], [], []);

      expect(score).toBeDefined();
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.indicators.loggingConsistency).toBeDefined();
      expect(score.indicators.dataCompleteness).toBeDefined();
      expect(score.indicators.durationCoverage).toBeDefined();
      expect(score.recommendations).toBeDefined();
    });

    it('should give high score for consistent, detailed long-term logs', () => {
      const logs = createConsistentLogs(120);
      const score = CredibilityScorer.calculateCredibility(logs, [], [], []);

      expect(score.overallScore).toBeGreaterThan(70);
      expect(score.indicators.loggingConsistency.score).toBeGreaterThan(80);
      expect(score.indicators.durationCoverage.score).toBeGreaterThan(80);
    });

    it('should give low score for sparse logs', () => {
      const logs = createConsistentLogs(10);
      const score = CredibilityScorer.calculateCredibility(logs, [], [], []);

      expect(score.indicators.durationCoverage.score).toBeLessThan(50);
    });

    it('should give low score for missing details', () => {
      const minimalLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [],
          overallSeverity: 5,
        });
      });

      const score = CredibilityScorer.calculateCredibility(minimalLogs, [], [], []);
      expect(score.indicators.dataCompleteness.score).toBeLessThan(50);
    });

    it('should penalize inconsistent severity reports', () => {
      const inconsistentLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [
            { symptomId: 'pain', severity: i % 2 === 0 ? 2 : 9, duration: 480 }
          ],
          overallSeverity: i % 2 === 0 ? 2 : 9,
        });
      });

      const score = CredibilityScorer.calculateCredibility(inconsistentLogs, [], [], []);
      expect(score.indicators.patternStability.score).toBeLessThan(70);
    });

    it('should provide improvement suggestions', () => {
      const logs = createConsistentLogs(20);
      const score = CredibilityScorer.calculateCredibility(logs, [], [], []);

      expect(score.recommendations.length).toBeGreaterThan(0);
      score.recommendations.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty logs gracefully', () => {
      const score = CredibilityScorer.calculateCredibility([], [], [], []);

      expect(score.overallScore).toBe(0);
      expect(score.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('consistency scoring', () => {
    it('should detect symptom pattern consistency', () => {
      const consistentLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [
            { symptomId: 'backpain', severity: 7 + (i % 3), duration: 480 }
          ],
          overallSeverity: 7,
        });
      });

      const score = CredibilityScorer.calculateCredibility(consistentLogs, [], [], []);
      expect(score.indicators.loggingConsistency.score).toBeGreaterThan(60);
    });

    it('should reward frequency consistency', () => {
      const dailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, i + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [{ symptomId: 'pain', severity: 7, duration: 480 }],
          overallSeverity: 7,
        });
      });

      const score = CredibilityScorer.calculateCredibility(dailyLogs, [], [], []);
      expect(score.indicators.loggingConsistency.score).toBeGreaterThan(70);
    });
  });

  describe('detail scoring', () => {
    it('should reward detailed symptom descriptions', () => {
      const detailedLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [
            {
              symptomId: 'backpain',
              severity: 7,
              duration: 480,
              notes: 'Sharp pain in lower back, radiating down left leg. Worse when standing.'
            }
          ],
          overallSeverity: 7,
          notes: 'Difficult day. Pain prevented normal activities. Used heating pad.'
        });
      });

      const score = CredibilityScorer.calculateCredibility(detailedLogs, [], [], []);
      expect(score.indicators.dataCompleteness.score).toBeGreaterThan(70);
    });

    it('should penalize missing notes', () => {
      const noNotesLogs: DailyLog[] = Array(30).fill(null).map((_, i) => {
        const date = new Date(2024, 0, (i % 30) + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [{ symptomId: 'pain', severity: 7, duration: 480 }],
          overallSeverity: 7,
          notes: ''
        });
      });

      const score = CredibilityScorer.calculateCredibility(noNotesLogs, [], [], []);
      expect(score.indicators.dataCompleteness.score).toBeLessThan(60);
    });
  });

  describe('time range scoring', () => {
    it('should reward 90+ days of logs', () => {
      const longTermLogs: DailyLog[] = Array(100).fill(null).map((_, i) => {
        const date = new Date(2024, 0, i + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [{ symptomId: 'pain', severity: 7, duration: 480 }],
          overallSeverity: 7,
          notes: 'Daily tracking'
        });
      });

      const score = CredibilityScorer.calculateCredibility(longTermLogs, [], [], []);
      expect(score.indicators.durationCoverage.score).toBeGreaterThan(80);
    });

    it('should penalize short tracking periods', () => {
      const shortTermLogs: DailyLog[] = Array(15).fill(null).map((_, i) => {
        const date = new Date(2024, 0, i + 1);
        return createMockDailyLog({
          id: `log${i}`,
          logDate: date.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
          symptoms: [{ symptomId: 'pain', severity: 7, duration: 480 }],
          overallSeverity: 7,
          notes: ''
        });
      });

      const score = CredibilityScorer.calculateCredibility(shortTermLogs, [], [], []);
      expect(score.indicators.durationCoverage.score).toBeLessThan(40);
    });
  });
});
