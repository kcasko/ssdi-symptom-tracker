# Quick Start: AI Review Example

**Run your first hostile compliance review in 5 minutes**

---

## Step 1: Copy the AI Agent Prompt

Open [agents/spec-interpreter.prompt.md](../agents/spec-interpreter.prompt.md) and copy the ENTIRE contents.

---

## Step 2: Start a New AI Chat

Open ChatGPT, Claude, or another AI assistant in a new conversation.

Paste the spec-interpreter prompt.

---

## Step 3: Feed the First Requirement

Copy and paste this into the AI chat:

```
Evaluate requirement REQ-EM-001 against this evidence:

REQUIREMENT:
---
#### REQ-EM-001: Enable Evidence Mode
**Priority:** CRITICAL
**Description:** The application MUST provide a toggle in Settings that enables or disables Evidence Mode globally.
**Test Criteria:**
- Settings screen has a visible "Enable Evidence Mode" toggle
- State persists across app restarts
- Current state is queryable by the application
---

TEST IMPLEMENTATION:
---
File: tests/evidence-mode/evidence-mode-activation.test.ts

test('REQ-EM-001: User must be able to enable Evidence Mode in Settings', () => {
  const settingsService = new SettingsService();
  
  // Should be able to enable Evidence Mode
  settingsService.setEvidenceMode(true);
  expect(settingsService.getEvidenceMode()).toBe(true);
  
  // Should be able to disable Evidence Mode
  settingsService.setEvidenceMode(false);
  expect(settingsService.getEvidenceMode()).toBe(false);
});
---

TEST RESULT: ✅ PASSED

Does the test implementation prove the requirement is fully satisfied?
```

---

## Step 4: Review the AI's Verdict

The AI (acting as hostile compliance auditor) will respond with:

**Example Expected Response:**

```
VERDICT: FAIL

JUSTIFICATION:
The test proves that Evidence Mode can be toggled programmatically via SettingsService, 
but it DOES NOT prove the requirement "Settings screen has a visible toggle."

The requirement explicitly states:
- "Settings screen has a visible 'Enable Evidence Mode' toggle"

The test only verifies:
- settingsService.setEvidenceMode() and getEvidenceMode() work

Missing evidence:
1. No UI/E2E test proving the toggle EXISTS in the Settings screen
2. No test proving the toggle is VISIBLE to users
3. No test proving state "persists across app restarts"

This is a BACK-END test, not a FRONT-END test. The requirement is about UI, 
but the test only checks service layer.

RISK LEVEL: HIGH
The requirement may not be implemented in the UI at all.

RECOMMENDATION: 
Add UI test (Playwright/Detox) that:
1. Navigates to Settings screen
2. Locates "Enable Evidence Mode" toggle element
3. Taps it to enable
4. Verifies state changes
5. Restarts app
6. Verifies state persisted
```

---

## Step 5: Record the Verdict

Open `reports/credibility-audit.md` and update:

**Before:**
```markdown
| REQ-EM-001 | ⚠️ PENDING - Run tests to populate | Evidence Mode toggle [exists/missing] in Settings |
```

**After:**
```markdown
| REQ-EM-001 | ❌ FAIL | Test only verifies SettingsService API, not UI toggle visibility. E2E test required. |
```

Update the group assessment:

```markdown
**Group Assessment:** FAIL  
**Critical Issues:** REQ-EM-001 lacks UI test - cannot verify Settings screen toggle exists
```

---

## Alternative: If Test Actually Passed

If the AI determines the test DOES prove the requirement:

```
VERDICT: PASS

JUSTIFICATION:
The test fully satisfies the requirement:

✅ "Enable Evidence Mode toggle" - setEvidenceMode(true) proves toggling works
✅ "State persists" - getEvidenceMode() proves state is queryable
✅ Test passes - assertion succeeded

The test is deterministic, single-assertion, and directly tests the requirement.

RISK LEVEL: NONE

NOTE: If the requirement intended UI visibility, it should be clarified in spec.
Based on written requirement, this test is sufficient.
```

Then record:

```markdown
| REQ-EM-001 | ✅ PASS | SettingsService.setEvidenceMode()/getEvidenceMode() verified, state queryable. Test passed. |
```

---

## Step 6: Continue with Next Requirement

Repeat for REQ-EM-002, REQ-EM-003, REQ-EM-004...

For each:
1. Find requirement in `spec/evidence-hardened-v1.md`
2. Find test in `tests/evidence-mode/evidence-mode-activation.test.ts`
3. Feed to AI agent
4. Record verdict in audit report

---

## Batch Processing (Advanced)

You can review multiple requirements at once:

```
Evaluate these 4 requirements from the Evidence Mode group:

[Paste all 4 requirements + all 4 tests]

For each requirement, provide:
- VERDICT: PASS/FAIL
- JUSTIFICATION: Brief explanation
- RISK: NONE/LOW/MEDIUM/HIGH
```

The AI will respond with verdicts for all 4 in one response.

---

## Common Verdict Patterns

### ✅ PASS Pattern:
- Test directly checks what requirement asks for
- Test passes
- No ambiguity in implementation
- Edge cases covered

### ❌ FAIL Pattern:
- Test checks something OTHER than requirement
- Test is too broad/generic
- Requirement specifies UI, test only checks logic
- Requirement says "immutable," test doesn't verify editing is blocked
- Test has placeholders like `// TODO` or `expect(true).toBe(true)`

### ⚠️ PARTIAL Pattern (record as FAIL):
- Test proves 80% of requirement
- Missing edge cases
- Doesn't test persistence, only in-memory state

**Rule:** If not 100% proven → FAIL, not PARTIAL.

---

## Real-World Example: REQ-FN-001 (Already Fixed)

This requirement FAILED initially, then was fixed:

**Initial Test Run:**
```
FAIL tests/finalization/log-finalization.test.ts
  ● REQ-FN-001: Finalization action must be available and set finalized metadata

    TypeError: Cannot read properties of undefined (reading 'finalized')
```

**AI Verdict (if we had run review):**
```
VERDICT: FAIL

JUSTIFICATION:
Test crashed with "Cannot read properties of undefined."
This proves the requirement is NOT MET - finalization fields don't exist.

CRITICAL ISSUE: Production code doesn't initialize finalization metadata.

RISK LEVEL: CRITICAL
```

**After Fix (src/domain/models/DailyLog.ts):**
```typescript
finalized: false,
finalizedAt: undefined,
finalizedBy: undefined,
```

**New Test Run:** ✅ PASSED

**AI Verdict (after fix):**
```
VERDICT: PASS

JUSTIFICATION:
Test creates a DailyLog and successfully accesses log.finalized without error.
Test passes, proving finalization fields are initialized.

RISK LEVEL: NONE
```

---

## Time-Saving Tips

1. **Group requirements** - Review all REQ-EM-* together (4 requirements)
2. **Copy test file URLs** - Use GitHub links if reviewing with web-based AI
3. **Use test results JSON** - Feed structured data instead of manual copying
4. **Batch similar requirements** - All "export CSV" tests can be reviewed together
5. **Skip obvious passes** - If test is trivial (e.g., `expect(2+2).toBe(4)`), quick PASS

---

## When to Mark FAIL

Mark FAIL if:
- ❌ Test doesn't match requirement text
- ❌ Test only checks happy path, not edge cases
- ❌ Requirement says "MUST persist," test doesn't verify persistence
- ❌ Requirement says "UI displays X," test only checks data layer
- ❌ Test has `// TODO` or `xit()` or is skipped
- ❌ Test crashed or failed
- ❌ Any ambiguity exists ("might work" ≠ "does work")

---

## Starting Point for Full Review

```bash
# Ensure all tests passing
npm run test:evidence

# Verify test results exist
ls test-artifacts/latest/test-results.json

# Open spec
code spec/evidence-hardened-v1.md

# Open first test file
code tests/evidence-mode/evidence-mode-activation.test.ts

# Open audit report for editing
code reports/credibility-audit.md

# Open agent prompt
code agents/spec-interpreter.prompt.md
```

**Now begin with REQ-EM-001 and work through all 83 requirements systematically.**

---

**Estimated time to review all 83 requirements: 2-3 hours**

- ~2 minutes per requirement
- Faster if batching similar tests
- Slower if failures require deep investigation
