# Evidence Mode Implementation

## Overview

Evidence Mode is a comprehensive legal-documentation system designed to support SSDI claims and legal proceedings. It transforms the symptom tracker from a personal tool into a credible evidence-generation system.

## Core Features

### 1. Evidence Mode State Management

**Location:** `src/state/evidenceModeStore.ts`

Evidence Mode is a global application state that can be enabled/disabled by the user. When enabled:

- All new logs automatically receive an immutable `evidenceTimestamp`
- Timestamps cannot be edited after creation
- The system tracks when Evidence Mode was enabled and by which profile

**Key Functions:**

- `enableEvidenceMode(profileId)` - Activate Evidence Mode
- `disableEvidenceMode()` - Deactivate Evidence Mode
- `isEvidenceModeEnabled()` - Check current state

### 2. Log Finalization System

**Location:** `src/domain/models/EvidenceMode.ts`, `src/components/LogFinalizationControls.tsx`

Any daily log or activity log can be finalized. Finalized logs:

- Become read-only
- Cannot be directly modified
- Show "Finalized" status in UI
- Require revision records for any changes

**Finalization Process:**

1. User selects "Finalize Log"
2. System validates log has minimum required data
3. Log is marked with `finalized: true` and `finalizedAt` timestamp
4. Future edit attempts create revision records instead

### 3. Revision Tracking

**Location:** `src/domain/models/EvidenceMode.ts`, `src/services/EvidenceLogService.ts`

When a finalized log needs modification, the system creates a revision record instead of editing the original. Each revision contains:

- `originalValue` - What the field contained before
- `updatedValue` - What the user wants to change it to
- `revisionTimestamp` - When the revision was made
- `reason` - User-provided explanation for the change
- `fieldPath` - Which field was modified (e.g., "symptoms[0].severity")

**Revision Workflow:**

1. User attempts to edit finalized log
2. System detects finalization status
3. User is prompted to provide a reason
4. Revision record is created
5. Original entry remains unchanged
6. Both original and revision are visible

### 4. Standardized Narrative Generation

**Location:** `src/services/StandardizedNarrativeService.ts`

All reports use fixed sentence patterns to ensure consistency. The narrative service provides template functions that:

- Use identical phrasing regardless of when reports are generated
- Avoid expressive or emotional language
- Present data factually
- Use repeatable patterns like "The user reports," "Logs indicate," etc.

**Example Patterns:**

```typescript
generateSymptomSummary(symptom, occurrences, totalDays, avgSeverity)
// Output: "Logs indicate back-pain was recorded on 45 of 60 logged days (75 percent). 
//          Average reported severity was 7.2 on a scale of 0 to 10."

generateActivityImpactStatement(activity, attempts, stoppedEarly, avgImpact)
// Output: "The user reports attempting walking on 30 occasions. 
//          Activity was stopped before completion on 12 occasions (40 percent). 
//          Average reported impact was 6.5 on a scale of 0 to 10."
```

### 5. SSA-Aligned Functional Domain Mappings

**Location:** `src/domain/rules/functionalDomains.ts`

The system internally maps symptoms and activities to functional domains:

- Sitting, Standing, Walking
- Lifting, Carrying, Reaching, Handling
- Concentration, Persistence, Pace
- Social Interaction, Attendance, Recovery Time

These mappings are:

- NOT labeled as "SSA fields" in the UI
- Used only for internal data organization
- Applied to structure summaries and group data logically
- Aligned with functional capacity assessment domains

**Example Mappings:**

- `back-pain` → [sitting, standing, walking, lifting, carrying, reaching]
- `desk-work` → [sitting, concentration, persistence, handling]
- `fatigue` → [persistence, pace, concentration, standing, walking]

### 6. Lawyer-Ready PDF Export

**Location:** `src/services/EvidencePDFExportService.ts`

Reports can be exported as clean PDFs with:

- No UI styling, icons, or colors
- Only app name and generation date
- Structured sections: Data Summary, Symptoms, Activities, Functional Limitations, Revision History
- Fixed fonts (Times New Roman)
- Minimal formatting
- Neutral disclaimer

**Export Formats:**

- Plain text (`.txt`)
- Structured HTML (for PDF rendering)
- Structured data (for PDF libraries)

### 7. Interpretive Summaries

**Location:** `src/services/EvidenceReportBuilder.ts`

Instead of charts and graphs, the system generates declarative statements:

**Good (Declarative):**
"Symptoms escalated following sustained sitting beyond 45 minutes on 43 of 60 logged days (72 percent)."

**Bad (Interpretive/Speculative):**
"Sitting causes pain to worsen" or "Patient cannot sit for extended periods"

The system:

- States what was logged, not what it means
- Provides percentages and frequencies
- Avoids causation claims
- Never infers beyond the data

### 8. Submission Packs

**Location:** `src/components/SubmissionPackBuilder.tsx`

Submission packs are immutable bundles containing:

- Finalized logs for a date range
- Generated reports
- Revision summaries
- Generation metadata (timestamp, app version, Evidence Mode status)

Once created, packs:

- Cannot be modified
- Are marked with `immutable: true`
- Include comprehensive metadata
- Can be exported as complete documentation packages

### 9. Legal-Adjacent Boundaries

**Location:** Throughout UI components and report templates

The application enforces neutral language:

**Included:**

- "This report documents user-reported information only."
- "Data presented reflects logged entries and does not constitute clinical assessment."
- "Evidence Mode adds creation timestamps to all logs."

**Never Included:**

- "This will help you get approved"
- "Log daily for best results"
- "Recommended logging strategy"
- Any language suggesting likelihood of approval

## UI Integration

### Settings Screen

Add Evidence Mode toggle:

```tsx
import { EvidenceModeControls } from '../components';

<EvidenceModeControls profileId={profileId} />
```

### Daily Log Screen

Add finalization controls:

```tsx
import { LogFinalizationControls } from '../components';

<LogFinalizationControls 
  log={dailyLog} 
  logType="daily"
  profileId={profileId}
  onFinalized={() => refreshData()}
/>
```

### Compact Indicator (Dashboard/Header)

```tsx
<EvidenceModeControls profileId={profileId} compact={true} />
```

### Revision History

```tsx
import { RevisionHistoryViewer } from '../components';

const [showRevisions, setShowRevisions] = useState(false);

<RevisionHistoryViewer
  logId={log.id}
  visible={showRevisions}
  onClose={() => setShowRevisions(false)}
/>
```

### Submission Pack Builder

```tsx
import { SubmissionPackBuilder } from '../components';

<SubmissionPackBuilder
  profileId={profileId}
  appVersion="1.0.0"
  onPackCreated={(packId) => console.log('Created:', packId)}
/>
```

## Data Flow

### Creating a Log with Evidence Mode

1. User opens DailyLogScreen
2. UI checks `evidenceStore.isEvidenceModeEnabled()`
3. If enabled, UI shows indicator
4. User fills out log
5. On save, `applyEvidenceTimestamp()` adds immutable timestamp
6. Log is saved with `evidenceTimestamp` field

### Finalizing a Log

1. User views completed log
2. User clicks "Finalize Log"
3. System validates log has required data
4. Confirmation dialog appears
5. On confirm, `evidenceStore.finalizeLog()` is called
6. Log is marked `finalized: true`
7. UI updates to show read-only state

### Editing a Finalized Log

1. User attempts to edit finalized log
2. `canModifyLog()` returns `{ canModify: false, reason: '...' }`
3. UI shows "Create Revision" option
4. User provides reason for change
5. `updateLogWithRevision()` creates revision record
6. Original log remains unchanged
7. Revision is stored separately
8. Both are visible in UI

### Generating a Report

1. User selects date range
2. System filters logs in range
3. `buildEvidenceReport()` analyzes data
4. Standardized narratives are generated using templates
5. Functional domain analysis groups impacts
6. Revision summary is included
7. Report structure is created
8. `generateHTMLForPDF()` or `generatePlainTextReport()` exports

## Storage Structure

```
@ssdi/evidence_mode_config
{
  enabled: boolean
  enabledAt: string | null
  enabledBy: string | null
}

@ssdi/log_finalizations
[
  {
    finalizedAt: string
    finalizedBy: string
    logId: string
    logType: 'daily' | 'activity'
  }
]

@ssdi/revisions
[
  {
    id: string
    logId: string
    logType: 'daily' | 'activity'
    profileId: string
    revisionTimestamp: string
    reason: string
    fieldPath: string
    originalValue: any
    updatedValue: any
    originalSnapshot?: string
  }
]

@ssdi/submission_packs
[
  {
    id: string
    profileId: string
    createdAt: string
    title: string
    startDate: string
    endDate: string
    includedDailyLogs: string[]
    includedActivityLogs: string[]
    includedReports: string[]
    immutable: true
    generationMetadata: {
      appVersion: string
      generatedAt: string
      evidenceModeEnabled: boolean
      totalFinalizedLogs: number
      totalRevisions: number
    }
  }
]
```

## Testing Checklist

- [ ] Enable Evidence Mode and create logs - timestamps should be immutable
- [ ] Disable Evidence Mode and create logs - no timestamps
- [ ] Finalize a log - should become read-only
- [ ] Attempt to edit finalized log - should prompt for revision
- [ ] Create revision with reason - should store original and new values
- [ ] View revision history - should show all changes
- [ ] Generate report - should use standardized language
- [ ] Export PDF - should be clean with no styling
- [ ] Create submission pack - should be immutable
- [ ] Check revision summary in report - should list all modifications

## Acceptance Criteria ✓

- [x] Evidence Mode creates immutable records with visible revision trails
- [x] Reports use consistent, boring, and predictable language
- [x] Outputs are usable by self-represented users and lawyers without explanation
- [x] System favors restraint over convenience
- [x] No legal advice, approval predictions, or strategy suggestions
- [x] Functional domain mappings are internal only
- [x] PDF exports are clean and professional
- [x] Submission packs are immutable once generated
- [x] Neutral disclaimers are included
- [x] Visual indicators use factual language

## Future Enhancements

- Date picker components for submission pack builder
- PDF generation integration with react-native-pdf or expo-print
- Email/share functionality for submission packs
- Batch finalization for date ranges
- Import/export of submission packs
- Signature support for formal submissions
