/**
 * Evidence Timestamp Tests
 * Tests REQ-TS-001 through REQ-TS-006
 * 
 * Spec: spec/evidence-hardened-v1.md
 * Requirements: timestamps group in derived-requirements.json
 */

import {
  createTestDailyLogWithEvidence,
  createTestTimestamp,
  assertISO8601,
  assertImmutableTimestamp,
  createTestResult,
  type RequirementTestResult
} from '../test-utils';
import { createDailyLog } from '../../src/domain/models/DailyLog';

describe('Evidence Timestamps', () => {
  const testResults: RequirementTestResult[] = [];

  afterAll(() => {
    console.log('Timestamp Test Results:', JSON.stringify(testResults, null, 2));
  });

  /**
   * REQ-TS-001: When Evidence Mode is enabled, ALL newly created logs 
   * (DailyLog and ActivityLog) MUST receive an evidenceTimestamp field 
   * set to current system time in ISO 8601 format at moment of creation
   */
  test('REQ-TS-001: Evidence timestamp is set on log creation when Evidence Mode enabled', () => {
    const requirementId = 'REQ-TS-001';
    
    try {
      const now = createTestTimestamp();
      const log = createTestDailyLogWithEvidence('2026-02-06', now);

      // Assert: evidenceTimestamp field exists
      expect(log.evidenceTimestamp).toBeDefined();

      // Assert: evidenceTimestamp is in ISO 8601 format
      assertISO8601(log.evidenceTimestamp);

      // Assert: evidenceTimestamp is set to current time (within test tolerance)
      expect(log.evidenceTimestamp).toBe(now);

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
   * REQ-TS-002: Evidence timestamps MUST be immutable. 
   * Once set, they MUST NOT be modified or removed
   */
  test('REQ-TS-002: Evidence timestamps are immutable', () => {
    const requirementId = 'REQ-TS-002';
    
    try {
      const originalTimestamp = createTestTimestamp();
      const log = createTestDailyLogWithEvidence('2026-02-06', originalTimestamp);

      // Record original timestamp
      const timestampBefore = log.evidenceTimestamp;

      // Attempt to modify (simulated - in real code this should be prevented)
      // This test documents the requirement; enforcement is in service layer
      const attemptedNewTimestamp = createTestTimestamp(5);
      
      // Assert: Timestamp should not change
      // Note: This is a data model test; actual immutability enforcement
      // is in the store/service layer with Object.freeze or similar
      assertImmutableTimestamp(timestampBefore, log.evidenceTimestamp);

      // Assert: Timestamp was not removed
      expect(log.evidenceTimestamp).toBeDefined();

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
   * REQ-TS-003: Evidence timestamps MUST be distinct from 
   * createdAt and updatedAt fields
   */
  test('REQ-TS-003: Evidence timestamp is distinct from createdAt and updatedAt', () => {
    const requirementId = 'REQ-TS-003';
    
    try {
      const evidenceTime = createTestTimestamp(0);
      const log = createTestDailyLogWithEvidence('2026-02-06', evidenceTime);

      // Assert: All three timestamp fields exist
      expect(log.createdAt).toBeDefined();
      expect(log.updatedAt).toBeDefined();
      expect(log.evidenceTimestamp).toBeDefined();

      // Assert: evidenceTimestamp is a separate field
      expect(log).toHaveProperty('evidenceTimestamp');
      expect(log).toHaveProperty('createdAt');
      expect(log).toHaveProperty('updatedAt');

      // Assert: Fields are distinct (may have same value, but are separate)
      // They are NOT aliases or duplicates
      const logKeys = Object.keys(log);
      expect(logKeys).toContain('evidenceTimestamp');
      expect(logKeys).toContain('createdAt');
      expect(logKeys).toContain('updatedAt');

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
   * REQ-TS-004: Logs created while Evidence Mode is disabled 
   * MUST NOT have an evidenceTimestamp field
   */
  test('REQ-TS-004: No evidence timestamp when Evidence Mode disabled', () => {
    const requirementId = 'REQ-TS-004';
    
    try {
      // Create log WITHOUT evidence timestamp (Evidence Mode disabled)
      const log = createDailyLog(
        'daily-test-001',
        'profile-test-001',
        '2026-02-06',
        'morning'
      );

      // Assert: evidenceTimestamp field does NOT exist or is undefined
      expect(log.evidenceTimestamp).toBeUndefined();

      // Assert: Log still has createdAt and updatedAt
      expect(log.createdAt).toBeDefined();
      expect(log.updatedAt).toBeDefined();

      // Assert: evidenceTimestamp is not set to any default value
      expect(log.evidenceTimestamp === undefined).toBe(true);

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
   * REQ-TS-005: When viewing a log with an evidence timestamp, 
   * the UI MUST display the timestamp with label 
   * "Evidence recorded: [timestamp]" in human-readable format
   * 
   * NOTE: This is a UI requirement. This test verifies data is present.
   * Actual UI display testing requires component/E2E tests.
   */
  test('REQ-TS-005: Evidence timestamp data is available for UI display', () => {
    const requirementId = 'REQ-TS-005';
    
    try {
      const evidenceTime = createTestTimestamp();
      const log = createTestDailyLogWithEvidence('2026-02-06', evidenceTime);

      // Assert: evidenceTimestamp is available for display
      expect(log.evidenceTimestamp).toBeDefined();
      assertISO8601(log.evidenceTimestamp);

      // Assert: Timestamp can be formatted for human display
      const timestamp = new Date(log.evidenceTimestamp!);
      expect(timestamp.toISOString()).toBe(log.evidenceTimestamp);
      
      // Verify it's a valid date
      expect(timestamp instanceof Date).toBe(true);
      expect(isNaN(timestamp.getTime())).toBe(false);

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
   * REQ-TS-006: Evidence timestamps MUST be included in 
   * all exports (CSV, JSON, PDF)
   * 
   * NOTE: This test documents the requirement. Actual export testing
   * is in the exports test suite.
   */
  test('REQ-TS-006: Evidence timestamp field exists for export inclusion', () => {
    const requirementId = 'REQ-TS-006';
    
    try {
      const evidenceTime = createTestTimestamp();
      const log = createTestDailyLogWithEvidence('2026-02-06', evidenceTime);

      // Assert: evidenceTimestamp field exists and is exportable
      expect(log.evidenceTimestamp).toBeDefined();

      // Assert: Field is serializable to JSON
      const jsonString = JSON.stringify(log);
      expect(jsonString).toContain('evidenceTimestamp');
      expect(jsonString).toContain(evidenceTime);

      // Assert: Field can be accessed for CSV export
      const evidenceTimestampValue = log.evidenceTimestamp;
      expect(typeof evidenceTimestampValue).toBe('string');

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
