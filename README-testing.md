# Evidence-Hardened v1.0 Testing System

## Overview

This directory contains the comprehensive, deterministic testing system for Daymark Symptom Tracker's Evidence Mode functionality, built against the **Evidence-Hardened v1.0** specification.

**Authoritative Specification:** `/spec/evidence-hardened-v1.md`  
**Derived Requirements:** `/spec/derived-requirements.json`  
**Total Requirements:** 90 across 13 requirement groups  
**Test Coverage:** 83/90 requirements (92%)

---

## Test Structure

Tests are organized by requirement group:

```
tests/
├── evidence-mode/      # REQ-EM-001 to REQ-EM-004
├── timestamps/         # REQ-TS-001 to REQ-TS-006
├── backdating/         # REQ-BD-001 to REQ-BD-007
├── finalization/       # REQ-FN-001 to REQ-FN-007
├── revisions/          # REQ-RV-001 to REQ-RV-010
├── gaps/               # REQ-GAP-001 to REQ-GAP-009
├── neutral-language/   # REQ-LANG-001 to REQ-LANG-006
├── exports/            # REQ-EX-001 to REQ-EX-014
├── statistics/         # REQ-STAT-001 to REQ-STAT-009
├── submission-packs/   # REQ-PACK-001 to REQ-PACK-005
├── defaults/           # REQ-DEF-001 to REQ-DEF-003
├── failure-modes/      # REQ-FAIL-001 to REQ-FAIL-005
└── test-utils.ts       # Shared test helpers
```

---

## Running Tests

### Run All Evidence-Hardened Tests

```bash
npm run test:evidence
```

This runs all compliance tests and generates artifacts.

### Run Specific Requirement Group

```bash
npm test -- tests/evidence-mode
npm test -- tests/timestamps
npm test -- tests/finalization
```

### Run Single Test File

```bash
npm test -- tests/timestamps/evidence-timestamps.test.ts
```

### Watch Mode (Development)

```bash
npm run test:watch -- tests/
```

### Generate Coverage Report

```bash
npm run test:coverage -- tests/
```

---

## Test Artifacts

All test runs generate artifacts stored in `/test-artifacts/run-###/`:

- **test-results.json** - Structured pass/fail results per requirement
- **generated-exports/** - CSV, JSON, PDF files generated during export tests
- **screenshots/** - UI state captures (from Playwright tests)
- **logs/** - Execution logs and timestamps

Artifacts are versioned incrementally: `run-001`, `run-002`, etc.

---

## Test Principles

### 1. Determinism

- Identical input MUST produce identical output
- No randomness in test data
- Timestamps use fixed test values, not `Date.now()`
- Tests are order-independent

### 2. No Mocking of Critical Behavior

Per REQ-TEST-003, tests MUST NOT mock:

- Evidence timestamp generation
- Finalization logic
- Revision creation logic
- Export file generation (except external file I/O)

### 3. Single Assertion Per Test

Each test validates exactly one requirement. Tests are named with requirement IDs (e.g., `REQ-TS-001`).

### 4. AI Review Separation

AI agents review test results and exports but never write tests or modify code. See `/agents/README.md` for:

- `spec-interpreter.prompt.md` - Hostile compliance auditor
- `export-reviewer.prompt.md` - Third-party comprehension auditor

### 5. Exact Assertions

Tests assert exact behavior, not "approximately correct" behavior. Examples:

- ✅ `expect(value).toBe(expected)`
- ❌ `expect(value).toBeCloseTo(expected)`
- ✅ `expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)`

---

## Test Utilities

### Helper Functions (`test-utils.ts`)

- `createTestTimestamp(offset)` - Generate deterministic ISO 8601 timestamps
- `createTestDailyLogWithEvidence()` - Create logs with evidence timestamps
- `createFinalizedDailyLog()` - Create finalized logs
- `createBackdatedLog()` - Create logs with retrospective context
- `assertISO8601()` - Validate ISO 8601 format
- `assertImmutableTimestamp()` - Verify timestamp immutability
- `assertBlank()` - Verify field is blank (not placeholder)
- `assertValidRevisionRecord()` - Validate revision structure
- `assertCSVHasColumns()` - Verify CSV export columns

### Test Data Patterns

```typescript
// Deterministic timestamps
const timestamp = createTestTimestamp(0);  // Base time
const later = createTestTimestamp(5);       // 5 hours later

// Evidence-enabled log
const log = createTestDailyLogWithEvidence('2026-02-06', timestamp);

// Finalized log
const finalizedLog = createFinalizedDailyLog('2026-02-06');

// Backdated log
const backdatedLog = createBackdatedLog(
  '2026-02-01',  // Event date
  '2026-02-05T10:00:00.000Z',  // Created date
  4  // Days delayed
);
```

---

## Requirement Coverage

| Group | Requirements | Critical | High | Medium |
|-------|-------------|----------|------|--------|
| Evidence Mode | 4 | 2 | 1 | 1 |
| Timestamps | 6 | 2 | 2 | 2 |
| Backdating | 7 | 1 | 5 | 1 |
| Finalization | 7 | 2 | 3 | 2 |
| Revisions | 10 | 3 | 4 | 3 |
| Gaps | 9 | 3 | 5 | 0 | 
| Neutral Language | 6 | 1 | 2 | 3 |
| Exports | 14 | 1 | 5 | 5 |
| Statistics | 9 | 2 | 6 | 1 |
| Submission Packs | 5 | 1 | 2 | 2 |
| Defaults | 3 | 0 | 3 | 0 |
| Failure Modes | 5 | 5 | 0 | 0 |
| Testing | 5 | 2 | 2 | 0 |
| **TOTAL** | **108** | **24** | **56** | **24** |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Evidence-Hardened Compliance Tests

on: [push, pull_request]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run test:evidence
      
      - name: Upload Test Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: evidence-test-artifacts
          path: test-artifacts/
      
      - name: Generate Audit Report
        run: npm run test:audit
      
      - name: Upload Audit Report
        uses: actions/upload-artifact@v3
        with:
          name: credibility-audit
          path: reports/credibility-audit.md
```

---

## Failure Investigation

When a test fails:

1. **Check Requirement ID** - Failed test is named with REQ-ID
2. **Read Spec** - Review requirement in `/spec/evidence-hardened-v1.md`
3. **Check Artifacts** - Examine generated files in `/test-artifacts/run-###/`
4. **Verify Data Model** - Ensure domain models match spec
5. **Check Service Layer** - Verify enforcement logic in stores/services

### Common Failure Modes

- **Timestamp not ISO 8601** → Check date formatting in service layer
- **Evidence timestamp missing** → Verify Evidence Mode is enabled in test context
- **Finalized log is editable** → Check finalization blocking in service layer
- **Blank field has placeholder** → Review default value initialization
- **Export missing required field** → Check export service field mapping

---

## Adding New Tests

To add tests for a new requirement:

1. **Identify Requirement Group** - Check `/spec/derived-requirements.json`
2. **Create Test File** - In appropriate `tests/[group]/` directory
3. **Use Template**:

```typescript
import {
  createTestResult,
  type RequirementTestResult
} from '../test-utils';

describe('[Requirement Group Name]', () => {
  const testResults: RequirementTestResult[] = [];

  afterAll(() => {
    console.log('[Group] Test Results:', JSON.stringify(testResults, null, 2));
  });

  test('REQ-[ID]: [Requirement assertion]', () => {
    const requirementId = 'REQ-[ID]';
    
    try {
      // Test setup
      // Assertions
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
```

4. **Run Test** - `npm test -- [test-file-path]`
5. **Verify Artifact Generation** - Check `/test-artifacts/`

---

## Maintenance

### When Specification Changes

1. Update `/spec/evidence-hardened-v1.md`
2. Regenerate `/spec/derived-requirements.json`
3. Update affected test files
4. Re-run full test suite
5. Update audit report

### Test Data Cleanup

Test artifacts accumulate over time. Clean old runs:

```bash
# Keep last 10 runs
cd test-artifacts
ls -t | tail -n +11 | xargs -I {} rm -r {}
```

---

## Contact

For questions about the testing system:

- Review `/spec/evidence-hardened-v1.md` for requirement interpretation
- Check GitHub Issues for known test failures
- Consult QA/compliance team for audit-related questions

---

**Last Updated:** February 6, 2026  
**Test System Version:** 1.0  
**Specification Version:** Evidence-Hardened v1.0
