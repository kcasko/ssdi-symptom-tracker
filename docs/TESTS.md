# Test Suite

Daymark uses Jest for unit and component coverage around the core health-tracking flows.

## Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
```

## Current Coverage

The active suite covers:

- State orchestration in `useAppState`
- Core input components such as symptom, activity, pain-scale, notes, button, theme, and summary-card controls
- Storage and encryption helpers
- Date, identifier, and flare-detection utilities
- Basic service sanity checks

## Testing Notes

- Tests should use neutral health-tracking language and avoid workflows outside personal tracking.
- Generated screenshots and JSON outputs belong under `test-artifacts/` and are ignored by git except for `.gitkeep`.
- Keep tests close to the behavior they protect. Broad scenario tests should be added only when they cover a real app workflow.
