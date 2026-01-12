# Evidence Mode Quick Reference

## Key Files at a Glance

### Core Implementation

```
src/
├── domain/
│   ├── models/
│   │   ├── EvidenceMode.ts          ← Models & schemas
│   │   ├── DailyLog.ts              ← Updated with finalization
│   │   └── ActivityLog.ts           ← Updated with finalization
│   └── rules/
│       └── functionalDomains.ts     ← SSA-aligned mappings
├── state/
│   └── evidenceModeStore.ts         ← State management
├── services/
│   ├── EvidenceLogService.ts        ← Log operations
│   ├── StandardizedNarrativeService.ts ← Templates
│   ├── EvidenceReportBuilder.ts     ← Report generation
│   └── EvidencePDFExportService.ts  ← PDF export
└── components/
    ├── EvidenceModeControls.tsx     ← Toggle & status
    ├── LogFinalizationControls.tsx  ← Finalize logs
    ├── RevisionHistoryViewer.tsx    ← View revisions
    └── SubmissionPackBuilder.tsx    ← Create packs
```

## Quick Integration

### 1. Initialize (App.tsx or useAppState.ts)

```tsx
import { useEvidenceModeStore } from './state/evidenceModeStore';

const evidenceStore = useEvidenceModeStore();
await evidenceStore.loadEvidenceMode();
```

### 2. Settings Screen

```tsx
import { EvidenceModeControls, SubmissionPackBuilder } from '../components';

<EvidenceModeControls profileId={profileId} />
<SubmissionPackBuilder profileId={profileId} appVersion="1.0.0" />
```

### 3. Dashboard

```tsx
<EvidenceModeControls profileId={profileId} compact={true} />
```

### 4. Daily Log Screen - Save

```tsx
import { applyEvidenceTimestamp, canModifyLog, updateLogWithRevision } from '../services';

// When creating
let newLog = { ...logData };
newLog = applyEvidenceTimestamp(newLog);

// When editing
const { canModify, reason } = canModifyLog(logId);
if (!canModify) {
  // Prompt for revision
}
```

### 5. Daily Log Screen - Display

```tsx
import { LogFinalizationControls, RevisionHistoryViewer } from '../components';

<LogFinalizationControls 
  log={log} 
  logType="daily"
  profileId={profileId}
/>

<RevisionHistoryViewer
  logId={logId}
  visible={showRevisions}
  onClose={() => setShowRevisions(false)}
/>
```

### 6. Reports Screen

```tsx
import { buildEvidenceReport, generateHTMLForPDF } from '../services';

const reportData = {
  reportTitle: "...",
  generatedAt: new Date().toISOString(),
  appVersion: "1.0.0",
  startDate,
  endDate,
  dailyLogs,
  activityLogs,
  revisions: evidenceStore.getAllRevisions(),
  finalizedDailyLogs: dailyLogs.filter(l => evidenceStore.isLogFinalized(l.id)).length,
  finalizedActivityLogs: activityLogs.filter(l => evidenceStore.isLogFinalized(l.id)).length,
  profileId,
};

const report = buildEvidenceReport(reportData);
const html = generateHTMLForPDF(report);
```

## Key Functions

### Evidence Mode Store

```tsx
const evidenceStore = useEvidenceModeStore();

// Configuration
evidenceStore.enableEvidenceMode(profileId)
evidenceStore.disableEvidenceMode()
evidenceStore.isEvidenceModeEnabled() → boolean

// Finalization
evidenceStore.finalizeLog(logId, logType, profileId)
evidenceStore.isLogFinalized(logId) → boolean
evidenceStore.getFinalizedLogs(logType?) → LogFinalization[]

// Revisions
evidenceStore.createRevision(logId, logType, profileId, fieldPath, originalValue, updatedValue, reason)
evidenceStore.getLogRevisions(logId) → RevisionRecord[]

// Submission Packs
evidenceStore.createPack(profileId, title, startDate, endDate, dailyLogIds, activityLogIds, reportIds, appVersion)
evidenceStore.getSubmissionPacks(profileId?) → SubmissionPack[]
```

### Evidence Log Service

```tsx
import { 
  applyEvidenceTimestamp, 
  canModifyLog, 
  updateLogWithRevision,
  canFinalizeLog 
} from '../services/EvidenceLogService';

// Apply timestamp if Evidence Mode enabled
const log = applyEvidenceTimestamp(newLog);

// Check if log can be modified
const { canModify, reason } = canModifyLog(logId);

// Create revision for finalized log
const result = await updateLogWithRevision(
  logId, 
  logType, 
  profileId, 
  originalLog, 
  updates, 
  reason
);

// Check if log can be finalized
const { canFinalize, reason } = canFinalizeLog(log);
```

### Standardized Narratives

```tsx
import { 
  generateSymptomSummary,
  generateActivityImpactStatement,
  generateFunctionalLimitationStatement,
  generateDataQualityStatement,
  generateClosingStatement
} from '../services/StandardizedNarrativeService';

// Example: Symptom summary
const text = generateSymptomSummary("back-pain", 45, 60, 7.2);
// → "Logs indicate back-pain was recorded on 45 of 60 logged days (75 percent). 
//    Average reported severity was 7.2 on a scale of 0 to 10."
```

## Storage Keys

```
@ssdi/evidence_mode_config    → { enabled, enabledAt, enabledBy }
@ssdi/log_finalizations       → [ { logId, logType, finalizedAt, finalizedBy } ]
@ssdi/revisions               → [ { id, logId, fieldPath, originalValue, updatedValue, reason, timestamp } ]
@ssdi/submission_packs        → [ { id, title, startDate, endDate, includedLogs, metadata } ]
```

## Common Patterns

### Pattern 1: Creating a Log with Evidence Mode

```tsx
const handleCreateLog = async (logData) => {
  let newLog = {
    ...logData,
    id: generateId(),
    profileId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Apply evidence timestamp if Evidence Mode enabled
  newLog = applyEvidenceTimestamp(newLog);
  
  await logStore.addDailyLog(newLog);
};
```

### Pattern 2: Editing a Finalized Log

```tsx
const handleEditLog = async (logId, updates) => {
  const { canModify, reason } = canModifyLog(logId);
  
  if (!canModify) {
    // Prompt for revision
    const revisionReason = await promptUser('Reason for change:');
    
    const result = await updateLogWithRevision(
      logId,
      'daily',
      profileId,
      originalLog,
      updates,
      revisionReason
    );
    
    if (result.success) {
      alert('Revision created');
    }
  } else {
    // Normal update
    await logStore.updateDailyLog({ ...originalLog, ...updates });
  }
};
```

### Pattern 3: Finalizing a Log

```tsx
const handleFinalizeLog = async () => {
  const { canFinalize, reason } = canFinalizeLog(log);
  
  if (!canFinalize) {
    alert(reason);
    return;
  }
  
  await evidenceStore.finalizeLog(log.id, 'daily', profileId);
  alert('Log finalized');
};
```

### Pattern 4: Generating a Report

```tsx
const handleGenerateReport = async (startDate, endDate) => {
  // 1. Filter logs
  const dailyLogs = logStore.dailyLogs.filter(
    log => log.logDate >= startDate && log.logDate <= endDate
  );
  
  // 2. Get revisions
  const logIds = new Set(dailyLogs.map(l => l.id));
  const revisions = evidenceStore.getAllRevisions().filter(
    r => logIds.has(r.logId)
  );
  
  // 3. Build report data
  const reportData = { /* ... */ };
  
  // 4. Generate report
  const report = buildEvidenceReport(reportData);
  
  // 5. Export
  const html = generateHTMLForPDF(report);
  // Use PDF library to render
};
```

## Troubleshooting

### Issue: Timestamp not appearing

```tsx
// Check: Is Evidence Mode enabled?
console.log(evidenceStore.config.enabled);

// Check: Is applyEvidenceTimestamp called?
const log = applyEvidenceTimestamp(newLog);
console.log(log.evidenceTimestamp);
```

### Issue: Can't edit finalized log

```tsx
// Expected behavior! Check finalization status:
console.log(evidenceStore.isLogFinalized(logId));

// Use revision workflow instead
```

### Issue: Revisions not in report

```tsx
// Check: Are revisions in date range?
const revisions = evidenceStore.getAllRevisions();
console.log(revisions);

// Check: Is revision summary included?
console.log(report.revisionSummary);
```

## Testing Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Run tests (if configured)
npm test

# Build app
npm run build
```

## Documentation Reference

- **Implementation Details:** `EVIDENCE_MODE_IMPLEMENTATION.md`
- **Integration Guide:** `EVIDENCE_MODE_INTEGRATION_GUIDE.md`
- **User Guide:** `EVIDENCE_MODE_README.md`
- **Diagrams:** `EVIDENCE_MODE_DIAGRAMS.md`
- **Testing Checklist:** `EVIDENCE_MODE_CHECKLIST.md`
- **Summary:** `EVIDENCE_MODE_DELIVERY.md`

## Support

For questions or issues:

1. Check documentation files above
2. Review code comments in implementation files
3. Test using checklist scenarios
4. Refer to integration examples

---

**Quick Reference Version:** 1.0  
**Last Updated:** January 1, 2026
