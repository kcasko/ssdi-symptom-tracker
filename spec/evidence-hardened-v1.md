# Evidence-Hardened v1.0 Specification

**Version:** 1.0  
**Status:** LOCKED  
**Effective Date:** February 6, 2026  
**Authority:** This document is the single source of truth for compliance testing

---

## 1. PURPOSE AND SCOPE

This specification defines the conformance requirements for the "Daymark Symptom Tracker" Evidence Mode functionality. All behavior MUST comply with this specification. No undocumented behavior is permitted in Evidence Mode.

This specification exists to ensure that exported documentation can withstand hostile third-party review without introducing ambiguity, credibility gaps, or evidence tampering.

---

## 2. EVIDENCE MODE ACTIVATION

### 2.1 Evidence Mode Toggle

**REQ-EM-001**: The system MUST provide an Evidence Mode toggle in Settings.

**REQ-EM-002**: Evidence Mode activation MUST apply only to logs created AFTER activation. Pre-existing logs MUST NOT receive evidence timestamps retroactively.

**REQ-EM-003**: When Evidence Mode is enabled, the system MUST record:
- Timestamp of activation (ISO 8601 format)
- Profile ID that enabled it

**REQ-EM-004**: Evidence Mode status MUST be queryable at any time.

---

## 3. EVIDENCE TIMESTAMPS

### 3.1 Timestamp Application

**REQ-TS-001**: When Evidence Mode is enabled, ALL newly created logs (DailyLog and ActivityLog) MUST receive an `evidenceTimestamp` field set to the current system time in ISO 8601 format at the moment of creation.

**REQ-TS-002**: Evidence timestamps MUST be immutable. Once set, they MUST NOT be modified or removed.

**REQ-TS-003**: Evidence timestamps MUST be distinct from `createdAt` and `updatedAt` fields.

**REQ-TS-004**: Logs created while Evidence Mode is disabled MUST NOT have an `evidenceTimestamp` field.

### 3.2 Timestamp Display

**REQ-TS-005**: When viewing a log with an evidence timestamp, the UI MUST display the timestamp with label "Evidence recorded: [timestamp]" in human-readable format.

**REQ-TS-006**: Evidence timestamps MUST be included in all exports (CSV, JSON, PDF).

---

## 4. BACKDATING DETECTION

### 4.1 Retrospective Context

**REQ-BD-001**: When a user creates a log where `logDate` differs from the current date, the system MUST calculate `daysDelayed`.

**REQ-BD-002**: If `daysDelayed` > 0 (backdating), the system MAY offer the user an option to provide a `RetrospectiveContext`.

**REQ-BD-003**: Retrospective context MUST include:
- `reason` (optional preset string)
- `note` (optional free text)
- `flaggedAt` (ISO 8601 timestamp when context was added)
- `daysDelayed` (integer, non-negative)

**REQ-BD-004**: Retrospective context, once created, MUST NOT be removed. It MAY be edited through the revision system if log is finalized.

### 4.2 Backdating in Exports

**REQ-BD-005**: CSV exports MUST include a column for `daysDelayed` for all logs.

**REQ-BD-006**: PDF narrative reports MUST disclose when entries are backdated by including a statement such as "Logged [X] days after occurrence" when `daysDelayed` > 0.

**REQ-BD-007**: Backdated entries without retrospective context MUST NOT be suppressed or hidden. They MUST be exported with `daysDelayed` value visible.

---

## 5. LOG FINALIZATION

### 5.1 Finalization Mechanism

**REQ-FN-001**: The system MUST provide a "Finalize for Evidence" action for DailyLog and ActivityLog entries.

**REQ-FN-002**: When a log is finalized, the system MUST:
- Set `finalized` = true
- Set `finalizedAt` to current ISO 8601 timestamp
- Set `finalizedBy` to the active profile ID

**REQ-FN-003**: Finalized logs MUST be marked as read-only in the UI.

**REQ-FN-004**: Direct editing of finalized logs MUST be blocked.

### 5.2 Finalization Display

**REQ-FN-005**: Finalized logs MUST display a "Finalized" badge in the UI.

**REQ-FN-006**: CSV exports MUST include a `finalized` column (boolean) for all logs.

**REQ-FN-007**: PDF exports MUST indicate finalized status for included logs.

---

## 6. REVISION TRACKING

### 6.1 Revision Creation

**REQ-RV-001**: When a user attempts to edit a finalized log, the system MUST block direct editing and offer a "Create Revision" option.

**REQ-RV-002**: Revision creation MUST require:
- `reasonCategory` (enum: typo_correction | added_detail_omitted_earlier | correction_after_reviewing_records | clarification_requested | other)
- `reasonNote` (optional free text)
- `summary` (optional short description of what changed)

**REQ-RV-003**: The system MUST create a `RevisionRecord` containing:
- Unique revision ID
- `logId` (ID of log being revised)
- `logType` (daily | activity | limitation | medication | appointment)
- `profileId`
- `revisionTimestamp` (ISO 8601)
- `reasonCategory`
- `reasonNote`
- `summary`
- `fieldPath` (JSON path to changed field, e.g., "symptoms[0].severity")
- `originalValue` (value before change)
- `updatedValue` (value after change)
- `originalSnapshot` (optional JSON string of entire log before change)

**REQ-RV-004**: Revisions MUST be immutable once created.

**REQ-RV-005**: Revision history MUST be viewable from the log detail screen.

### 6.2 Revision Display

**REQ-RV-006**: If a log has revisions, the UI MUST display "View [X] Revisions" link or button.

**REQ-RV-007**: Revision history view MUST display revisions in chronological order with:
- Revision timestamp
- Reason category
- Summary (if provided)
- Field changed
- Original value → Updated value

### 6.3 Revisions in Exports

**REQ-RV-008**: PDF submission packs MUST include a "Revision Audit Trail" section listing all revisions for included logs.

**REQ-RV-009**: CSV exports MUST include a separate "revisions.csv" file when exporting data with revisions.

**REQ-RV-010**: JSON exports MUST include full revision records in the data structure.

---

## 7. DATA GAPS AND MISSING EVIDENCE

### 7.1 Gap Detection

**REQ-GAP-001**: The system MUST identify gaps in logging defined as: periods of 3 or more consecutive days with no DailyLog entries.

**REQ-GAP-002**: Gap detection MUST be performed during report generation and export.

**REQ-GAP-003**: Gaps MUST be explicitly disclosed in PDF narrative reports with:
- Start date of gap
- End date of gap
- Duration (number of days)

**REQ-GAP-004**: The system MUST NOT infer or extrapolate data for gap periods.

### 7.2 Blank Fields

**REQ-GAP-005**: All optional fields MUST default to blank/null/undefined.

**REQ-GAP-006**: Blank fields MUST remain blank in exports unless explicitly filled by user.

**REQ-GAP-007**: The system MUST NOT auto-populate optional fields with default values after log creation.

**REQ-GAP-008**: CSV exports MUST represent blank fields as empty cells (not "N/A", "null", "0", or placeholder text).

**REQ-GAP-009**: PDF narrative reports MUST NOT include placeholder text for missing data. If a field is blank, the corresponding narrative element MUST be omitted or explicitly stated as "Not recorded."

---

## 8. NEUTRAL LANGUAGE REQUIREMENTS

### 8.1 Language Rules

**REQ-LANG-001**: All generated narratives MUST use functional language describing limitations, not emotional or diagnostic language.

**REQ-LANG-002**: The system MUST NOT generate text containing:
- Self-diagnosis (e.g., "I have fibromyalgia")
- Emotional qualifiers (e.g., "devastating," "horrible," "unbearable")
- Exaggerations (e.g., "always," "never," "impossible")
- Medical conclusions (e.g., "This proves I'm disabled")

**REQ-LANG-003**: Generated language MUST use SSDI-appropriate functional terms:
- "Unable to" instead of "can't" or "too painful to"
- "Required assistance with" instead of "needed help"
- "Limited to [X minutes/duration]" instead of "couldn't do more"
- Quantitative descriptions (e.g., "lifted maximum 5 lbs") instead of vague descriptions ("couldn't lift much")

**REQ-LANG-004**: User-entered free text (notes fields) MUST be exported verbatim without AI modification or sanitization UNLESS user explicitly requests rephrasing.

### 8.2 Controlled Vocabulary

**REQ-LANG-005**: Symptom and activity names MUST come from predefined lists in `src/data/symptoms.ts` and `src/data/activities.ts`.

**REQ-LANG-006**: Custom symptom/activity names entered by users MUST be clearly marked as custom in exports.

---

## 9. EXPORT FORMATS

### 9.1 CSV Export

**REQ-EX-001**: The system MUST provide CSV export for:
- Daily logs
- Activity logs
- Medications
- Limitations
- Appointments

**REQ-EX-002**: CSV exports MUST include all fields from the data model, including:
- `evidenceTimestamp`
- `finalized`
- `finalizedAt`
- `daysDelayed`
- `retrospectiveContext` (serialized)

**REQ-EX-003**: CSV header row MUST use clear, human-readable column names.

**REQ-EX-004**: Date/time fields MUST be exported in ISO 8601 format.

**REQ-EX-005**: Blank fields MUST be represented as empty cells (no placeholder text).

### 9.2 JSON Export

**REQ-EX-006**: The system MUST provide complete JSON export of all profile data.

**REQ-EX-007**: JSON export MUST preserve exact data structure including all optional fields.

**REQ-EX-008**: JSON export MUST validate against the defined Zod schemas.

### 9.3 PDF Export

**REQ-EX-009**: PDF narrative reports MUST include:
- Generation timestamp
- Date range covered
- Profile information (name, DOB - with PII redaction option)
- Symptom summary with statistics
- Activity impact analysis
- Functional limitations
- Medication history
- Appointment history
- RFC (Residual Functional Capacity) assessment

**REQ-EX-010**: PDF reports MUST disclose:
- Evidence Mode status (enabled/disabled)
- Number of finalized logs included
- Number of backdated entries
- Identified gaps in documentation
- Number of revisions to included logs

**REQ-EX-011**: PDF reports MUST include page numbers and generation metadata on every page.

**REQ-EX-012**: PDF submissions packs MUST include a table of contents.

### 9.4 Text Export

**REQ-EX-013**: Text export of reports MUST be copyable plain text without formatting.

**REQ-EX-014**: Text exports MUST preserve structural hierarchy with clear section headers.

---

## 10. STATISTICS AND CALCULATIONS

### 10.1 Determinism

**REQ-STAT-001**: All statistical calculations MUST be deterministic: identical input MUST produce identical output.

**REQ-STAT-002**: No randomness or AI inference MUST be used in calculations unless explicitly disclosed.

### 10.2 Accuracy

**REQ-STAT-003**: Average severity calculations MUST round to nearest integer using standard rounding (0.5 rounds up).

**REQ-STAT-004**: Percentage calculations MUST round to one decimal place.

**REQ-STAT-005**: Date range calculations MUST be inclusive of start and end dates.

**REQ-STAT-006**: "Days with symptom X" counts MUST only count days where symptom X has severity > 0.

**REQ-STAT-007**: Gap detection MUST use calendar days, not elapsed hours.

### 10.3 Traceability

**REQ-STAT-008**: Every statistic in a generated report MUST be traceable to source log entries.

**REQ-STAT-009**: The system MUST be able to generate a "source log IDs" list for any reported statistic upon request.

---

## 11. SUBMISSION PACKS

### 11.1 Pack Creation

**REQ-PACK-001**: Submission packs MUST be immutable once created.

**REQ-PACK-002**: Pack metadata MUST include:
- Pack ID
- Profile ID
- Creation timestamp
- Title
- Description (optional)
- Start date
- End date
- App version
- Evidence Mode status at time of creation
- Total count of included logs
- Total count of revisions

**REQ-PACK-003**: Packs MUST reference included logs by ID only, not duplicate data.

**REQ-PACK-004**: Packs MUST support filtering by:
- Date range
- Finalized logs only
- Specific symptoms
- Specific activities

### 11.2 Pack Export

**REQ-PACK-005**: Submission pack PDF MUST include:
- Cover page with claimant information
- Table of contents
- Evidence Mode disclosure statement
- All included logs in narrative format
- Revision audit trail
- Gap disclosure
- Generation metadata footer on all pages

---

## 12. DEFAULTS AND INITIALIZATION

### 12.1 New Log Defaults

**REQ-DEF-001**: New DailyLog MUST initialize with:
- `symptoms` = empty array
- `overallSeverity` = 0
- `notes` = undefined (blank)
- `photos` = undefined (blank)
- `triggers` = undefined (blank)
- `finalized` = false (or undefined)
- `evidenceTimestamp` = current ISO 8601 time IF Evidence Mode enabled, otherwise undefined

**REQ-DEF-002**: New ActivityLog MUST initialize with:
- `stoppedEarly` = false
- `assistanceNeeded` = false
- `notes` = undefined (blank)
- `photos` = undefined (blank)
- `finalized` = false (or undefined)
- `evidenceTimestamp` = current ISO 8601 time IF Evidence Mode enabled, otherwise undefined

**REQ-DEF-003**: Optional fields MUST NOT be initialized with placeholder text or dummy values.

---

## 13. FAILURE MODES

### 13.1 Prohibition of Silent Failures

**REQ-FAIL-001**: The system MUST NOT silently:
- Drop evidence timestamps
- Skip revisions
- Suppress backdated entries in exports
- Omit gaps from reports
- Auto-correct user input without disclosure

**REQ-FAIL-002**: If an export operation encounters an error, the system MUST:
- Halt the export
- Display error to user
- NOT produce partial export without clear warning

### 13.2 Data Integrity

**REQ-FAIL-003**: Finalized logs MUST NOT be deletable. Deletion attempts MUST be blocked.

**REQ-FAIL-004**: Evidence timestamps MUST NOT be editable through any UI or API.

**REQ-FAIL-005**: Revision records MUST NOT be deletable or editable after creation.

---

## 14. COMPLIANCE TESTING REQUIREMENTS

### 14.1 Testability

**REQ-TEST-001**: All requirements prefixed with REQ- MUST have at least one deterministic test case.

**REQ-TEST-002**: Tests MUST assert exact behavior, not "approximately correct" behavior.

**REQ-TEST-003**: Tests MUST NOT mock:
- Evidence timestamp generation
- Finalization logic
- Revision creation logic
- Export file generation (except for external file I/O)

### 14.2 Audit Trail

**REQ-TEST-004**: All test runs MUST produce artifacts including:
- Generated exports (CSV, JSON, PDF)
- Timestamps of test execution
- Pass/Fail results per requirement

**REQ-TEST-005**: Test artifacts MUST be versioned and stored in `/test-artifacts/run-###/`.

---

## 15. ENFORCEMENT

This specification is LOCKED. Changes require explicit approval and version increment. No undocumented behavior is permitted. All behavior MUST be traceable to a REQ- identifier in this document.

**End of Specification**
