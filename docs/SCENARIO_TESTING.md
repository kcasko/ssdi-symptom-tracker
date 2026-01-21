# SCENARIO_TESTING.md

## SSDI Symptom Tracker: Scenario Testing Plan

### Purpose

To validate real-world credibility, determinism, and explainability, we simulate three fictional users with varying symptom patterns. Each scenario tests the app's ability to produce believable, defensible, and non-exaggerated reports.

---

## User Scenarios

### User A: Mild, Inconsistent Symptoms

- Logs symptoms 2–3 times per week
- Severity: 2–4/10, rarely above 5
- Occasional activity limitations, mostly normal days
- Few medications, rare appointments
- Expected: Reports should look uneventful, with mostly "good" days and minimal limitations

### User B: Moderate, Fluctuating Symptoms

- Logs symptoms 4–5 times per week
- Severity: 3–7/10, with occasional flares
- Activity logs show some recovery time needed
- Several limitations, some days missed activities
- Medications and appointments logged regularly
- Expected: Reports should show patterns, some flares, and believable limitations, but not dramatic swings

### User C: Severe, Persistent Symptoms

- Logs symptoms daily
- Severity: 6–10/10, frequent flares
- Activity logs show frequent inability to complete tasks
- Multiple limitations, regular medication and appointments
- Expected: Reports should reflect persistent impairment, consistent limitations, and credible evidence of disability

---

## Test Procedure

1. Generate 30–60 days of logs for each user (use seedData utilities or manual entry)
2. Log activities, limitations, medications, and appointments as described
3. Generate every report type for each user:
   - Daily Summary
   - Activity Impact Summary
   - Functional Limitations Assessment
   - Complete SSDI Documentation
4. Review each report:
   - Does the output look boring and believable?
   - Is anything exaggerated or "too polished"?
   - Are there inconsistencies a skeptical reviewer would notice?
5. If any report feels unrealistic, investigate and adjust logic or templates as needed

---

**Scenario testing is required before release. Output must be credible, boring, and defensible.**

Any changes to logic or templates after scenario testing require re-validation.
