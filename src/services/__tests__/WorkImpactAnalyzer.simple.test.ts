/**
 * Simplified Work Impact Analyzer Tests
 * Tests the actual WorkImpactAnalyzer API with correct signatures
 */

import { WorkImpactAnalyzer } from '../WorkImpactAnalyzer';
import {
  createMockWorkHistory,
  createMockDailyLog,
  createMockActivityLog,
  createMockLimitation,
  createMockJobDuty
} from '../../__tests__/testHelpers';

describe('WorkImpactAnalyzer', () => {
  describe('analyzeWorkImpact', () => {
    it('should analyze work impact with valid options', () => {
      const duty = createMockJobDuty({
        id: 'duty1',
        description: 'Lifting boxes',
        isEssential: true
      });

      const workHistory = createMockWorkHistory({
        id: 'job1',
        jobTitle: 'Warehouse Worker',
        duties: [duty]
      });

      const dailyLog = createMockDailyLog({
        logDate: '2024-01-15',
        overallSeverity: 7
      });

      const options = {
        workHistory,
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: [],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(options);

      expect(impact).toBeDefined();
      expect(impact.workHistoryId).toBe('job1');
      expect(impact.jobTitle).toBe('Warehouse Worker');
      expect(typeof impact.canReturnToThisJob).toBe('boolean');
    });

    it('should analyze duty impacts', () => {
      const duties = [
        createMockJobDuty({ id: 'duty1', description: 'Standing', isEssential: true }),
        createMockJobDuty({ id: 'duty2', description: 'Walking', isEssential: true })
      ];

      const workHistory = createMockWorkHistory({ duties });
      const dailyLog = createMockDailyLog({ logDate: '2024-01-15' });

      const options = {
        workHistory,
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: [],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(options);

      expect(impact.dutyImpacts.length).toBe(2);
      impact.dutyImpacts.forEach(dutyImpact => {
        expect(dutyImpact.dutyId).toBeDefined();
        expect(dutyImpact.dutyDescription).toBeDefined();
        expect(dutyImpact.canPerform).toBeDefined();
        expect(['yes', 'no', 'with_difficulty', 'with_accommodation']).toContain(dutyImpact.canPerform);
      });
    });

    it('should include evidence base', () => {
      const workHistory = createMockWorkHistory({
        duties: [createMockJobDuty({ id: 'duty1' })]
      });

      const dailyLog = createMockDailyLog({ id: 'log1', logDate: '2024-01-15' });
      const activityLog = createMockActivityLog({ id: 'activity1', activityDate: '2024-01-15' });
      const limitation = createMockLimitation({ id: 'lim1' });

      const options = {
        workHistory,
        dailyLogs: [dailyLog],
        activityLogs: [activityLog],
        limitations: [limitation],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(options);

      expect(impact.evidenceBase).toBeDefined();
      expect(impact.evidenceBase.dailyLogIds.length).toBeGreaterThan(0);
      expect(impact.evidenceBase.activityLogIds.length).toBeGreaterThan(0);
      expect(impact.evidenceBase.limitationIds.length).toBeGreaterThan(0);
    });

    it('should calculate impact score', () => {
      const workHistory = createMockWorkHistory({
        duties: [createMockJobDuty()]
      });

      const dailyLog = createMockDailyLog({ logDate: '2024-01-15' });

      const options = {
        workHistory,
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: [],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(options);

      expect(typeof impact.impactScore).toBe('number');
      expect(impact.impactScore).toBeGreaterThanOrEqual(0);
      expect(impact.impactScore).toBeLessThanOrEqual(100);
    });

    it('should generate impact statements', () => {
      const workHistory = createMockWorkHistory({
        duties: [createMockJobDuty({ description: 'Heavy lifting' })]
      });

      const dailyLog = createMockDailyLog({ logDate: '2024-01-15' });

      const options = {
        workHistory,
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: [],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const impact = WorkImpactAnalyzer.analyzeWorkImpact(options);

      expect(Array.isArray(impact.impactStatements)).toBe(true);
    });
  });
});
