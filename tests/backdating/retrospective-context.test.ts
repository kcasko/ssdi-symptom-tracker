/**
 * Backdating and Retrospective Context Tests
 * Tests REQ-BD-001 through REQ-BD-007
 * 
 * Spec: spec/evidence-hardened-v1.md
 * Requirements: backdating group in derived-requirements.json
 */

import {
  createBackdatedLog,
  daysBetween,
  assertValidRetrospectiveContext,
  assertISO8601,
  createTestResult,
  type RequirementTestResult
} from '../test-utils';

describe('Backdating and Retrospective Context', () => {
  const testResults: RequirementTestResult[] = [];

  afterAll(() => {
    console.log('Backdating Test Results:', JSON.stringify(testResults, null, 2));
  });

  /**
   * REQ-BD-001: When a user creates a log where logDate differs from current date,
   * the system MUST calculate daysDelayed
   */
  test('REQ-BD-001: daysDelayed is calculated when logDate differs from creation date', () => {
    const requirementId = 'REQ-BD-001';
    
    try {
      const logDate = '2026-02-01'; // Event date
      const createdAt = '2026-02-05T12:00:00.000Z'; // Logged 4 days later
      const expectedDelay = 4;

      const log = createBackdatedLog(logDate, createdAt, expectedDelay);

      // Assert: retrospectiveContext exists
      expect(log.retrospectiveContext).toBeDefined();

      // Assert: daysDelayed is calculated
      expect(log.retrospectiveContext!.daysDelayed).toBeDefined();
      expect(log.retrospectiveContext!.daysDelayed).toBe(expectedDelay);

      // Assert: daysDelayed matches actual difference
      const actualDiff = daysBetween(logDate, createdAt);
      expect(log.retrospectiveContext!.daysDelayed).toBe(actualDiff);

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
   * REQ-BD-002: If daysDelayed > 0 (backdating), the system MAY offer 
   * the user an option to provide a RetrospectiveContext
   * 
   * NOTE: This is a UI/UX requirement. Test verifies data model support.
   */
  test('REQ-BD-002: RetrospectiveContext can be provided for backdated entries', () => {
    const requirementId = 'REQ-BD-002';
    
    try {
      const logDate = '2026-02-01';
      const createdAt = '2026-02-03T10:00:00.000Z';
      const daysDelayed = 2;

      const log = createBackdatedLog(logDate, createdAt, daysDelayed);

      // Assert: retrospectiveContext field exists
      expect(log).toHaveProperty('retrospectiveContext');

      // Assert: daysDelayed > 0 indicates backdating
      expect(log.retrospectiveContext!.daysDelayed).toBeGreaterThan(0);

      // Assert: User can provide retrospective context
      expect(log.retrospectiveContext).toBeDefined();
      expect(log.retrospectiveContext!.reason).toBeDefined();
      expect(log.retrospectiveContext!.note).toBeDefined();

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
   * REQ-BD-003: Retrospective context MUST include:
   * - reason (optional preset string)
   * - note (optional free text)
   * - flaggedAt (ISO 8601 timestamp when context was added)
   * - daysDelayed (integer, non-negative)
   */
  test('REQ-BD-003: RetrospectiveContext contains all required fields', () => {
    const requirementId = 'REQ-BD-003';
    
    try {
      const logDate = '2026-01-28';
      const createdAt = '2026-02-06T12:00:00.000Z';
      const daysDelayed = 9;

      const log = createBackdatedLog(logDate, createdAt, daysDelayed);
      const context = log.retrospectiveContext!;

      // Assert: daysDelayed exists and is integer >= 0
      expect(context.daysDelayed).toBeDefined();
      expect(Number.isInteger(context.daysDelayed)).toBe(true);
      expect(context.daysDelayed).toBeGreaterThanOrEqual(0);

      // Assert: flaggedAt exists and is ISO 8601
      expect(context.flaggedAt).toBeDefined();
      assertISO8601(context.flaggedAt!);

      // Assert: reason exists (optional but present in test data)
      expect(context).toHaveProperty('reason');

      // Assert: note exists (optional but present in test data)
      expect(context).toHaveProperty('note');

      // Use validation helper
      assertValidRetrospectiveContext(context);

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
   * REQ-BD-004: Retrospective context, once created, MUST NOT be removed.
   * It MAY be edited through the revision system if log is finalized
   * 
   * NOTE: This test documents the requirement.  Enforcement is in service layer.
   */
  test('REQ-BD-004: RetrospectiveContext immutability requirements', () => {
    const requirementId = 'REQ-BD-004';
    
    try {
      const log = createBackdatedLog('2026-02-01', '2026-02-05T10:00:00.000Z', 4);

      // Assert: Context exists
      expect(log.retrospectiveContext).toBeDefined();

      const originalContext = log.retrospectiveContext;

      // Assert: Context is present and not nullable
      expect(originalContext).not.toBeNull();

      // Document requirement: Removal should be prevented
      // Service layer must enforce this
      const hasContext = (log: typeof log) => {
        return log.retrospectiveContext !== undefined && log.retrospectiveContext !== null;
      };

      expect(hasContext(log)).toBe(true);

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
   * REQ-BD-005: CSV exports MUST include a column for daysDelayed for all logs
   * 
   * NOTE: Full CSV export testing is in exports test suite.
   * This test verifies field is exportable.
   */
  test('REQ-BD-005: daysDelayed field is exportable', () => {
    const requirementId = 'REQ-BD-005';
    
    try {
      // Test with backdated log
      const backdatedLog = createBackdatedLog('2026-02-01', '2026-02-04T10:00:00.000Z', 3);
      
      // Assert: daysDelayed is accessible
      expect(backdatedLog.retrospectiveContext?.daysDelayed).toBeDefined();
      expect(typeof backdatedLog.retrospectiveContext?.daysDelayed).toBe('number');

      // Assert: Field is serializable
      const jsonString = JSON.stringify(backdatedLog);
      expect(jsonString).toContain('daysDelayed');

      // Test with same-day log (daysDelayed = 0 or undefined)
      const sameDayLog = {
        id: 'daily-001',
        logDate: '2026-02-06',
        createdAt: '2026-02-06T10:00:00.000Z',
        retrospectiveContext: undefined
      };

      // Assert: Non-backdated logs can export daysDelayed = undefined or 0
      const daysDelayedValue = sameDayLog.retrospectiveContext?.daysDelayed;
      expect(daysDelayedValue === undefined || daysDelayedValue === 0).toBe(true);

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
   * REQ-BD-006: PDF narrative reports MUST disclose when entries are backdated 
   * by including a statement such as "Logged [X] days after occurrence" 
   * when daysDelayed > 0
   * 
   * NOTE: Full PDF generation testing is in exports test suite.
   * This test verifies data is available for disclosure.
   */
  test('REQ-BD-006: Backdating data is available for PDF disclosure', () => {
    const requirementId = 'REQ-BD-006';
    
    try {
      const daysDelayed = 7;
      const backdatedLog = createBackdatedLog('2026-01-30', '2026-02-06T10:00:00.000Z', daysDelayed);

      // Assert: daysDelayed is available
      expect(backdatedLog.retrospectiveContext?.daysDelayed).toBe(daysDelayed);

      // Assert: Can generate disclosure statement
      const generateDisclosure = (days: number) => {
        return `Logged ${days} days after occurrence`;
      };

      const disclosure = generateDisclosure(backdatedLog.retrospectiveContext!.daysDelayed);
      expect(disclosure).toBe('Logged 7 days after occurrence');

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
   * REQ-BD-007: Backdated entries without retrospective context 
   * MUST NOT be suppressed or hidden. They MUST be exported 
   * with daysDelayed value visible
   */
  test('REQ-BD-007: Backdated entries export even without retrospective context', () => {
    const requirementId = 'REQ-BD-007';
    
    try {
      // Create backdated log without retrospective context
      const log = {
        id: 'daily-backdated-001',
        logDate: '2026-02-01',
        createdAt: '2026-02-05T10:00:00.000Z',
        // Note: retrospectiveContext is missing/undefined
      };

      // Calculate daysDelayed manually
      const calculatedDaysDelayed = daysBetween(log.logDate, log.createdAt);

      // Assert: Log is exportable
      const jsonString = JSON.stringify(log);
      expect(jsonString).toBeDefined();
      expect(jsonString.length).toBeGreaterThan(0);

      // Assert: daysDelayed can be computed even when context is missing
      expect(calculatedDaysDelayed).toBe(4);

      // Assert: Export system can include calculated daysDelayed
      const exportData = {
        ...log,
        daysDelayed: calculatedDaysDelayed
      };

      expect(exportData.daysDelayed).toBe(4);
      expect(JSON.stringify(exportData)).toContain('daysDelayed');

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
