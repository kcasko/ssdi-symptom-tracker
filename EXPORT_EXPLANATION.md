# EXPORT_EXPLANATION.md

## SSDI Symptom Tracker: How Reports Are Generated

### Overview
All reports are generated from immutable source logs (symptoms, activities, limitations, medications, appointments) using deterministic analysis engines. The process is fully auditable and repeatable.

### Report Generation Process
1. **Source Data Collection**
   - Users log daily symptoms, activities, limitations, medications, and appointments.
   - Each entry is timestamped and immutable after creation.

2. **Analysis Engines**
   - Pattern detection, trend analysis, and RFC assessment are run on the raw logs.
   - All analysis is deterministic: same input always yields the same output.

3. **Narrative Generation**
   - NarrativeService and SSDINarrativeBuilder convert analysis results into SSDI-appropriate language.
   - Controlled vocabulary and phrasing are used for consistency and compliance.

4. **Report Drafting**
   - Users can generate reports for any date range and edit the draft text.
   - Edits to the report do not alter the underlying source data.
   - Each report section is linked to the relevant source logs.

5. **Export**
   - Users can export reports as PDF or copyable text.
   - Exports are previewable and require explicit user action.
   - By default, exports exclude personal identifying information.

### Explainability
- Every value and statement in a report can be traced back to specific source logs.
- No "AI black box" logic: all computations are explainable in plain language.
- If a reviewer questions a value, the app can show exactly how it was derived.

---

**This file documents the report generation process for transparency and auditability.**

Any change to this process requires explicit review and approval.