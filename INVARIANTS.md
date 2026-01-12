# INVARIANTS.md

## SSDI Symptom Tracker: Frozen Invariants

The following rules are **frozen** and may not be changed without explicit approval. These are the guardrails that protect the credibility, auditability, and defensibility of this evidence system.

### 1. Flare Detection Rules

- The logic for detecting symptom flares is deterministic and merges consecutive high-pain days into a single flare.
- Thresholds for what constitutes a flare are fixed and documented in code.

### 2. Good vs Bad Day Classification

- The criteria for classifying a "good" or "bad" day are explicitly defined and do not change without review.
- No silent logic drift is allowed.

### 3. RFC (Residual Functional Capacity) Thresholds

- Definitions for physical, mental, and work capacity categories are fixed.
- Any change to RFC scoring or thresholds requires explicit approval.

### 4. SSDI Vocabulary and Phrasing

- The controlled vocabulary and phrasing used in reports is versioned and only updated with review.
- No AI or human change may alter SSDI-specific language without approval.

### 5. Source-Data Immutability

- Raw logs (symptoms, activities, limitations, meds, appointments) are immutable after creation.
- Edits to reports or narratives never rewrite or delete source evidence.

### 6. Report-to-Source Linkage

- Every report section must be traceable to the underlying source logs.
- No derived data is allowed to exist without a clear link to its origin.

---

**Any change to these invariants must be reviewed and approved by the project owner.**

This file is not documentation fluff. It is a guardrail for the integrity of the system.
