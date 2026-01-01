/**
 * Simplified RFC Builder Tests
 * Tests the actual RFCBuilder API with correct signatures
 */

import { RFCBuilder } from '../RFCBuilder';
import { createMockDailyLog, createMockActivityLog, createMockLimitation } from '../../__tests__/testHelpers';

describe('RFCBuilder', () => {
  describe('buildFromLogs', () => {
    it('should build RFC with valid options object', () => {
      const dailyLog = createMockDailyLog({
        id: 'log1',
        logDate: '2024-01-15',
        overallSeverity: 7
      });

      const options = {
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: []
      };

      const rfc = RFCBuilder.buildFromLogs(options);

      expect(rfc).toBeDefined();
      expect(rfc.profileId).toBe('profile1');
      expect(rfc.assessmentStartDate).toBe('2024-01-01');
      expect(rfc.assessmentEndDate).toBe('2024-01-31');
    });

    it('should throw error with no logs in date range', () => {
      const options = {
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: [],
        activityLogs: [],
        limitations: []
      };

      expect(() => RFCBuilder.buildFromLogs(options)).toThrow('Insufficient data');
    });

    it('should include evidence summary', () => {
      const dailyLogs = [
        createMockDailyLog({ id: 'log1', logDate: '2024-01-15' }),
        createMockDailyLog({ id: 'log2', logDate: '2024-01-16' })
      ];

      const options = {
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs,
        activityLogs: [],
        limitations: []
      };

      const rfc = RFCBuilder.buildFromLogs(options);

      expect(rfc.evidenceSummary).toBeDefined();
      expect(rfc.evidenceSummary.totalDailyLogs).toBe(2);
    });

    it('should process activity logs', () => {
      const activityLog = createMockActivityLog({
        id: 'activity1',
        activityDate: '2024-01-15'
      });

      const options = {
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: [],
        activityLogs: [activityLog],
        limitations: []
      };

      const rfc = RFCBuilder.buildFromLogs(options);

      expect(rfc.evidenceSummary.totalActivityLogs).toBe(1);
    });

    it('should process limitations', () => {
      const limitation = createMockLimitation({
        id: 'lim1',
        category: 'standing'
      });

      const dailyLog = createMockDailyLog({ logDate: '2024-01-15' });

      const options = {
        profileId: 'profile1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyLogs: [dailyLog],
        activityLogs: [],
        limitations: [limitation]
      };

      const rfc = RFCBuilder.buildFromLogs(options);

      expect(rfc.evidenceSummary.totalLimitations).toBe(1);
    });
  });
});
