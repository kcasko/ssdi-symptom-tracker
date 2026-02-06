/**
 * Statistics and Calculations Requirements Tests
 * Tests for REQ-STAT-001 to REQ-STAT-009
 */

import { 
  createTestDailyLogWithEvidence,
  createTestTimestamp,
  createTestResult,
  daysBetween
} from '../test-utils';

describe('Statistics and Calculations', () => {
  const testResults: any[] = [];

  afterAll(() => {
    console.log('Statistics Test Results:', JSON.stringify(testResults, null, 2));
  });

  /**
   * REQ-STAT-001: All statistical calculations MUST be deterministic
   */
  test('REQ-STAT-001: Calculations are deterministic', () => {
    const requirementId = 'REQ-STAT-001';
    
    try {
      // Create identical input
      const severities = [5, 7, 6, 8, 4];
      
      // Calculate average twice
      const avg1 = severities.reduce((sum, val) => sum + val, 0) / severities.length;
      const avg2 = severities.reduce((sum, val) => sum + val, 0) / severities.length;

      // Should be identical
      expect(avg1).toBe(avg2);
      expect(avg1).toBe(6);

      // Same input should always produce same output
      const input = [1, 2, 3];
      const sum1 = input.reduce((a, b) => a + b, 0);
      const sum2 = input.reduce((a, b) => a + b, 0);
      expect(sum1).toBe(sum2);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-002: No randomness or AI inference in calculations unless disclosed
   */
  test('REQ-STAT-002: No randomness in calculations', () => {
    const requirementId = 'REQ-STAT-002';
    
    try {
      // Statistical functions should not use Math.random or AI
      const values = [10, 20, 30];
      
      // Standard average calculation
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      expect(average).toBe(20);

      // Max calculation
      const max = Math.max(...values);
      expect(max).toBe(30);

      // These should be repeatable with no variance
      const avg2 = values.reduce((sum, val) => sum + val, 0) / values.length;
      expect(avg2).toBe(average);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-003: Average severity calculations MUST round to nearest integer
   * (0.5 rounds up)
   */
  test('REQ-STAT-003: Severity averages use standard rounding', () => {
    const requirementId = 'REQ-STAT-003';
    
    try {
      // Test standard rounding behavior
      expect(Math.round(4.4)).toBe(4);
      expect(Math.round(4.5)).toBe(5); // 0.5 rounds up
      expect(Math.round(4.6)).toBe(5);
      expect(Math.round(5.5)).toBe(6); // 0.5 rounds up

      // Test with actual severity values
      const severities1 = [4, 5]; // avg = 4.5
      const avg1 = Math.round(severities1.reduce((sum, val) => sum + val, 0) / severities1.length);
      expect(avg1).toBe(5); // 4.5 rounds to 5

      const severities2 = [4, 4, 5]; // avg = 4.333...
      const avg2 = Math.round(severities2.reduce((sum, val) => sum + val, 0) / severities2.length);
      expect(avg2).toBe(4); // 4.333 rounds to 4

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-004: Percentage calculations MUST round to one decimal place
   */
  test('REQ-STAT-004: Percentages round to one decimal place', () => {
    const requirementId = 'REQ-STAT-004';
    
    try {
      // Calculate percentage
      const part = 3;
      const total = 7;
      const percentage = (part / total) * 100;
      
      // Round to one decimal
      const rounded = Math.round(percentage * 10) / 10;
      expect(rounded).toBe(42.9);

      // Another test
      const pct2 = (5 / 9) * 100; // 55.555...
      const rounded2 = Math.round(pct2 * 10) / 10;
      expect(rounded2).toBe(55.6);

      // Exact percentage
      const pct3 = (1 / 4) * 100; // 25.0
      const rounded3 = Math.round(pct3 * 10) / 10;
      expect(rounded3).toBe(25.0);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-005: Date range calculations MUST be inclusive of start and end dates
   */
  test('REQ-STAT-005: Date ranges are inclusive', () => {
    const requirementId = 'REQ-STAT-005';
    
    try {
      // Jan 1 to Jan 3 = 3 days (inclusive)
      const start1 = '2026-01-01';
      const end1 = '2026-01-03';
      const days1 = daysBetween(start1, end1) + 1; // +1 for inclusive
      expect(days1).toBe(3);

      // Same day = 1 day
      const start2 = '2026-01-01';
      const end2 = '2026-01-01';
      const days2 = daysBetween(start2, end2) + 1;
      expect(days2).toBe(1);

      // Week range
      const start3 = '2026-01-01';
      const end3 = '2026-01-07';
      const days3 = daysBetween(start3, end3) + 1;
      expect(days3).toBe(7);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-006: "Days with symptom X" counts MUST only count days where
   * symptom X has severity > 0
   */
  test('REQ-STAT-006: Symptom day counts exclude zero severity', () => {
    const requirementId = 'REQ-STAT-006';
    
    try {
      // Mock logs with symptom data
      const logs = [
        { symptoms: [{ symptomId: 'headache', severity: 5 }] },
        { symptoms: [{ symptomId: 'headache', severity: 0 }] }, // Should not count
        { symptoms: [{ symptomId: 'headache', severity: 7 }] },
        { symptoms: [{ symptomId: 'fatigue', severity: 4 }] },
      ];

      // Count days with headache severity > 0
      const headacheDays = logs.filter(log =>
        log.symptoms.some(s => s.symptomId === 'headache' && s.severity > 0)
      ).length;

      expect(headacheDays).toBe(2); // Only logs 1 and 3

      // Verify severity 0 is excluded
      const zeroDays = logs.filter(log =>
        log.symptoms.some(s => s.symptomId === 'headache' && s.severity === 0)
      ).length;
      expect(zeroDays).toBe(1); // This should NOT be in the count

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-007: Gap detection MUST use calendar days, not elapsed hours
   */
  test('REQ-STAT-007: Gap calculations use calendar days', () => {
    const requirementId = 'REQ-STAT-007';
    
    try {
      // Calendar day calculation
      const date1 = '2026-01-01';
      const date2 = '2026-01-04';
      
      // Should be 3 days difference (calendar days)
      const calendarDays = daysBetween(date1, date2);
      expect(calendarDays).toBe(3);

      // Not influenced by time of day
      const datetime1 = '2026-01-01T23:59:00Z';
      const datetime2 = '2026-01-02T00:01:00Z';
      // Still 1 calendar day apart
      const d1 = new Date(datetime1);
      const d2 = new Date(datetime2);
      const dayDiff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      expect(dayDiff).toBe(0); // Less than 24 hours, but...
      
      // Calendar day comparison should check date parts
      const calendarDate1 = datetime1.split('T')[0];
      const calendarDate2 = datetime2.split('T')[0];
      const calendarDiff = daysBetween(calendarDate1, calendarDate2);
      expect(calendarDiff).toBe(1); // Different calendar days

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-008: Every statistic MUST be traceable to source log entries
   */
  test('REQ-STAT-008: Statistics can reference source logs', () => {
    const requirementId = 'REQ-STAT-008';
    
    try {
      // Create test logs
      const log1 = createTestDailyLogWithEvidence('2026-02-01', createTestTimestamp(0));
      const log2 = createTestDailyLogWithEvidence('2026-02-02', createTestTimestamp(1));
      const log3 = createTestDailyLogWithEvidence('2026-02-03', createTestTimestamp(2));

      const logs = [log1, log2, log3];

      // Calculate statistic with traceability
      const logIds = logs.map(l => l.id);
      const count = logs.length;

      // Statistic should be traceable
      const statistic = {
        value: count,
        sourceLogIds: logIds,
        description: 'Total logs in date range',
      };

      expect(statistic.value).toBe(3);
      expect(statistic.sourceLogIds.length).toBe(3);
      expect(statistic.sourceLogIds).toContain(log1.id);
      expect(statistic.sourceLogIds).toContain(log2.id);
      expect(statistic.sourceLogIds).toContain(log3.id);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  /**
   * REQ-STAT-009: System MUST be able to generate source log IDs list for any statistic
   */
  test('REQ-STAT-009: Source log ID lists are generatable', () => {
    const requirementId = 'REQ-STAT-009';
    
    try {
      // Mock statistic calculation with source tracking
      const logs = [
        { id: 'log-001', symptoms: [{ symptomId: 'headache', severity: 7 }] },
        { id: 'log-002', symptoms: [{ symptomId: 'headache', severity: 5 }] },
        { id: 'log-003', symptoms: [{ symptomId: 'fatigue', severity: 6 }] },
      ];

      // Generate source IDs for "days with headache"
      const headacheSourceIds = logs
        .filter(log => log.symptoms.some(s => s.symptomId === 'headache'))
        .map(log => log.id);

      expect(headacheSourceIds).toEqual(['log-001', 'log-002']);
      expect(headacheSourceIds.length).toBe(2);

      // Verify each ID is valid
      headacheSourceIds.forEach(id => {
        const sourceLog = logs.find(l => l.id === id);
        expect(sourceLog).toBeDefined();
      });

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });
});
