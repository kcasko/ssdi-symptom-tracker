# AI Reviewer Agents

This directory contains **prompt files** for AI agents that review test results and exported artifacts.

**CRITICAL:** These agents **DO NOT** write code, run tests, or modify data. They only judge results.

---

## Available Agents

### 1. Spec Interpreter (Hostile Compliance Auditor)

**File:** `spec-interpreter.prompt.md`

**Purpose:** Reviews test results against the Evidence-Hardened v1.0 specification

**Inputs:**
- `/spec/evidence-hardened-v1.md` (the spec)
- Test description (what requirement is being tested)
- Test output (raw results)

**Output:** PASS or FAIL verdict with factual justification

**Use When:**
- After running test suite
- Verifying requirement compliance
- Checking for specification drift

**Example Command:**
```bash
# Manually feed to AI (Claude, GPT-4, etc.):
# 1. Copy spec-interpreter.prompt.md into chat
# 2. Provide: requirement ID, test output
# 3. Get: PASS/FAIL verdict
```

---

### 2. Export Reviewer (Third-Party Comprehension Auditor)

**File:** `export-reviewer.prompt.md`

**Purpose:** Reviews exported files as if you've never seen the app

**Inputs:**
- Exported CSV, JSON, or PDF files from `/test-artifacts/`

**Output:** 
- 6-question audit (timeline, backdating, revisions, gaps, completeness, immutability)
- PASS/FAIL per question
- Overall hostile review risk assessment (LOW/MEDIUM/HIGH)

**Use When:**
- Before releasing exports to attorneys
- After major export logic changes
- Preparing SSDI submission packages

**Example Command:**
```bash
# Manually feed to AI:
# 1. Copy export-reviewer.prompt.md into chat
# 2. Attach exported CSV/PDF files
# 3. Get: Comprehension audit report
```

---

## Integration with Test Workflow

### Current Workflow

1. **Run tests:**
   ```bash
   npm run test:evidence
   ```

2. **Tests generate artifacts:**
   ```
   test-artifacts/run-001/
   ├── test-results.json
   ├── exports/
   │   ├── daily-logs.csv
   │   ├── activity-logs.csv
   │   └── full-export.json
   ```

3. **Auto-generate audit report skeleton:**
   ```bash
   npm run test:audit
   ```
   
   Creates: `reports/credibility-audit.md` with placeholders

4. **Manual AI Review (Required Human Step):**

   a. **For Spec Compliance:**
   - Copy `agents/spec-interpreter.prompt.md` to AI chat
   - Feed requirement ID and test output
   - Record verdict in audit report

   b. **For Export Review:**
   - Copy `agents/export-reviewer.prompt.md` to AI chat
   - Attach CSV/PDF files from test artifacts
   - Record comprehension audit results

5. **Complete audit report:**
   - Fill in PASS/FAIL verdicts from AI reviewer
   - Add hostile review risk assessment
   - Add factual justifications

---

## Why These Are Prompt Files, Not Scripts

**Design Decision:** AI reviewers are **human-assisted tools**, not automated scripts.

**Reasoning:**

1. **AI should not auto-approve compliance** - Human judgment required for final verdict
2. **Context windows vary** - Different AI models, different capabilities
3. **Export formats may change** - Prompts are more adaptable than code
4. **Adversarial review requires human insight** - AI flags issues, human decides severity

**Workflow Philosophy:**

```
Tests → Artifacts → AI Review (assisted) → Human Decision → Ship or Fix
         ↑                                        ↓
         └────────── No AI in production code ───┘
```

---

## Guardrails (Enforced)

These agents are **NOT ALLOWED** to:

- ❌ Write test assertions
- ❌ Mutate test data
- ❌ Auto-fix failures
- ❌ Modify production code
- ❌ Excuse non-compliance
- ❌ Invent requirements

These agents **ARE ALLOWED** to:

- ✅ Say FAIL
- ✅ Demand exact compliance
- ✅ Identify ambiguity
- ✅ Flag hostile review risks

---

## Example: Full Review Session

### Step 1: Run Tests

```bash
npm run test:evidence
```

Output: `test-artifacts/run-003/test-results.json`

### Step 2: Check Specific Requirement

**Requirement:** REQ-TS-002 (Evidence timestamps are immutable)

**Test Output:**
```json
{
  "testName": "REQ-TS-002: Evidence timestamps are immutable",
  "status": "passed",
  "output": {
    "timestampBefore": "2026-02-06T12:00:00.000Z",
    "timestampAfter": "2026-02-06T12:00:00.000Z",
    "immutable": true
  }
}
```

**AI Reviewer Session:**

You: *[Paste spec-interpreter.prompt.md]*

You: 
```
REQUIREMENT: REQ-TS-002
SPEC TEXT: "Evidence timestamps MUST be immutable. Once set, they MUST NOT be modified or removed."

TEST OUTPUT:
timestampBefore: 2026-02-06T12:00:00.000Z
timestampAfter: 2026-02-06T12:00:00.000Z
immutable: true

What is your verdict?
```

AI Response:
```
VERDICT: PASS

JUSTIFICATION:
Spec requires timestamps "MUST NOT be modified."
Test shows timestamp before and after update attempt are identical.
Boolean flag 'immutable: true' confirms no modification occurred.
This strictly complies with the requirement.
```

You record: ✅ REQ-TS-002: PASS

### Step 3: Review Export

```bash
cat test-artifacts/run-003/exports/daily-logs.csv
```

**AI Reviewer Session:**

You: *[Paste export-reviewer.prompt.md]*

You: *[Attach daily-logs.csv]*

You: "Review this CSV export for third-party comprehension."

AI Response:
```
## File: daily-logs.csv

### 1. Event Timeline
VERDICT: PASS
EVIDENCE: CSV has logDate and createdAt columns. Every row shows both event date and creation timestamp.

### 2. Backdating Transparency
VERDICT: PASS
EVIDENCE: daysDelayed column present. Row 3 shows daysDelayed=3, clearly indicating backdated entry.

### 3. Revision Traceability
VERDICT: FAIL
EVIDENCE: No revision data in CSV. Cannot tell if finalized entries were revised.

[...continues with other questions...]

OVERALL FILE VERDICT: FAIL
HOSTILE REVIEW RISK: MEDIUM

EXPLANATION:
Export provides event timeline and backdating transparency, but lacks revision audit trail. A hostile reviewer could question whether finalized entries were altered without disclosure.
```

You record: ⚠️ CSV export needs revision trail

---

## Best Practices

### 1. Run AI Review Before Shipping

Never release exports without AI review first. Even if tests pass.

### 2. Document AI Verdicts

All AI FAIL verdicts must be logged in `reports/credibility-audit.md` with:
- Requirement ID
- AI justification
- Decision: Fix or Accept Risk

### 3. Re-Review After Fixes

If you fix a FAIL, re-run the AI review. Don't assume it's fixed.

### 4. Use Real Exports

Don't feed AI synthetic test data. Use actual exports generated by the test suite.

### 5. Treat "UNCLEAR" as FAIL

If AI can't determine compliance, that's a compliance failure.

---

## Maintenance

### When to Update Prompts

- Specification changes (update spec-interpreter.prompt.md)
- New export formats added (update export-reviewer.prompt.md)
- AI flags false positives repeatedly (refine prompt language)

### Version Control

Prompts are versioned with the repo. Changes to prompts should be reviewed like code.

### AI Model Compatibility

Prompts tested with:
- Claude 3.5 Sonnet
- GPT-4
- GPT-4 Turbo

Other models may work but are untested.

---

## Why This Approach Works for Daymark

Normal QA looks for **bugs**.

Daymark QA looks for **interpretive ambiguity**.

These AI agents are trained to be hostile reviewers—the same kind of scrutiny an SSDI claim would face.

By catching ambiguity **before export**, you protect credibility **before submission**.

That's the difference between "our app crashed" (fixable) and "we can't prove this wasn't tampered with" (fatal).

---

**End of README**
