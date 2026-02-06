# AI Review Progress Checklist

**Track your hostile compliance review progress**

Check off each requirement as you complete the AI review and update the audit report.

---

## Review Progress

**Total Requirements:** 90  
**Tested Requirements:** 83  
**Untested Requirements:** 7

**Completion Status:** 0/83 reviewed (0%)

---

## Evidence Mode (4 requirements)

- [ ] REQ-EM-001: Enable Evidence Mode in Settings
- [ ] REQ-EM-002: No retroactive timestamps on pre-existing logs
- [ ] REQ-EM-003: Activation metadata recorded
- [ ] REQ-EM-004: Evidence Mode status queryable

**Test File:** `tests/evidence-mode/evidence-mode-activation.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Evidence Timestamps (6 requirements)

- [ ] REQ-TS-001: Evidence timestamps applied to new logs
- [ ] REQ-TS-002: Evidence timestamps are immutable
- [ ] REQ-TS-003: Evidence timestamps distinct from createdAt/updatedAt
- [ ] REQ-TS-004: Logs without Evidence Mode have no evidence timestamps
- [ ] REQ-TS-005: UI displays evidence timestamp (⚠️ May require E2E test)
- [ ] REQ-TS-006: Exports include evidence timestamps

**Test File:** `tests/timestamps/evidence-timestamps.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Backdating (7 requirements)

- [ ] REQ-BD-001: daysDelayed calculated correctly
- [ ] REQ-BD-002: Retrospective context can be provided
- [ ] REQ-BD-003: Retrospective context has required fields
- [ ] REQ-BD-004: Retrospective context is immutable
- [ ] REQ-BD-005: CSV exports include daysDelayed column
- [ ] REQ-BD-006: PDF reports disclose backdating
- [ ] REQ-BD-007: Backdated entries are not suppressed

**Test File:** `tests/backdating/retrospective-context.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Finalization (7 requirements)

- [ ] REQ-FN-001: Finalization action available, metadata set
- [ ] REQ-FN-002: Finalization metadata has all required fields
- [ ] REQ-FN-003: Finalized logs are read-only in UI
- [ ] REQ-FN-004: Direct editing of finalized logs is blocked
- [ ] REQ-FN-005: UI displays "Finalized" badge
- [ ] REQ-FN-006: CSV exports include finalized/finalizedAt columns
- [ ] REQ-FN-007: PDF exports indicate finalized status

**Test File:** `tests/finalization/log-finalization.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Note:** REQ-FN-001 was found broken during initial test run and has been fixed.

---

## Revisions (10 requirements)

- [ ] REQ-RV-001: Direct editing of finalized logs is blocked
- [ ] REQ-RV-002: Revision creation requires reasonCategory
- [ ] REQ-RV-003: RevisionRecord contains all required fields
- [ ] REQ-RV-004: Revision records are immutable
- [ ] REQ-RV-005: Revision history is viewable in UI
- [ ] REQ-RV-006: UI displays revision count
- [ ] REQ-RV-007: Revision history shows chronological metadata
- [ ] REQ-RV-008: PDF packs include revision audit trail
- [ ] REQ-RV-009: CSV exports include revisions.csv
- [ ] REQ-RV-010: JSON exports include revision records

**Test File:** `tests/revisions/revision-tracking.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Note:** Only 8 tests exist for 10 requirements - REQ-RV-009 and REQ-RV-010 may be combined.

---

## Gaps (9 requirements)

- [ ] REQ-GAP-001: Gaps of 3+ calendar days are detected
- [ ] REQ-GAP-002: Gap detection runs during export generation
- [ ] REQ-GAP-003: PDF reports disclose detected gaps
- [ ] REQ-GAP-004: System does not infer/fabricate data for gaps
- [ ] REQ-GAP-005: Optional fields default to blank
- [ ] REQ-GAP-006: Blank fields remain blank in exports
- [ ] REQ-GAP-007: No auto-population of data occurs post-creation
- [ ] REQ-GAP-008: CSV blank cells are empty (not "N/A" or placeholders)
- [ ] REQ-GAP-009: PDF narratives omit placeholder text for blanks

**Test File:** `tests/gaps/gap-detection.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Defaults (3 requirements)

- [ ] REQ-DEF-001: Pain severity defaults to blank/null
- [ ] REQ-DEF-002: Notes field defaults to empty string
- [ ] REQ-DEF-003: Activity list defaults to empty array

**Test File:** `tests/defaults/default-values.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Neutral Language (6 requirements)

- [ ] REQ-LANG-001: Generated narratives use functional language
- [ ] REQ-LANG-002: System avoids prohibited exaggeration patterns
- [ ] REQ-LANG-003: SSDI-appropriate terminology used
- [ ] REQ-LANG-004: User-provided text exported verbatim
- [ ] REQ-LANG-005: Controlled vocabulary used for symptoms/activities
- [ ] REQ-LANG-006: Custom/freeform entries are marked

**Test File:** `tests/neutral-language/language-requirements.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Exports (14 requirements)

- [ ] REQ-EX-001: CSV export available for all log types
- [ ] REQ-EX-002: CSV includes all required fields
- [ ] REQ-EX-003: CSV headers are human-readable
- [ ] REQ-EX-004: All dates in ISO 8601 format
- [ ] REQ-EX-005: Blank CSV cells are empty (not placeholders)
- [ ] REQ-EX-006: JSON export preserves full data structure
- [ ] REQ-EX-007: JSON includes all metadata
- [ ] REQ-EX-008: PDF export available
- [ ] REQ-EX-009: PDF includes cover page with metadata
- [ ] REQ-EX-010: PDF includes table of contents
- [ ] REQ-EX-011: PDF includes timeline disclosure section
- [ ] REQ-EX-012: PDF includes all daily log entries
- [ ] REQ-EX-013: PDF footer includes page numbers
- [ ] REQ-EX-014: All exports use same source data (consistency)

**Test File:** `tests/exports/export-formats.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Note:** These tests may need actual export file generation for full verification.

---

## Statistics (9 requirements)

- [ ] REQ-STAT-001: All calculations are deterministic
- [ ] REQ-STAT-002: No randomness in any calculations
- [ ] REQ-STAT-003: Severity averages round 0.5 up
- [ ] REQ-STAT-004: Percentages rounded to 1 decimal place
- [ ] REQ-STAT-005: Date ranges are inclusive (start and end included)
- [ ] REQ-STAT-006: Symptom days counted when severity > 0
- [ ] REQ-STAT-007: Gap detection uses calendar days, not elapsed hours
- [ ] REQ-STAT-008: All statistics include source log IDs (traceable)
- [ ] REQ-STAT-009: Statistics never infer missing data

**Test File:** `tests/statistics/calculations.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Submission Packs (5 requirements)

- [ ] REQ-PACK-001: Submission packs are immutable after creation
- [ ] REQ-PACK-002: Pack metadata is complete (12 required fields)
- [ ] REQ-PACK-003: Packs reference logs by ID (not full objects)
- [ ] REQ-PACK-004: Packs support filtering criteria
- [ ] REQ-PACK-005: PDF structure includes 7 required sections

**Test File:** `tests/submission-packs/pack-creation.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Failure Modes (5 requirements)

- [ ] REQ-FAIL-001: No data is silently dropped on errors
- [ ] REQ-FAIL-002: Export errors preserve partial data + notify user
- [ ] REQ-FAIL-003: Deleting finalized logs is blocked/warned
- [ ] REQ-FAIL-004: Editing evidence timestamps is impossible
- [ ] REQ-FAIL-005: Revision records cannot be deleted or edited

**Test File:** `tests/failure-modes/failure-handling.test.ts`  
**Status:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Testing Meta-Requirements (5 requirements - NOT TESTED)

- [ ] REQ-TEST-001: Single assertion per test ⚠️ Satisfied by test structure
- [ ] REQ-TEST-002: Deterministic test data ⚠️ Satisfied by test-utils.ts
- [ ] REQ-TEST-003: No mocking of critical behavior ⚠️ Satisfied by test design
- [ ] REQ-TEST-004: Blank fields remain blank ⚠️ Verified in gap tests
- [ ] REQ-TEST-005: Tests tied to requirement IDs ⚠️ Satisfied by naming convention

**Test File:** N/A (Meta-requirements about testing itself)  
**Status:** 📝 Document Only

**Note:** These requirements describe how tests should be written, not what system behavior should be tested. They are satisfied by the testing infrastructure itself.

---

## Other Untested Requirements

**REQ-TS-005: UI displays evidence timestamp**  
- Reason: Requires E2E/UI test (Playwright/Detox)
- Status: ⚠️ Deferred - Backend logic verified, UI test needed

**REQ-RV-009 & REQ-RV-010: CSV/JSON export of revisions**  
- Reason: May be combined in single test (8 tests for 10 requirements)
- Status: ⚠️ Verify coverage during review

---

## Review Workflow Per Requirement

For each requirement:

1. ☐ Read requirement from `spec/evidence-hardened-v1.md`
2. ☐ Locate test in corresponding test file
3. ☐ Copy `agents/spec-interpreter.prompt.md` to AI chat
4. ☐ Feed requirement + test + result to AI
5. ☐ AI responds with PASS/FAIL verdict
6. ☐ Record verdict in `reports/credibility-audit.md`
7. ☐ Check off requirement in this checklist

---

## Progress Tracking

**Recommended order:**

1. ✅ Start with Evidence Mode (4 requirements) - Quick wins
2. ➡️ Timestamps (6 requirements)
3. ➡️ Finalization (7 requirements)
4. ➡️ Backdating (7 requirements)
5. ➡️ Revisions (10 requirements)
6. ➡️ Gaps (9 requirements)
7. ➡️ Defaults (3 requirements) - Quick wins
8. ➡️ Neutral Language (6 requirements)
9. ➡️ Exports (14 requirements) - May need manual export generation
10. ➡️ Statistics (9 requirements)
11. ➡️ Submission Packs (5 requirements)
12. ➡️ Failure Modes (5 requirements)

**Total:** 83 requirements + 7 documented-only = 90 total

---

## Quick Stats

Update after each session:

**Session 1:** ___/83 reviewed  
**Session 2:** ___/83 reviewed  
**Session 3:** ___/83 reviewed  

**PASS verdicts:** ___  
**FAIL verdicts:** ___  
**Production code fixes needed:** ___

---

## Completion Criteria

Review is complete when:

- [x] All 83 tested requirements have AI verdicts
- [ ] All verdicts recorded in `reports/credibility-audit.md`
- [ ] All requirement group assessments updated (PASS/FAIL)
- [ ] All 7 untested requirements documented with reason
- [ ] Executive summary updated with final counts
- [ ] Hostile review questions answered
- [ ] Critical failures section populated (or marked NONE)

---

## Time Estimate

- **4 requirements (Evidence Mode):** ~10 minutes
- **6 requirements (Timestamps):** ~15 minutes
- **7 requirements (Backdating):** ~17 minutes
- **7 requirements (Finalization):** ~17 minutes
- **10 requirements (Revisions):** ~25 minutes
- **9 requirements (Gaps):** ~22 minutes
- **3 requirements (Defaults):** ~8 minutes
- **6 requirements (Neutral Language):** ~15 minutes
- **14 requirements (Exports):** ~35 minutes
- **9 requirements (Statistics):** ~22 minutes
- **5 requirements (Submission Packs):** ~12 minutes
- **5 requirements (Failure Modes):** ~12 minutes

**Total:** ~3.5 hours

**Strategy:** Do 2-3 sessions of ~1-1.5 hours each over 2-3 days to avoid fatigue.

---

## Resources

- Spec: `spec/evidence-hardened-v1.md`
- Tests: `tests/*/`
- Agent prompts: `agents/spec-interpreter.prompt.md`, `agents/export-reviewer.prompt.md`
- Audit report: `reports/credibility-audit.md`
- Workflow guide: `reports/AI_REVIEW_WORKFLOW.md`
- Quick start: `reports/QUICKSTART_AI_REVIEW.md`
- Sample session: `reports/SAMPLE_AI_REVIEW_SESSION.md`

---

**Ready to begin? Start with Evidence Mode (REQ-EM-001) and check boxes as you go!**
