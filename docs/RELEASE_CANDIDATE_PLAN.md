# RELEASE_CANDIDATE_PLAN.md

## SSDI Symptom Tracker: Release Candidate Planning

### Purpose

To ensure a stable, defensible, and auditable release, the following process is used to lock a release candidate (RC) and prepare for production.

---

## Release Candidate Process

### 1. Tag the Current Version

- Create a git tag (e.g., `v1.0.0-rc1`) at the current commit.
- Document the tag in CHANGELOG.md and communicate freeze to all contributors.

### 2. Freeze Features

- No new features are allowed after the RC tag.
- Only bug fixes, documentation, and compliance hardening are permitted.
- All invariants (see INVARIANTS.md) are locked and require explicit approval to change.

### 3. Final Scenario Testing

- Complete scenario testing as described in SCENARIO_TESTING.md.
- Review all outputs for credibility, determinism, and explainability.
- Address any issues found before proceeding.

### 4. Compliance & Documentation Review

- Confirm SECURITY_NOTES.md, EXPORT_EXPLANATION.md, and APP_IDENTITY.md are up to date.
- Ensure all documentation is included in the release package.

### 5. Accessibility & Device Testing

- Test on multiple devices and screen sizes.
- Validate accessibility (WCAG) and performance with large datasets.

### 6. Pre-Deployment Checklist

- Replace placeholder icons/assets.
- Verify SSDI vocabulary and legal/medical accuracy.
- Test all export formats and privacy controls.
- Confirm no analytics or PII leaks.

### 7. Release Approval

- Final review by project owner or designated approver.
- Only after approval is the RC promoted to production release.

---

**This file documents the release candidate process. Any deviation requires explicit review and approval.**
