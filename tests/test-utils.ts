/**
 * Test Utilities for Evidence-Hardened v1.0 Compliance Testing
 * Provides helpers for creating test data and asserting requirements
 */

import { DailyLog, createDailyLog } from '../src/domain/models/DailyLog';
import { ActivityLog } from '../src/domain/models/ActivityLog';
import { EvidenceModeConfig, RevisionRecord } from '../src/domain/models/EvidenceMode';
import { RetrospectiveContext } from '../src/domain/models/RetrospectiveContext';

/**
 * Generate a deterministic timestamp for testing
 */
export function createTestTimestamp(offset: number = 0): string {
  const base = new Date('2026-02-06T12:00:00.000Z');
  base.setHours(base.getHours() + offset);
  return base.toISOString();
}

/**
 * Create a test profile ID
 */
export function createTestProfileId(): string {
  return 'test-profile-001';
}

/**
 * Create a test daily log with evidence mode enabled
 */
export function createTestDailyLogWithEvidence(
  logDate: string,
  evidenceTimestamp?: string
): DailyLog {
  const log = createDailyLog(
    `daily-${Date.now()}-${Math.random()}`,
    createTestProfileId(),
    logDate,
    'morning'
  );
  
  if (evidenceTimestamp) {
    log.evidenceTimestamp = evidenceTimestamp;
  }
  
  return log;
}

/**
 * Create a finalized daily log
 */
export function createFinalizedDailyLog(
  logDate: string,
  finalizedAt?: string
): DailyLog {
  const log = createTestDailyLogWithEvidence(logDate, createTestTimestamp());
  log.finalized = true;
  log.finalizedAt = finalizedAt || createTestTimestamp(1);
  log.finalizedBy = createTestProfileId();
  return log;
}

/**
 * Create a backdated log with retrospective context
 */
export function createBackdatedLog(
  logDate: string,
  createdAt: string,
  daysDelayed: number
): DailyLog {
  const log = createDailyLog(
    `daily-backdated-${Date.now()}`,
    createTestProfileId(),
    logDate,
    'morning'
  );
  
  log.createdAt = createdAt;
  log.updatedAt = createdAt;
  
  log.retrospectiveContext = {
    daysDelayed,
    flaggedAt: createdAt,
    reason: 'Symptoms prevented logging earlier',
    note: 'Was too ill to log at the time'
  };
  
  return log;
}

/**
 * Assert ISO 8601 format
 */
export function assertISO8601(value: string | undefined): void {
  expect(value).toBeDefined();
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
}

/**
 * Assert timestamp is immutable (compare before/after)
 */
export function assertImmutableTimestamp(
  before: string | undefined,
  after: string | undefined
): void {
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(after).toBe(before);
}

/**
 * Assert field is blank (undefined or empty)
 */
export function assertBlank(value: any): void {
  expect(value === undefined || value === null || value === '' || 
         (Array.isArray(value) && value.length === 0)).toBe(true);
}

/**
 * Assert required fields in RevisionRecord
 */
export function assertValidRevisionRecord(revision: RevisionRecord): void {
  expect(revision.id).toBeDefined();
  expect(revision.logId).toBeDefined();
  expect(revision.logType).toBeDefined();
  expect(revision.profileId).toBeDefined();
  expect(revision.revisionTimestamp).toBeDefined();
  assertISO8601(revision.revisionTimestamp);
  expect(revision.reasonCategory).toBeDefined();
  expect(['typo_correction', 'added_detail_omitted_earlier', 
          'correction_after_reviewing_records', 'clarification_requested', 
          'other']).toContain(revision.reasonCategory);
  expect(revision.fieldPath).toBeDefined();
  expect(revision.originalValue).toBeDefined();
  expect(revision.updatedValue).toBeDefined();
}

/**
 * Assert required fields in RetrospectiveContext
 */
export function assertValidRetrospectiveContext(context: RetrospectiveContext): void {
  expect(context.daysDelayed).toBeDefined();
  expect(context.daysDelayed).toBeGreaterThanOrEqual(0);
  expect(context.flaggedAt).toBeDefined();
  assertISO8601(context.flaggedAt);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1Str: string, date2Str: string): number {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Create Evidence Mode config
 */
export function createEvidenceModeConfig(enabled: boolean): EvidenceModeConfig {
  return {
    enabled,
    enabledAt: enabled ? createTestTimestamp() : null,
    enabledBy: enabled ? createTestProfileId() : null
  };
}

/**
 * Assert CSV has required columns
 */
export function assertCSVHasColumns(csvContent: string, requiredColumns: string[]): void {
  const lines = csvContent.split('\n');
  expect(lines.length).toBeGreaterThan(0);
  
  const header = lines[0];
  for (const column of requiredColumns) {
    expect(header).toContain(column);
  }
}

/**
 * Assert CSV cell is empty (blank field requirement)
 */
export function assertCSVCellEmpty(csvContent: string, row: number, column: string): void {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const columnIndex = headers.indexOf(column);
  
  expect(columnIndex).toBeGreaterThanOrEqual(0);
  
  const rowData = lines[row].split(',');
  const cellValue = rowData[columnIndex];
  
  // Must be empty, not "N/A", "null", "0", etc.
  expect(cellValue === '' || cellValue === undefined).toBe(true);
}

/**
 * Test artifact storage
 */
export function getTestArtifactPath(runNumber: number, filename: string): string {
  return `test-artifacts/run-${String(runNumber).padStart(3, '0')}/${filename}`;
}

/**
 * Requirement test result structure
 */
export interface RequirementTestResult {
  requirementId: string;
  passed: boolean;
  timestamp: string;
  artifacts: string[];
  errorMessage?: string;
}

/**
 * Create requirement test result
 */
export function createTestResult(
  requirementId: string,
  passed: boolean,
  artifacts: string[] = [],
  errorMessage?: string
): RequirementTestResult {
  return {
    requirementId,
    passed,
    timestamp: new Date().toISOString(),
    artifacts,
    errorMessage
  };
}
