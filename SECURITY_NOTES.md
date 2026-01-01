# SECURITY_NOTES.md

## SSDI Symptom Tracker: Security & Compliance Notes

### Data Locality
- All user data is stored locally on the device using AsyncStorage.
- No data is ever transmitted to external servers, cloud services, or third parties.
- There is no analytics, crash reporting, or telemetry that collects or transmits PII (personally identifiable information).

### Optional Security Features
- Users may enable device-level encryption using expo-secure-store.
- App lock with PIN or biometric authentication is available for additional privacy.

### Data Export
- All exports (PDF, text) are explicit user actions and previewable before sharing.
- By default, exports exclude personal identifying information unless the user opts in.
- No identifying information is included in generated filenames.

### Determinism & Traceability
- The same source data always produces the same reports.
- Edits to reports do not alter or erase raw logs.
- All derived data in reports is traceable to source logs.
- No AI or automated process can alter source evidence.

### User Control
- Users can edit report drafts without affecting underlying evidence.
- All exports are user-initiated and require confirmation.
- Sensitive sections can be excluded from exports by default.

### Explainability
- Every computed value in a report can be explained in one sentence, with no "AI decided" language.
- All report logic is deterministic and auditable.

---

**This file documents the app's defensible security and compliance posture.**

For any change to these guarantees, explicit review and approval is required.