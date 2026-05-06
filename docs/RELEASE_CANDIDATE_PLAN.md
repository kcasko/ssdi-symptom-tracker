# Release Candidate Plan

## Required Checks

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run assets:validate
```

## Manual Smoke Test

- First-launch profile flow
- Dashboard navigation
- Daily log creation and edit
- Activity log creation and edit
- Medication and appointment creation
- Report generation
- Export, backup, and restore
- Theme toggle

## Copy Review

Confirm the app presents itself as a personal health tracker. It should not provide medical advice, legal advice, treatment recommendations, or administrative guidance.
