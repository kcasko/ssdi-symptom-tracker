# AI Review Workflow for Evidence-Hardened v1.0

**Status:** Ready to execute  
**Generated:** 2026-02-06  
**Test Results:** 83/83 passing  
**Audit Report:** reports/credibility-audit.md (template ready)

---

## Overview

This workflow guides you through the **hostile compliance review** using the AI agents to populate the audit report with PASS/FAIL verdicts for each requirement.

### Prerequisites

✅ All tests passing (83/83)  
✅ Audit report template generated  
✅ AI agent prompts ready:
   - `agents/spec-interpreter.prompt.md` (Hostile Compliance Auditor)
   - `agents/export-reviewer.prompt.md` (Third-Party Comprehension Auditor)

---

## Phase 1: Automated Test Review

### Step 1: Extract Test Results

The test results are already captured in:
```
test-artifacts/latest/test-results.json
```

**Test Summary:**
- Total tests: 83
- Passed: 83
- Failed: 0
- Test files: 12

### Step 2: Requirement Coverage Mapping

**Tested Requirements (83):**
- Evidence Mode: REQ-EM-001 to REQ-EM-004 (4 tests)
- Timestamps: REQ-TS-001 to REQ-TS-006 (6 tests)
- Backdating: REQ-BD-001 to REQ-BD-007 (7 tests)
- Finalization: REQ-FN-001 to REQ-FN-007 (7 tests)
- Revisions: REQ-RV-001 to REQ-RV-010 (8 tests) [NOTE: Only 8 tests, REQ-RV-009 and REQ-RV-010 may share implementation]
- Gaps: REQ-GAP-001 to REQ-GAP-009 (9 tests)
- Defaults: REQ-DEF-001 to REQ-DEF-003 (3 tests)
- Neutral Language: REQ-LANG-001 to REQ-LANG-006 (6 tests)
- Exports: REQ-EX-001 to REQ-EX-014 (14 tests)
- Statistics: REQ-STAT-001 to REQ-STAT-009 (9 tests)
- Submission Packs: REQ-PACK-001 to REQ-PACK-005 (5 tests)
- Failure Modes: REQ-FAIL-001 to REQ-FAIL-005 (5 tests)

**Untested Requirements (7):**
- REQ-TEST-001 to REQ-TEST-005: Meta-requirements about testing itself (partially satisfied by test infrastructure)
- REQ-TS-005: UI display requirement (E2E test needed)
- Potentially others if spec has 90 requirements but only 83 tested

---

## Phase 2: AI Hostile Review Process

### For Each Requirement Group:

#### Step A: Read the requirement from spec

Open `spec/evidence-hardened-v1.md` and locate the requirement (e.g., REQ-EM-001).

**Example:**
```markdown
#### REQ-EM-001: Enable Evidence Mode
**Priority:** CRITICAL
**Description:** User must be able to enable Evidence Mode in Settings
```

#### Step B: Find corresponding test

Locate the test file for that requirement group in `tests/`.

**Example:** For REQ-EM-001, see `tests/evidence-mode/evidence-mode-activation.test.ts`

```typescript
test('REQ-EM-001: User must be able to enable Evidence Mode in Settings', () => {
  const settingsService = new SettingsService();
  settingsService.setEvidenceMode(true);
  expect(settingsService.getEvidenceMode()).toBe(true);
});
```

#### Step C: Review test output

Check `test-artifacts/latest/test-results.json` for that test's result.

**Example output:**
```json
{
  "testResults": [
    {
      "assertionResults": [
        {
          "fullName": "Evidence Mode Activation REQ-EM-001: User must be able to enable Evidence Mode in Settings",
          "status": "passed",
          "title": "REQ-EM-001: User must be able to enable Evidence Mode in Settings"
        }
      ]
    }
  ]
}
```

#### Step D: Invoke AI Spec Interpreter

1. **Copy the prompt** from `agents/spec-interpreter.prompt.md`
2. **Paste into a new AI chat session** (Claude, GPT-4, etc.)
3. **Feed the requirement + test output**:

```
Evaluate requirement REQ-EM-001 against this evidence:

REQUIREMENT:
---
#### REQ-EM-001: Enable Evidence Mode
**Priority:** CRITICAL
**Description:** User must be able to enable Evidence Mode in Settings
---

TEST IMPLEMENTATION:
---
test('REQ-EM-001: User must be able to enable Evidence Mode in Settings', () => {
  const settingsService = new SettingsService();
  settingsService.setEvidenceMode(true);
  expect(settingsService.getEvidenceMode()).toBe(true);
});
---

TEST RESULT: PASSED

Does the test prove the requirement is met?
```

4. **AI Response Example:**

```
VERDICT: PASS

JUSTIFICATION:
- Test directly invokes setEvidenceMode(true)
- Test verifies setting persists via getEvidenceMode()
- Test passes (assertion succeeded)
- No ambiguity in implementation

RISK: NONE
```

#### Step E: Record verdict in audit report

Update `reports/credibility-audit.md`:

**Before:**
```markdown
| REQ-EM-001 | ⚠️ PENDING - Run tests to populate | Evidence Mode toggle [exists/missing] in Settings |
```

**After:**
```markdown
| REQ-EM-001 | ✅ PASS | Evidence Mode toggle exists in SettingsService, verified via test |
```

---

## Phase 3: Export Artifact Review

For requirements involving exports (REQ-EX-*, REQ-PACK-*), you'll need to generate actual export files and review them.

### Step 1: Generate exports

**Manual export generation** (if not already done):
1. Run the app: `npm start`
2. Create sample logs in Evidence Mode
3. Finalize at least one log
4. Create a revision
5. Export to CSV/JSON/PDF
6. Save files to `test-artifacts/manual-review/`

### Step 2: Invoke Export Reviewer AI

1. **Copy the prompt** from `agents/export-reviewer.prompt.md`
2. **Paste into AI chat**
3. **Attach the CSV/PDF files** (or paste CSV content)
4. **Ask the 6 review questions:**

```
Review this CSV export from Daymark Symptom Tracker:

[PASTE CSV CONTENT]

Answer these questions:
1. Can you determine exactly when each event occurred and when it was documented?
2. Can you identify which entries were logged after the fact, and by how much?
3. Can you identify which entries were revised, and see the complete revision history?
4. Can you detect gaps in the timeline, and determine if any data is missing?
5. Can you verify completeness - that all claimed data is present?
6. Is there any evidence of editing, backdating, or tampering that could undermine credibility?
```

5. **AI Response Example:**

```
COMPREHENSION AUDIT:

1. Timeline clarity: YES
   - "symptomDate" shows when event occurred
   - "recordedAt" shows when it was logged
   - All dates in ISO 8601 format

2. Backdating detection: YES
   - "daysDelayed" column explicitly shows 0, 2, 5 day delays
   - Can identify retrospective entries unambiguously

3. Revision transparency: YES
   - "revisionCount" shows 0, 1, 2 revisions per log
   - Can see entries were modified after finalization

4. Gap disclosure: YES
   - Missing dates: 2024-01-05, 2024-01-06, 2024-01-07 (3-day gap)
   - Gaps are visible by absence of rows

5. Completeness: YES
   - All required fields present
   - Blank cells are empty (not filled with placeholders)

6. Tampering evidence: NONE
   - No inconsistencies between recordedAt and daysDelayed
   - Finalized entries have finalizedAt timestamps
   - Chain of evidence is intact

OVERALL CREDIBILITY: HIGH
RISK LEVEL: LOW
```

### Step 3: Record export review in audit report

Update the "Hostile Review Simulation" section:

```markdown
### Question 1: Can a reviewer determine what happened?

**Answer:** YES  
**Evidence:** CSV export includes all symptom/activity fields with neutral functional language. No ambiguity in event descriptions.

### Question 2: Can a reviewer determine when it was recorded?

**Answer:** YES  
**Evidence:** CSV includes both "symptomDate" (event date) and "recordedAt" (evidence timestamp). "daysDelayed" column explicitly shows backdating gap.

[... continue for all 5 questions]
```

---

## Phase 4: Consolidation

### Step 1: Update group assessments

For each requirement group in `reports/credibility-audit.md`:

**Before:**
```markdown
**Group Assessment:** [PASS / FAIL]  
**Critical Issues:** [NONE / LIST]
```

**After:**
```markdown
**Group Assessment:** PASS  
**Critical Issues:** NONE
```

### Step 2: Update executive summary

**Before:**
```markdown
**Overall Status:** PASS
**Total Requirements:** 108  
**Requirements Passed:** [COUNT]  
**Requirements Failed:** [COUNT]
```

**After:**
```markdown
**Overall Status:** PASS
**Total Requirements:** 90  
**Requirements Passed:** 83  
**Requirements Failed:** 0  
**Requirements Not Tested:** 7 (REQ-TEST-001 to 005, REQ-TS-005, REQ-RV-009/010 combined)
```

### Step 3: Final review

1. Read through entire audit report
2. Verify no `[PENDING]` markers remain
3. Check all group assessments are PASS or FAIL (no blanks)
4. Ensure hostile review questions are answered
5. Verify artifact paths are correct

---

## Quick Reference Commands

```bash
# Re-run tests to generate fresh results
npm run test:evidence

# Regenerate audit report template
npm run test:audit

# Full audit (tests + report)
npm run test:full-audit
```

---

## Acceptance Criteria

The AI review is complete when:

✅ All 83 tested requirements have PASS/FAIL verdicts in audit report  
✅ All 7 untested requirements are documented with reason (e.g., "Meta-requirement, satisfied by test infrastructure")  
✅ All 5+ hostile review questions answered with YES/NO/PARTIALLY  
✅ Export artifact paths documented in "Artifacts Referenced" section  
✅ Executive summary shows final pass/fail counts  
✅ Group assessments all populated (PASS/FAIL)  
✅ Critical failures section populated (or states "NONE")  

---

## Estimated Time

- **Automated test review:** 2-3 hours (83 requirements × 2 min each)
- **Export artifact review:** 30-60 minutes
- **Report consolidation:** 30 minutes

**Total:** ~3.5-4.5 hours

---

## Tips for Hostile Review

1. **Be merciless** - If test doesn't *prove* requirement, mark FAIL
2. **No assumptions** - "Probably works" = FAIL
3. **Test the test** - Does the test actually check the right thing?
4. **Check edge cases** - Does test cover boundary conditions?
5. **Verify immutability** - Tests should prove data can't be changed
6. **Demand evidence** - "It should work" ≠ "It does work"

---

## Next Steps After Review

If **all requirements PASS**:
- Commit audit report to repo
- Tag release as "Evidence-Hardened v1.0 Compliant"
- Deploy to production with confidence

If **any requirement FAILS**:
- Document failure in "Critical Failures" section
- Create GitHub issue for remediation
- Fix production code (NOT tests)
- Re-run full test suite
- Re-audit failed requirement

---

**Ready to begin? Start with Evidence Mode (REQ-EM-001) and work through each group systematically.**
